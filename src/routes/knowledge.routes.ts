import type { FastifyInstance } from 'fastify';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { env } from '../config/env.js';
import { reindex, knowledgeStatus } from '../services/knowledge/store.js';
import { SUPPORTED } from '../services/knowledge/parse.js';
import { ensureDefaultUser } from '../lib/ensureUser.js';
import { assistantName } from '../config/assistant.js';

const KNOWLEDGE_DIR = path.resolve(process.cwd(), env.KNOWLEDGE_DIR);

/** Sanitiza um nome de pasta/arquivo (impede path traversal). */
function safeName(s: string): string {
  return s.replace(/[^\w.\- ]/g, '_').replace(/\.+/g, '.').trim();
}

const saveConversationSchema = z.object({
  folder: z.string().optional(),
  title: z.string().min(1),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).min(1),
});

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

  // Salva uma conversa como documento .md numa (sub)pasta da base de conhecimento
  app.post('/knowledge/save-conversation', async (request, reply) => {
    const parsed = saveConversationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: z.treeifyError(parsed.error) });
    }
    const { folder, title, messages } = parsed.data;

    const dir = folder ? path.join(KNOWLEDGE_DIR, safeName(folder)) : KNOWLEDGE_DIR;
    await mkdir(dir, { recursive: true });

    const user = await ensureDefaultUser();
    const nome = assistantName(user.settings?.assistantName);

    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `${safeName(title)} - ${stamp}.md`;
    const body = [
      `# ${title}`,
      `_Conversa salva em ${new Date().toLocaleString('pt-BR')}_`,
      '',
      ...messages.map((m) => `**${m.role === 'user' ? 'Você' : nome}:** ${m.content}`),
      '',
    ].join('\n\n');

    const rel = path.relative(KNOWLEDGE_DIR, path.join(dir, filename)).split(path.sep).join('/');
    await writeFile(path.join(dir, filename), body, 'utf-8');

    // Reindexa para a conversa já ficar pesquisável.
    const result = await reindex();
    return { saved: rel, reindex: result };
  });
}
