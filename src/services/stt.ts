import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { run, binAvailable } from './voice/proc.js';

/**
 * STT (Speech-to-Text) — Whisper.cpp.
 *
 * Se WHISPER_BIN e WHISPER_MODEL estiverem configurados no .env, transcreve de
 * verdade: converte o áudio para WAV 16kHz mono (ffmpeg) e roda o whisper.cpp.
 * Caso contrário, retorna uma transcrição simulada (stub) para manter a pipeline
 * funcional ponta a ponta.
 */

const TEMP_AUDIO_DIR = path.resolve(process.cwd(), 'temp_audio');

export interface TranscriptionResult {
  text: string;
  /** true quando veio do Whisper real; false quando é stub. */
  real: boolean;
}

/** As dependências do STT real estão configuradas e presentes? */
export function isSttConfigured(): boolean {
  return (
    binAvailable(env.WHISPER_BIN) &&
    Boolean(env.WHISPER_MODEL) &&
    existsSync(env.WHISPER_MODEL)
  );
}

function stubResult(filename: string): TranscriptionResult {
  return {
    text: `(transcrição simulada de "${filename}") Olá, quais são meus lembretes de hoje?`,
    real: false,
  };
}

export async function transcribeAudio(
  audio: Buffer,
  filename = 'audio'
): Promise<TranscriptionResult> {
  if (!isSttConfigured()) return stubResult(filename);

  await mkdir(TEMP_AUDIO_DIR, { recursive: true });
  const id = randomUUID();
  const inputPath = path.join(TEMP_AUDIO_DIR, `in-${id}`);
  const wavPath = path.join(TEMP_AUDIO_DIR, `in-${id}.wav`);
  const outPrefix = path.join(TEMP_AUDIO_DIR, `out-${id}`);
  const txtPath = `${outPrefix}.txt`;

  try {
    await writeFile(inputPath, audio);

    // 1) Converte para WAV 16kHz mono (formato exigido pelo whisper.cpp).
    const conv = await run(env.FFMPEG_BIN, [
      '-y',
      '-i',
      inputPath,
      '-ar',
      '16000',
      '-ac',
      '1',
      '-f',
      'wav',
      wavPath,
    ]);
    if (conv.code !== 0 || !existsSync(wavPath)) {
      console.error('[STT] ffmpeg falhou:', conv.stderr.slice(-300));
      return stubResult(filename);
    }

    // 2) Roda o whisper.cpp gerando um .txt com a transcrição.
    const whisper = await run(env.WHISPER_BIN, [
      '-m',
      env.WHISPER_MODEL,
      '-f',
      wavPath,
      '-l',
      env.WHISPER_LANG,
      '-otxt',
      '-of',
      outPrefix,
      '-nt',
    ]);
    if (whisper.code !== 0 || !existsSync(txtPath)) {
      console.error('[STT] whisper falhou:', whisper.stderr.slice(-300));
      return stubResult(filename);
    }

    const text = (await readFile(txtPath, 'utf-8')).trim();
    return { text: text || '(sem fala detectada)', real: true };
  } catch (err) {
    console.error('[STT] erro:', (err as Error).message);
    return stubResult(filename);
  } finally {
    // Limpa arquivos temporários.
    for (const f of [inputPath, wavPath, txtPath]) {
      await unlink(f).catch(() => {});
    }
  }
}
