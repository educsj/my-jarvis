import type { FastifyInstance } from 'fastify';
import path from 'node:path';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getDefaultUserId } from '../lib/ensureUser.js';
import { handleUserMessage } from '../services/chat.js';
import { isOllamaAvailable } from '../services/ollama.js';
import { transcribeAudio, isSttConfigured } from '../services/stt.js';
import { synthesizeSpeech, isTtsConfigured } from '../services/tts.js';
import { audit, readRecentLogs } from '../services/audit.js';

const messageRole = z.enum(['user', 'assistant', 'system', 'tool']);
const chatTextSchema = z.object({
  message: z.string().min(1),
  saveHistory: z.boolean().optional(),
  context: z.array(z.object({ role: messageRole, content: z.string() })).optional(),
});

/** URL tocável do áudio (só quando o TTS real gerou um .wav); senão null. */
function audioUrl(audioPath: string, real: boolean): string | null {
  return real ? `/audio/${path.basename(audioPath)}` : null;
}

export async function chatRoutes(app: FastifyInstance) {
  // GET /chat/status — o "cérebro" (Ollama) está disponível? Voz real ativa?
  app.get('/chat/status', async () => {
    return {
      brainOnline: await isOllamaAvailable(),
      sttReal: isSttConfigured(),
      ttsReal: isTtsConfigured(),
    };
  });

  // DELETE /chat/history — limpa o histórico de conversa (reseta o contexto)
  app.delete('/chat/history', async () => {
    const userId = await getDefaultUserId();
    await prisma.chatHistory.deleteMany({ where: { userId } });
    return { cleared: true };
  });

  // POST /chat — conversa por texto (útil para testar o cérebro + personalidade)
  app.post('/chat', async (request, reply) => {
    const parsed = chatTextSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Dados inválidos', details: z.treeifyError(parsed.error) });
    }

    try {
      const result = await handleUserMessage(parsed.data.message, {
        saveHistory: parsed.data.saveHistory,
        sessionContext: parsed.data.saveHistory === false ? (parsed.data.context ?? []) : undefined,
      });

      // Sintetiza a resposta em voz (Piper) para o cliente reproduzir.
      let url: string | null = null;
      if (result.reply) {
        const speech = await synthesizeSpeech(result.reply);
        url = audioUrl(speech.audioPath, speech.real);
      }

      return { ...result, audioUrl: url };
    } catch (err) {
      const message = (err as Error).message;
      await audit({ type: 'error', error: message, userText: parsed.data.message });
      return reply.status(500).send({ error: message });
    }
  });

  // GET /logs — auditoria: últimas interações de hoje (?limit=, ?errors=1)
  app.get('/logs', async (request) => {
    const q = z
      .object({ limit: z.coerce.number().max(500).optional(), errors: z.coerce.boolean().optional() })
      .parse(request.query);
    return { entries: await readRecentLogs(q.limit ?? 100, q.errors ?? false) };
  });

  // POST /chat/voice — pipeline de voz: áudio → STT → LLM (personalidade) → TTS → áudio
  app.post('/chat/voice', async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ error: 'Envie um arquivo de áudio no campo "audio".' });
    }

    const audioBuffer = await file.toBuffer();
    const saveHistory = (request.query as { saveHistory?: string }).saveHistory !== 'false';

    // 1. STT — transcreve o áudio recebido
    const transcription = await transcribeAudio(audioBuffer, file.filename);

    // 2. LLM — gera a resposta já com a personalidade correta
    const result = await handleUserMessage(transcription.text, { saveHistory });

    // 3. TTS — sintetiza a resposta em áudio
    const speech = await synthesizeSpeech(result.reply);

    return {
      transcription: transcription.text,
      transcriptionReal: transcription.real,
      reply: result.reply,
      model: result.model,
      ok: result.ok,
      personality: result.personality,
      toolsUsed: result.toolsUsed,
      coder: result.coder,
      previewUrl: result.previewUrl,
      audioPath: speech.audioPath,
      audioReal: speech.real,
      audioUrl: audioUrl(speech.audioPath, speech.real),
    };
  });
}
