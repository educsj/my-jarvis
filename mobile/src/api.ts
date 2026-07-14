import { API_URL } from './config';

/** Nome do assistente quando o usuário ainda não escolheu um (espelha o backend). */
export const DEFAULT_ASSISTANT_NAME = 'Meu Assistente';

export interface Settings {
  assistantName: string;
  humorLevel: number;
  empathyLevel: number;
  llmModel: string;
}

export interface VoiceReply {
  transcription: string;
  reply: string;
  model: string;
  ok: boolean;
  personality: { humorLevel: number; empathyLevel: number };
  audioPath: string;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  baseUrl: API_URL,

  health: () => fetch(`${API_URL}/health`).then((r) => r.ok),

  getSettings: () => fetch(`${API_URL}/settings`).then((r) => json<Settings>(r)),

  /** Envia texto ao cérebro (fallback quando não há áudio). */
  chatText: (message: string) =>
    fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }).then((r) => json<{ reply: string; ok: boolean }>(r)),

  /** Envia o áudio gravado para a pipeline de voz (STT → LLM → TTS). */
  chatVoice: async (uri: string): Promise<VoiceReply> => {
    const form = new FormData();
    // No React Native, arquivos em FormData usam { uri, name, type }.
    form.append('audio', {
      uri,
      name: 'speech.m4a',
      type: 'audio/m4a',
    } as unknown as Blob);

    const res = await fetch(`${API_URL}/chat/voice`, { method: 'POST', body: form });
    return json<VoiceReply>(res);
  },
};
