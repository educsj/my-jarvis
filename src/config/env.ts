import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  OLLAMA_BASE_URL: z.string().url().default('http://127.0.0.1:11434'),
  OLLAMA_MODEL: z.string().default('mannix/llama3.1-8b-abliterated:tools-q4_k_m'),

  // Voz (STT/TTS). Se vazios, os serviços usam os stubs simulados.
  FFMPEG_BIN: z.string().optional().default('ffmpeg'),
  WHISPER_BIN: z.string().optional().default(''),
  WHISPER_MODEL: z.string().optional().default(''),
  WHISPER_LANG: z.string().optional().default('pt'),
  PIPER_BIN: z.string().optional().default(''),
  PIPER_MODEL: z.string().optional().default(''),

  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_REDIRECT_URI: z
    .string()
    .optional()
    .default('http://localhost:3333/auth/google/callback'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', z.treeifyError(parsed.error));
  throw new Error('Configuração de ambiente inválida. Verifique seu arquivo .env');
}

export const env = parsed.data;
