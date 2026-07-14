/**
 * Detecção de intenção de programação e prompt do "modo coder".
 * Quando a mensagem parece ser sobre código, o chat roteia para o modelo
 * especializado (CODER_MODEL) em vez do modelo de personalidade.
 */

import { assistantName } from '../config/assistant.js';

const CODE_RE =
  /(```|\bc[óo]digo\b|\bprogram(a|ar|a[çc][ãa]o|ando)\b|\bfun[çc][ãa]o\b|\bfunction\b|\bscript\b|\bbug\b|\bdebug\b|\bcompil\w+|\brefator\w+|\balgoritmo\b|\bregex\b|\bendpoint\b|\bAPI REST\b|\bSQL\b|\bquery\b|\bstack ?trace\b|\bexception\b|\bpython\b|\bjavascript\b|\btypescript\b|\breact\b|\bnode(\.?js)?\b|\bc\+\+|\bc#|\bgolang\b|\brust\b|\bkotlin\b|\bswift\b|\bphp\b|\bruby\b|\bhtml\b|\bcss\b|\btailwind\w*|\bbootstrap\b|\blanding ?page\b|\bfront-?end\b|\bcomponente\b|\blayout\b|\bnavbar\b|\bhero section\b|\bcall.to.action\b|\bp[áa]gina\b|\bsite\b|\bdocker\b|\bkubernetes\b|console\.log|=>|def \w+\(|class \w+[\s({:]|import \w+ from|SELECT\b[\s\S]+\bFROM\b)/i;

/** A mensagem parece ser um pedido de programação? */
export function isCodingRequest(text: string): boolean {
  return CODE_RE.test(text);
}

/** System prompt do modo coder (técnico, sem a personalidade de conversa). */
export function coderSystemPrompt(name?: string): string {
  return [
    `Você se chama "${assistantName(name)}" e está em modo programador — um engenheiro de software sênior e especialista.`,
    'Responda com precisão técnica: código correto e idiomático em blocos markdown (```), explicações concisas e boas práticas.',
    'PÁGINAS/UI: ao gerar HTML, você PODE (e deve, quando fizer sentido) usar TailwindCSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) e bibliotecas populares por CDN — Google Fonts, Chart.js, Alpine.js, ícones (Lucide/Font Awesome), etc. O ambiente de preview renderiza recursos externos normalmente. Prefira um visual moderno, limpo e responsivo; use imagens de placeholder (ex.: https://picsum.photos/seed/xyz/800/600) quando precisar. Sempre entregue um documento HTML completo (com <!DOCTYPE html> e <head>) para poder ser renderizado direto.',
    'IDIOMA: responda no mesmo idioma da mensagem do usuário (English for English, português para português).',
    'Se faltar informação essencial, assuma o mais provável e diga qual suposição fez, ou peça só o detalhe crítico.',
    'Nunca invente APIs, funções ou bibliotecas que não existem. Se não tiver certeza, diga com honestidade.',
  ].join('\n');
}
