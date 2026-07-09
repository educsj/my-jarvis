import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * TTS (Text-to-Speech) — stub de integração com Piper TTS.
 *
 * Na implementação real, este módulo vai:
 *  1. Invocar o binário do Piper (via child_process) com um modelo de voz
 *     em português (ex.: pt_BR-faber-medium.onnx).
 *  2. Gerar um arquivo .wav em /temp_audio e retornar o caminho.
 *
 * Por ora, grava um arquivo .txt placeholder com o conteúdo falado, para que
 * a rota /chat/voice tenha um artefato de saída referenciável.
 */

const TEMP_AUDIO_DIR = path.resolve(process.cwd(), 'temp_audio');

export interface SynthesisResult {
  /** Caminho do arquivo de áudio gerado (relativo à raiz do projeto). */
  audioPath: string;
  /** true quando veio do Piper real; false quando é stub. */
  real: boolean;
}

export async function synthesizeSpeech(text: string): Promise<SynthesisResult> {
  // TODO(Fase 2+): integrar Piper TTS de verdade (saída .wav).
  await mkdir(TEMP_AUDIO_DIR, { recursive: true });

  const filename = `speech-${randomUUID()}.txt`;
  const fullPath = path.join(TEMP_AUDIO_DIR, filename);
  await writeFile(fullPath, text, 'utf-8');

  return {
    audioPath: path.join('temp_audio', filename),
    real: false,
  };
}
