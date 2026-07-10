import { prisma } from '../lib/prisma.js';
import { ensureDefaultUser } from '../lib/ensureUser.js';
import { buildSystemPrompt } from './personality.js';
import { chat as ollamaChat, type ChatMessage } from './ollama.js';
import { isGoogleConfigured } from './google/oauth.js';
import { calendarTools, runCalendarTool } from './google/tools.js';
import { search as searchKnowledge, type SearchHit } from './knowledge/store.js';
import { audit } from './audit.js';
import { detectLang } from './lang.js';
import { isCodingRequest, coderSystemPrompt } from './coding.js';
import { maybeCreatePreview } from './preview.js';
import { env } from '../config/env.js';

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
  /** Fontes da base de conhecimento usadas (RAG). */
  kbSources: string[];
  /** true quando a resposta veio do modelo especializado em programação. */
  coder: boolean;
  /** URL de preview ao vivo quando a resposta contém HTML (ou null). */
  previewUrl: string | null;
}

export interface ChatOptions {
  /** Se false, não persiste esta interação no ChatHistory (modo privado). */
  saveHistory?: boolean;
  /** Contexto da sessão enviado pelo cliente (usado no modo sem salvar). */
  sessionContext?: ChatMessage[];
}

/**
 * Fluxo central de conversa:
 *  1. Lê a personalidade atual do banco → System Prompt dinâmico.
 *  2. Recupera as últimas mensagens como contexto.
 *  3. Chama o Ollama, resolvendo chamadas de ferramenta (Google Calendar) em loop.
 *  4. Persiste a mensagem do usuário e a resposta final no ChatHistory.
 */
export async function handleUserMessage(
  userText: string,
  opts: ChatOptions = {}
): Promise<AssistantReply> {
  const started = Date.now();
  const user = await ensureDefaultUser();
  const settings = user.settings!;

  // Perguntas de programação usam o modelo coder + prompt técnico (sem personalidade).
  const coding = isCodingRequest(userText);
  const systemPrompt = coding
    ? coderSystemPrompt()
    : buildSystemPrompt({
        humorLevel: settings.humorLevel,
        empathyLevel: settings.empathyLevel,
        cautionLevel: settings.cautionLevel,
        objectivityLevel: settings.objectivityLevel,
        formalityLevel: settings.formalityLevel,
        proactivityLevel: settings.proactivityLevel,
      });

  // Contexto: usa o enviado pelo cliente (modo privado) ou o histórico do banco.
  let history: ChatMessage[];
  if (opts.sessionContext) {
    history = opts.sessionContext.slice(-HISTORY_LIMIT);
  } else {
    const recent = await prisma.chatHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
    });
    history = recent
      .reverse()
      .map((m) => ({ role: m.role as ChatMessage['role'], content: m.content }));
  }

  // RAG: busca trechos relevantes na base de conhecimento (silencioso se falhar/vazio).
  const kbHits = await searchKnowledge(userText).catch(() => [] as SearchHit[]);

  // Ordem de idioma logo antes da mensagem (recência vence o viés do histórico).
  const langDirective =
    detectLang(userText) === 'en'
      ? 'The user is writing in English. Reply ENTIRELY in English, regardless of the language of previous messages.'
      : 'O usuário está escrevendo em português. Responda INTEIRAMENTE em português.';

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(kbHits.length ? [{ role: 'system' as const, content: buildKnowledgeContext(kbHits) }] : []),
    ...history,
    { role: 'system', content: langDirective },
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
  const tools = !coding && isGoogleConfigured() && wantsCalendar ? calendarTools : undefined;
  const toolsUsed: string[] = [];

  // Modo coder → modelo especializado; senão, o modelo do banco (padrão do .env se vazio).
  const model = coding ? env.CODER_MODEL : settings.llmModel || undefined;

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

  // Persiste só quando o cérebro respondeu de verdade E o modo de salvar está
  // ativo (padrão). Evita poluir o contexto com fallbacks e respeita o modo privado.
  const willSave = result.ok && opts.saveHistory !== false;
  if (willSave) {
    await prisma.chatHistory.create({
      data: { userId: user.id, role: 'user', content: userText },
    });
    await prisma.chatHistory.create({
      data: { userId: user.id, role: 'assistant', content: result.content },
    });
  }

  // Se a resposta contém HTML, gera um preview ao vivo.
  const previewUrl = result.ok ? await maybeCreatePreview(result.content).catch(() => null) : null;

  const kbSources = [...new Set(kbHits.map((h) => h.source))];

  // Auditoria (nunca quebra a requisição).
  void audit({
    type: 'chat',
    ok: result.ok,
    model: result.model,
    ms: Date.now() - started,
    userText,
    reply: result.content,
    toolsUsed,
    kbSources,
    saved: willSave,
    coder: coding,
  });

  return {
    reply: result.content,
    model: result.model,
    ok: result.ok,
    personality: { humorLevel: settings.humorLevel, empathyLevel: settings.empathyLevel },
    toolsUsed,
    kbSources,
    coder: coding,
    previewUrl,
  };
}
