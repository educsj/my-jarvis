import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ensureDefaultUser } from '../lib/ensureUser.js';

const updateSettingsSchema = z.object({
  humorLevel: z.number().int().min(0).max(100).optional(),
  empathyLevel: z.number().int().min(0).max(100).optional(),
  llmModel: z.string().min(1).optional(),
});

export async function settingsRoutes(app: FastifyInstance) {
  // GET /settings — lê a matriz de personalidade
  app.get('/settings', async () => {
    const user = await ensureDefaultUser();
    return user.settings;
  });

  // PUT /settings — ajusta Humor / Empatia (sliders do painel)
  app.put('/settings', async (request, reply) => {
    const parsed = updateSettingsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: z.treeifyError(parsed.error) });
    }

    const user = await ensureDefaultUser();
    const updated = await prisma.settings.update({
      where: { userId: user.id },
      data: parsed.data,
    });

    return updated;
  });
}
