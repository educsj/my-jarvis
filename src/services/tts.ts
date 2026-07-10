import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { run, binAvailable } from './voice/proc.js';
import { toSpeakableText } from './voice/speakable.js';
import { pickVoiceForText } from './voice/voices.js';
import { detectLang } from './lang.js';

/**
 * TTS (Text-to-Speech) — Piper.
 *
 * Se PIPER_BIN e PIPER_MODEL estiverem configurados no .env, sintetiza um .wav
 * de verdade com uma voz em português. Caso contrário, grava um .txt placeholder
 * (stub) para manter a rota /chat/voice com um artefato de saída.
 */

const TEMP_AUDIO_DIR = path.resolve(process.cwd(), 'temp_audio');

export interface SynthesisResult {
  /** Caminho do arquivo gerado, relativo à raiz do projeto. */
  audioPath: string;
  /** true quando veio do Piper real; false quando é stub. */
  real: boolean;
}

/** As dependências do TTS real estão configuradas e presentes? */
export function isTtsConfigured(): boolean {
  return (
    binAvailable(env.PIPER_BIN) && Boolean(env.PIPER_MODEL) && existsSync(env.PIPER_MODEL)
  );
}

export async function synthesizeSpeech(rawText: string): Promise<SynthesisResult> {
  // Normaliza horários ("13:00" → "treze horas") só em português.
  const text = detectLang(rawText) === 'pt' ? toSpeakableText(rawText) : rawText;
  await mkdir(TEMP_AUDIO_DIR, { recursive: true });

  if (!isTtsConfigured()) {
    const filename = `speech-${randomUUID()}.txt`;
    await writeFile(path.join(TEMP_AUDIO_DIR, filename), text, 'utf-8');
    return { audioPath: path.join('temp_audio', filename), real: false };
  }

  const filename = `speech-${randomUUID()}.wav`;
  const fullPath = path.join(TEMP_AUDIO_DIR, filename);

  try {
    // Voz do idioma do texto (evita ler PT com voz EN e vice-versa).
    const voice = await pickVoiceForText(rawText);
    // Piper lê o texto pelo stdin e grava o WAV no caminho de --output_file.
    const result = await run(env.PIPER_BIN, ['-m', voice, '-f', fullPath], text);
    if (result.code !== 0 || !existsSync(fullPath)) {
      console.error('[TTS] piper falhou:', result.stderr.slice(-300));
      const txt = `speech-${randomUUID()}.txt`;
      await writeFile(path.join(TEMP_AUDIO_DIR, txt), text, 'utf-8');
      return { audioPath: path.join('temp_audio', txt), real: false };
    }
    return { audioPath: path.join('temp_audio', filename), real: true };
  } catch (err) {
    console.error('[TTS] erro:', (err as Error).message);
    const txt = `speech-${randomUUID()}.txt`;
    await writeFile(path.join(TEMP_AUDIO_DIR, txt), text, 'utf-8');
    return { audioPath: path.join('temp_audio', txt), real: false };
  }
}
