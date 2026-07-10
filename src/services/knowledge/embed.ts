import { env } from '../../config/env.js';

/**
 * Gera o embedding de um texto via Ollama. O nomic-embed-text recomenda
 * prefixos "search_document:" (documentos) e "search_query:" (consultas).
 */
async function embedRaw(text: string): Promise<number[]> {
  const res = await fetch(`${env.OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: env.EMBED_MODEL, prompt: text }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Embeddings (${env.EMBED_MODEL}) falhou: ${res.status} ${t.slice(0, 150)}`);
  }
  const data = (await res.json()) as { embedding: number[] };
  return data.embedding;
}

export const embedDocument = (text: string) => embedRaw(`search_document: ${text}`);
export const embedQuery = (text: string) => embedRaw(`search_query: ${text}`);

/** Similaridade do cosseno entre dois vetores. */
export function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}
