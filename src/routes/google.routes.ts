import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  generateAuthUrl,
  exchangeCodeForTokens,
  isGoogleConfigured,
  GoogleNotConfiguredError,
} from '../services/google/oauth.js';
import { hasTokens, clearTokens } from '../services/google/tokenStore.js';
import { listEventsForDay, createEvent } from '../services/google/calendar.js';

const callbackSchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
});

const createEventSchema = z.object({
  summary: z.string().min(1),
  startDateTime: z.string().min(1),
  endDateTime: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

export async function googleRoutes(app: FastifyInstance) {
  // Status da conexão com o Google Calendar
  app.get('/auth/google/status', async () => {
    return {
      configured: isGoogleConfigured(),
      connected: isGoogleConfigured() ? await hasTokens() : false,
    };
  });

  // Inicia o fluxo OAuth2 → redireciona para o consentimento do Google
  app.get('/auth/google', async (_request, reply) => {
    try {
      return reply.redirect(generateAuthUrl());
    } catch (err) {
      if (err instanceof GoogleNotConfiguredError) {
        return reply.status(503).send({ error: err.message });
      }
      throw err;
    }
  });

  // Callback do OAuth2 → troca o code por tokens
  app.get('/auth/google/callback', async (request, reply) => {
    const parsed = callbackSchema.safeParse(request.query);
    if (!parsed.success || parsed.data.error) {
      return reply.status(400).send({
        error: 'Autorização negada ou inválida',
        details: parsed.data?.error,
      });
    }
    if (!parsed.data.code) {
      return reply.status(400).send({ error: 'Parâmetro "code" ausente.' });
    }

    try {
      await exchangeCodeForTokens(parsed.data.code);
      return reply
        .type('text/html')
        .send(
          '<h2>✅ Google Calendar conectado!</h2><p>Pode fechar esta aba e voltar ao Jarvis.</p>'
        );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return reply.status(500).send({ error: 'Falha ao trocar o code por tokens', message });
    }
  });

  // Desconecta (remove tokens)
  app.delete('/auth/google', async () => {
    await clearTokens();
    return { disconnected: true };
  });

  // Eventos do dia (padrão: hoje). Aceita ?date=YYYY-MM-DD
  app.get('/calendar/today', async (request, reply) => {
    const { date } = z.object({ date: z.string().optional() }).parse(request.query);
    try {
      const events = await listEventsForDay(date ? new Date(date) : new Date());
      return { events };
    } catch (err) {
      return reply.status(409).send({ error: (err as Error).message });
    }
  });

  // Cria um evento diretamente (sem passar pelo LLM)
  app.post('/calendar/events', async (request, reply) => {
    const parsed = createEventSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Dados inválidos', details: z.treeifyError(parsed.error) });
    }
    try {
      const event = await createEvent(parsed.data);
      return reply.status(201).send(event);
    } catch (err) {
      return reply.status(409).send({ error: (err as Error).message });
    }
  });
}
