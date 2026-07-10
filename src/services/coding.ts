/**
 * Detecção de intenção de programação e prompt do "modo coder".
 * Quando a mensagem parece ser sobre código, o chat roteia para o modelo
 * especializado (CODER_MODEL) em vez do modelo de personalidade.
 */

const CODE_RE =
  /(```|\bc[óo]digo\b|\bprogram(a|ar|a[çc][ãa]o|ando)\b|\bfun[çc][ãa]o\b|\bfunction\b|\bscript\b|\bbug\b|\bdebug\b|\bcompil\w+|\brefator\w+|\balgoritmo\b|\bregex\b|\bendpoint\b|\bAPI REST\b|\bSQL\b|\bquery\b|\bstack ?trace\b|\bexception\b|\bpython\b|\bjavascript\b|\btypescript\b|\breact\b|\bnode(\.?js)?\b|\bc\+\+|\bc#|\bgolang\b|\brust\b|\bkotlin\b|\bswift\b|\bphp\b|\bruby\b|\bhtml\b|\bcss\b|\bdocker\b|\bkubernetes\b|console\.log|=>|def \w+\(|class \w+[\s({:]|import \w+ from|SELECT\b[\s\S]+\bFROM\b)/i;

/** A mensagem parece ser um pedido de programação? */
export function isCodingRequest(text: string): boolean {
  return CODE_RE.test(text);
}

/** System prompt do modo coder (técnico, sem a personalidade de conversa). */
export function coderSystemPrompt(): string {
  return [
    'Você é o "Jarvis" em modo programador — um engenheiro de software sênior e especialista.',
    'Responda com precisão técnica: código correto e idiomático em blocos markdown (```), explicações concisas e boas práticas.',
    'IDIOMA: responda no mesmo idioma da mensagem do usuário (English for English, português para português).',
    'Se faltar informação essencial, assuma o mais provável e diga qual suposição fez, ou peça só o detalhe crítico.',
    'Nunca invente APIs, funções ou bibliotecas que não existem. Se não tiver certeza, diga com honestidade.',
  ].join('\n');
}
