import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { handleUserMessage } from '../services/chat.js';
import { isOllamaAvailable } from '../services/ollama.js';
import { transcribeAudio, isSttConfigured } from '../services/stt.js';
import { synthesizeSpeech, isTtsConfigured } from '../services/tts.js';

const chatTextSchema = z.object({
  message: z.string().min(1),
});

export async function chatRoutes(app: FastifyInstance) {
  // GET /chat/status — o "cérebro" (Ollama) está disponível? Voz real ativa?
  app.get('/chat/status', async () => {
    return {
      brainOnline: await isOllamaAvailable(),
      sttReal: isSttConfigured(),
      ttsReal: isTtsConfigured(),
    };
  });

  // POST /chat — conversa por texto (útil para testar o cérebro + personalidade)
  app.post('/chat', async (request, reply) => {
    const parsed = chatTextSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Dados inválidos', details: z.treeifyError(parsed.error) });
    }

    const result = await handleUserMessage(parsed.data.message);
    return result;
  });

  // POST /chat/voice — pipeline de voz: áudio → STT → LLM (personalidade) → TTS → áudio
  app.post('/chat/voice', async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ error: 'Envie um arquivo de áudio no campo "audio".' });
    }

    const audioBuffer = await file.toBuffer();

    // 1. STT — transcreve o áudio recebido
    const transcription = await transcribeAudio(audioBuffer, file.filename);

    // 2. LLM — gera a resposta já com a personalidade correta
    const result = await handleUserMessage(transcription.text);

    // 3. TTS — sintetiza a resposta em áudio
    const speech = await synthesizeSpeech(result.reply);

    return {
      transcription: transcription.text,
      transcriptionReal: transcription.real,
      reply: result.reply,
      model: result.model,
      ok: result.ok,
      personality: result.personality,
      audioPath: speech.audioPath,
      audioReal: speech.real,
    };
  });
}
