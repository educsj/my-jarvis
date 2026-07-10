/**
 * Detecção simples de idioma (pt/en) por heurística — suficiente para decidir
 * o idioma da resposta e a voz do TTS sem depender de biblioteca externa.
 */
export type DetectedLang = 'pt' | 'en';

const PT_RE =
  /[ãõçáéíóúâêô]|\b(você|voce|não|nao|está|estao|sou|então|entao|também|tambem|obrigad\w*|olá|ola|bom dia|boa (tarde|noite)|agenda|lembrete|por ?que|isso|isto|nós|nao|com você|meu|minha|hoje|amanhã|amanha)\b/gi;

const EN_RE =
  /\b(the|you|your|you're|are|is|can|could|help|with|what|which|write|code|please|hello|hi|thanks|thank you|about|today|would|should|i'm|i am|do you|let's|okay)\b/gi;

/** Retorna o idioma predominante do texto (padrão: pt). */
export function detectLang(text: string): DetectedLang {
  const pt = (text.match(PT_RE) || []).length;
  const en = (text.match(EN_RE) || []).length;
  if (en > pt) return 'en';
  return 'pt';
}
