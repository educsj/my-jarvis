import type { FastifyInstance } from 'fastify';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { reindex, knowledgeStatus } from '../services/knowledge/store.js';
import { SUPPORTED } from '../services/knowledge/parse.js';

const KNOWLEDGE_DIR = path.resolve(process.cwd(), env.KNOWLEDGE_DIR);

export async function knowledgeRoutes(app: FastifyInstance) {
  // Status do índice (nº de arquivos/trechos e a pasta usada)
  app.get('/knowledge/status', async () => knowledgeStatus());

  // Reindexa a pasta de conhecimento (lê, quebra em trechos e gera embeddings)
  app.post('/knowledge/reindex', async (_request, reply) => {
    try {
      const result = await reindex();
      return result;
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // Upload de arquivos para a pasta de conhecimento (multipart, 1+ arquivos)
  app.post('/knowledge/upload', async (request, reply) => {
    await mkdir(KNOWLEDGE_DIR, { recursive: true });
    const saved: string[] = [];
    const rejected: string[] = [];

    try {
      for await (const part of request.files()) {
        const ext = path.extname(part.filename).toLowerCase();
        const buf = await part.toBuffer(); // sempre drena o stream
        if (!SUPPORTED.includes(ext)) {
          rejected.push(part.filename);
          continue;
        }
        const safe = path.basename(part.filename).replace(/[^\w.\- ]/g, '_');
        await writeFile(path.join(KNOWLEDGE_DIR, safe), buf);
        saved.push(safe);
      }
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }

    return { saved, rejected };
  });
}
