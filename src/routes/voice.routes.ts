import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { listVoices, getSelectedVoicePath, setSelectedVoice } from '../services/voice/voices.js';

export async function voiceRoutes(app: FastifyInstance) {
  // Lista as vozes disponíveis + a voz ativa
  app.get('/voices', async () => {
    const [voices, selected] = await Promise.all([listVoices(), getSelectedVoicePath()]);
    return { voices, selected };
  });

  // Seleciona a voz ativa (por caminho absoluto de um .onnx)
  app.put('/voices/select', async (request, reply) => {
    const parsed = z.object({ path: z.string().min(1) }).safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Informe o caminho da voz.' });
    }
    try {
      await setSelectedVoice(parsed.data.path);
      return { selected: parsed.data.path };
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });
}
