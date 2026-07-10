import type { FastifyInstance } from 'fastify';
import { reindex, knowledgeStatus } from '../services/knowledge/store.js';

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
}
