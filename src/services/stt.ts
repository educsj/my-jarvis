/**
 * STT (Speech-to-Text) — stub de integração com Whisper.cpp.
 *
 * Na implementação real, este módulo vai:
 *  1. Salvar o buffer de áudio recebido em /temp_audio.
 *  2. Invocar o binário do whisper.cpp (via child_process) apontando para
 *     um modelo local (ex.: ggml-base.bin).
 *  3. Ler o texto transcrito e retorná-lo.
 *
 * Por ora, retorna uma transcrição simulada para permitir testar a pipeline
 * completa (áudio → texto → LLM → áudio) ponta a ponta.
 */

export interface TranscriptionResult {
  text: string;
  /** true quando veio do Whisper real; false quando é stub. */
  real: boolean;
}

export async function transcribeAudio(
  audio: Buffer,
  filename = 'audio'
): Promise<TranscriptionResult> {
  // TODO(Fase 2+): integrar whisper.cpp de verdade.
  void audio;

  return {
    text: `(transcrição simulada de "${filename}") Olá Jarvis, quais são meus lembretes de hoje?`,
    real: false,
  };
}
