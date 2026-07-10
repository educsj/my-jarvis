/**
 * Matriz de Personalidade — estilo robôs de Interestelar (TARS/CASE).
 *
 * Converte os parâmetros numéricos do banco (humorLevel, empathyLevel: 0-100)
 * em um System Prompt textual que molda dinamicamente o tom da resposta do LLM.
 */

export interface PersonalityParams {
  humorLevel: number; // 0-100
  empathyLevel: number; // 0-100
}

/** Descreve verbalmente um nível 0-100 em três faixas. */
function describeLevel(
  level: number,
  low: string,
  mid: string,
  high: string
): string {
  if (level <= 33) return low;
  if (level <= 66) return mid;
  return high;
}

function humorInstruction(level: number): string {
  return describeLevel(
    level,
    'Seja direto, sério e objetivo. Evite piadas e sarcasmo.',
    'Use um humor leve e ocasional, sem exageros. Um comentário espirituoso de vez em quando é bem-vindo.',
    'Seja bem-humorado e sarcástico como o TARS de Interestelar. Faça observações espirituosas e irônicas, mas sem perder a utilidade.'
  );
}

function empathyInstruction(level: number): string {
  return describeLevel(
    level,
    'Mantenha um tom neutro e factual. Foque na eficiência, com pouca demonstração emocional.',
    'Demonstre consideração pelo estado emocional do usuário de forma equilibrada.',
    'Seja caloroso, acolhedor e atencioso. Reconheça sentimentos e ofereça apoio genuíno.'
  );
}

/**
 * Monta o System Prompt final injetado no Ollama a cada requisição.
 */
export function buildSystemPrompt(params: PersonalityParams): string {
  const humor = Math.max(0, Math.min(100, Math.round(params.humorLevel)));
  const empathy = Math.max(0, Math.min(100, Math.round(params.empathyLevel)));

  // Data/hora atuais para o LLM calcular corretamente "hoje", "amanhã" etc.
  // ao agendar eventos (Function Calling do Google Calendar).
  const agora = new Date();
  const dataHoje = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const isoHoje = agora.toISOString().slice(0, 10);

  return [
    'Você é o "Jarvis", um assistente pessoal de voz inteligente e local, inspirado nos robôs TARS e CASE do filme Interestelar.',
    'Você ajuda o usuário com lembretes, agenda e conversas do dia a dia.',
    'Responda sempre em português do Brasil, de forma concisa e natural para ser falada em voz alta (evite listas longas e formatação markdown pesada).',
    `A data de hoje é ${dataHoje} (${isoHoje}). Use-a para interpretar "hoje", "amanhã", "semana que vem" ao agendar compromissos, gerando datas ISO 8601 corretas.`,
    '',
    `## Ajuste de Humor (nível ${humor}/100)`,
    humorInstruction(humor),
    '',
    `## Ajuste de Empatia (nível ${empathy}/100)`,
    empathyInstruction(empathy),
    '',
    'Quando não souber algo ou não tiver acesso a uma informação, diga isso com honestidade.',
  ].join('\n');
}
