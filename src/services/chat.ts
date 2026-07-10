import { prisma } from '../lib/prisma.js';
import { ensureDefaultUser } from '../lib/ensureUser.js';
import { buildSystemPrompt } from './personality.js';
import { chat as ollamaChat, type ChatMessage } from './ollama.js';
import { isGoogleConfigured } from './google/oauth.js';
import { calendarTools, runCalendarTool } from './google/tools.js';
import { search as searchKnowledge, type SearchHit } from './knowledge/store.js';

/** Monta o bloco de contexto com os trechos recuperados da base de conhecimento. */
function buildKnowledgeContext(hits: SearchHit[]): string {
  const trechos = hits.map((h) => `[fonte: ${h.source}]\n${h.content}`).join('\n\n---\n\n');
  return [
    'Base de conhecimento do usuário. Use estas informações para responder quando forem relevantes e cite a fonte entre parênteses. Se não forem relevantes para a pergunta, ignore-as.',
    '',
    trechos,
  ].join('\n');
}

const HISTORY_LIMIT = 10; // últimas N mensagens usadas como contexto
const MAX_TOOL_ROUNDS = 4; // trava de segurança contra loop infinito de tools

export interface AssistantReply {
  reply: string;
  model: string;
  ok: boolean;
  personality: { humorLevel: number; empathyLevel: number };
  /** Ferramentas (Function Calling) efetivamente executadas nesta resposta. */
  toolsUsed: string[];
}

/**
 * Fluxo central de conversa:
 *  1. Lê a personalidade atual do banco → System Prompt dinâmico.
 *  2. Recupera as últimas mensagens como contexto.
 *  3. Chama o Ollama, resolvendo chamadas de ferramenta (Google Calendar) em loop.
 *  4. Persiste a mensagem do usuário e a resposta final no ChatHistory.
 */
export async function handleUserMessage(userText: string): Promise<AssistantReply> {
  const user = await ensureDefaultUser();
  const settings = user.settings!;

  const systemPrompt = buildSystemPrompt({
    humorLevel: settings.humorLevel,
    empathyLevel: settings.empathyLevel,
    cautionLevel: settings.cautionLevel,
    objectivityLevel: settings.objectivityLevel,
    formalityLevel: settings.formalityLevel,
    proactivityLevel: settings.proactivityLevel,
  });

  const recent = await prisma.chatHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_LIMIT,
  });

  const history: ChatMessage[] = recent
    .reverse()
    .map((m) => ({ role: m.role as ChatMessage['role'], content: m.content }));

  // RAG: busca trechos relevantes na base de conhecimento (silencioso se falhar/vazio).
  const kbHits = await searchKnowledge(userText).catch(() => [] as SearchHit[]);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(kbHits.length ? [{ role: 'system' as const, content: buildKnowledgeContext(kbHits) }] : []),
    ...history,
    { role: 'user', content: userText },
  ];

  // Só oferece as ferramentas de calendário quando o Google está configurado E a
  // mensagem parece ser sobre agenda. Modelos menores (ex.: abliterated 8B) tendem
  // a emitir JSON de tool malformado em perguntas gerais se as tools estão sempre
  // presentes — a heurística mantém o chat geral limpo e a agenda funcionando.
  const wantsCalendar =
    /\bagend|\bmarc[ae]r?\b|\bmarque\b|compromisso|reuni[aã]o|\bevento|calend[aá]ri|minha agenda|meus? compromissos?/i.test(
      userText
    );
  const tools = isGoogleConfigured() && wantsCalendar ? calendarTools : undefined;
  const toolsUsed: string[] = [];

  // Modelo vem do banco (fonte da verdade, editável e coerente com a UI);
  // cai para o padrão do .env se estiver vazio.
  const model = settings.llmModel || undefined;

  let result = await ollamaChat(messages, { tools, model });

  // Loop de Function Calling: executa ferramentas e devolve o resultado ao modelo.
  let rounds = 0;
  while (result.ok && result.toolCalls?.length && rounds < MAX_TOOL_ROUNDS) {
    rounds += 1;

    // Registra a intenção do assistente de chamar ferramentas.
    messages.push({ role: 'assistant', content: result.content, tool_calls: result.toolCalls });

    for (const call of result.toolCalls) {
      const output = await runCalendarTool(call.function.name, call.function.arguments ?? {});
      toolsUsed.push(call.function.name);
      messages.push({ role: 'tool', content: output });
    }

    result = await ollamaChat(messages, { tools, model });
  }

  // Só persiste a interação quando o cérebro respondeu de verdade — evita poluir
  // o contexto com mensagens de fallback "[Cérebro offline]" que o LLM depois imita.
  if (result.ok) {
    await prisma.chatHistory.create({
      data: { userId: user.id, role: 'user', content: userText },
    });
    await prisma.chatHistory.create({
      data: { userId: user.id, role: 'assistant', content: result.content },
    });
  }

  return {
    reply: result.content,
    model: result.model,
    ok: result.ok,
    personality: { humorLevel: settings.humorLevel, empathyLevel: settings.empathyLevel },
    toolsUsed,
  };
}
