const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3333';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.error ?? `Erro ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

// ---- Tipos (espelham o backend) ----
export interface Settings {
  id: string;
  humorLevel: number;
  empathyLevel: number;
  cautionLevel: number;
  objectivityLevel: number;
  formalityLevel: number;
  proactivityLevel: number;
  llmModel: string;
}

/** Chaves numéricas de personalidade que podem ser ajustadas nos sliders. */
export type PersonalityKey =
  | 'humorLevel'
  | 'empathyLevel'
  | 'cautionLevel'
  | 'objectivityLevel'
  | 'formalityLevel'
  | 'proactivityLevel';

export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
}

export interface ChatReply {
  reply: string;
  model: string;
  ok: boolean;
  personality: { humorLevel: number; empathyLevel: number };
  toolsUsed: string[];
  /** URL do áudio TTS da resposta (Piper), ou null se indisponível. */
  audioUrl: string | null;
}

export interface VoiceReply extends ChatReply {
  transcription: string;
  transcriptionReal: boolean;
  audioPath: string;
  audioReal: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start?: string;
  end?: string;
  location?: string;
}

export interface GoogleStatus {
  configured: boolean;
  connected: boolean;
}

// ---- Endpoints ----
export const api = {
  health: () => request<{ status: string; service: string }>('/health'),
  brainStatus: () => request<{ brainOnline: boolean }>('/chat/status'),

  getSettings: () => request<Settings>('/settings'),
  updateSettings: (data: Partial<Record<PersonalityKey, number> & { llmModel: string }>) =>
    request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  listReminders: () => request<Reminder[]>('/reminders'),
  createReminder: (data: { title: string; description?: string; dueDate?: string }) =>
    request<Reminder>('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id: string, data: Partial<Pick<Reminder, 'title' | 'completed'>>) =>
    request<Reminder>(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReminder: (id: string) => request<void>(`/reminders/${id}`, { method: 'DELETE' }),

  chat: (message: string) =>
    request<ChatReply>('/chat', { method: 'POST', body: JSON.stringify({ message }) }),

  // Envia o áudio gravado para a pipeline de voz (STT → LLM → TTS).
  // Sem header Content-Type: o browser define o boundary do multipart.
  chatVoice: async (blob: Blob): Promise<VoiceReply> => {
    const form = new FormData();
    form.append('audio', blob, 'speech.webm');
    const res = await fetch(`${BASE_URL}/chat/voice`, { method: 'POST', body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body?.error ?? `Erro ${res.status}`);
    }
    return res.json() as Promise<VoiceReply>;
  },

  googleStatus: () => request<GoogleStatus>('/auth/google/status'),
  calendarToday: () => request<{ events: CalendarEvent[] }>('/calendar/today'),

  baseUrl: BASE_URL,
};
