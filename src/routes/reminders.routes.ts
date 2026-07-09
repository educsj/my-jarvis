import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getDefaultUserId } from '../lib/ensureUser.js';

const createReminderSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

const updateReminderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullish(),
  dueDate: z.coerce.date().nullish(),
  completed: z.boolean().optional(),
});

const idParamSchema = z.object({ id: z.string().min(1) });

export async function remindersRoutes(app: FastifyInstance) {
  // GET /reminders — lista todos
  app.get('/reminders', async () => {
    const userId = await getDefaultUserId();
    return prisma.reminder.findMany({
      where: { userId },
      orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  });

  // GET /reminders/:id — busca um
  app.get('/reminders/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const userId = await getDefaultUserId();
    const reminder = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!reminder) return reply.status(404).send({ error: 'Lembrete não encontrado' });
    return reminder;
  });

  // POST /reminders — cria
  app.post('/reminders', async (request, reply) => {
    const parsed = createReminderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: z.treeifyError(parsed.error) });
    }
    const userId = await getDefaultUserId();
    const reminder = await prisma.reminder.create({
      data: { ...parsed.data, userId },
    });
    return reply.status(201).send(reminder);
  });

  // PUT /reminders/:id — atualiza
  app.put('/reminders/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const parsed = updateReminderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: z.treeifyError(parsed.error) });
    }
    const userId = await getDefaultUserId();
    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) return reply.status(404).send({ error: 'Lembrete não encontrado' });

    const updated = await prisma.reminder.update({ where: { id }, data: parsed.data });
    return updated;
  });

  // DELETE /reminders/:id — remove
  app.delete('/reminders/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const userId = await getDefaultUserId();
    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) return reply.status(404).send({ error: 'Lembrete não encontrado' });

    await prisma.reminder.delete({ where: { id } });
    return reply.status(204).send();
  });
}
