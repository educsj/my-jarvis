import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { extractFileText, SUPPORTED } from './parse.js';
import { embedDocument, embedQuery, cosineSim } from './embed.js';

const KNOWLEDGE_DIR = path.resolve(process.cwd(), env.KNOWLEDGE_DIR);

/** Quebra o texto em pedaços com sobreposição para indexação. */
function chunkText(text: string, size = 900, overlap = 150): string[] {
  const clean = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  if (clean.length <= size) return clean.length > 20 ? [clean] : [];
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += size - overlap) {
    const piece = clean.slice(i, i + size).trim();
    if (piece.length > 20) chunks.push(piece);
    if (i + size >= clean.length) break;
  }
  return chunks;
}

async function listFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await listFiles(full)));
    else if (SUPPORTED.includes(path.extname(e.name).toLowerCase())) files.push(full);
  }
  return files;
}

export interface ReindexResult {
  files: number;
  chunks: number;
  errors: string[];
}

/** Reindexa toda a pasta de conhecimento (substitui o índice atual). */
export async function reindex(): Promise<ReindexResult> {
  const files = await listFiles(KNOWLEDGE_DIR);
  const errors: string[] = [];
  await prisma.knowledgeChunk.deleteMany({});

  let chunkCount = 0;
  for (const file of files) {
    const rel = path.relative(KNOWLEDGE_DIR, file).split(path.sep).join('/');
    try {
      const text = await extractFileText(file);
      const chunks = chunkText(text);
      for (let i = 0; i < chunks.length; i++) {
        const vec = await embedDocument(chunks[i]);
        await prisma.knowledgeChunk.create({
          data: { source: rel, chunkIndex: i, content: chunks[i], embedding: JSON.stringify(vec) },
        });
        chunkCount++;
      }
    } catch (err) {
      errors.push(`${rel}: ${(err as Error).message}`);
    }
  }
  return { files: files.length, chunks: chunkCount, errors };
}

export interface SearchHit {
  source: string;
  content: string;
  score: number;
}

/** Busca os trechos mais relevantes para uma consulta (RAG). */
export async function search(query: string, topK = 4, minScore = 0.6): Promise<SearchHit[]> {
  const all = await prisma.knowledgeChunk.findMany();
  if (all.length === 0) return [];

  const qvec = await embedQuery(query);
  const scored = all.map((c) => ({
    source: c.source,
    content: c.content,
    score: cosineSim(qvec, JSON.parse(c.embedding) as number[]),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter((h) => h.score >= minScore);
}

export async function knowledgeStatus() {
  const chunks = await prisma.knowledgeChunk.count();
  const sources = await prisma.knowledgeChunk.findMany({
    select: { source: true },
    distinct: ['source'],
  });
  return { chunks, files: sources.length, sources: sources.map((s) => s.source), dir: KNOWLEDGE_DIR };
}
