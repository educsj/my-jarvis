/** Nome padrão do assistente quando o usuário ainda não escolheu um. */
export const DEFAULT_ASSISTANT_NAME = 'Meu Assistente';

/** Limite do nome editável — cabe no cabeçalho do painel e nos prompts. */
export const ASSISTANT_NAME_MAX = 32;

/** Normaliza o nome vindo do usuário/banco, caindo no padrão quando vazio. */
export function assistantName(raw?: string | null): string {
  return raw?.trim() || DEFAULT_ASSISTANT_NAME;
}
