const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3333';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    // Só declara JSON quando há corpo — um DELETE (sem body) com este header
    // faz o Fastify responder 400 (FST_ERR_CTP_EMPTY_JSON_BODY).
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
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
  /** true quando a resposta veio do modelo especializado em programação. */
  coder: boolean;
  /** URL do áudio TTS da resposta (Piper), ou null se indisponível. */
  audioUrl: string | null;
}

export interface VoiceReply extends ChatReply {
  transcription: string;
  transcriptionReal: boolean;
  audioPath: string;
  audioReal: boolean;
}

export interface AuditEntry {
  ts?: string;
  type: 'chat' | 'voice' | 'error';
  ok?: boolean;
  model?: string;
  ms?: number;
  userText?: string;
  reply?: string;
  toolsUsed?: string[];
  kbSources?: string[];
  saved?: boolean;
  error?: string;
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

  getVoices: () =>
    request<{ voices: { path: string; file: string; name: string; lang: string }[]; selected: string }>(
      '/voices'
    ),
  selectVoice: (path: string) =>
    request<{ selected: string }>('/voices/select', { method: 'PUT', body: JSON.stringify({ path }) }),

  getLogs: (opts?: { limit?: number; errors?: boolean }) =>
    request<{ entries: AuditEntry[] }>(
      `/logs?limit=${opts?.limit ?? 50}${opts?.errors ? '&errors=1' : ''}`
    ),

  getSettings: () => request<Settings>('/settings'),
  updateSettings: (data: Partial<Record<PersonalityKey, number> & { llmModel: string }>) =>
    request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  listReminders: () => request<Reminder[]>('/reminders'),
  createReminder: (data: { title: string; description?: string; dueDate?: string }) =>
    request<Reminder>('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id: string, data: Partial<Pick<Reminder, 'title' | 'completed'>>) =>
    request<Reminder>(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReminder: (id: string) => request<void>(`/reminders/${id}`, { method: 'DELETE' }),

  chat: (
    message: string,
    opts?: { saveHistory?: boolean; context?: { role: string; content: string }[] }
  ) => request<ChatReply>('/chat', { method: 'POST', body: JSON.stringify({ message, ...opts }) }),

  clearChatHistory: () => request<{ cleared: boolean }>('/chat/history', { method: 'DELETE' }),

  saveConversation: (data: {
    folder?: string;
    title: string;
    messages: { role: string; content: string }[];
  }) =>
    request<{ saved: string }>('/knowledge/save-conversation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Envia o áudio gravado para a pipeline de voz (STT → LLM → TTS).
  // Sem header Content-Type: o browser define o boundary do multipart.
  chatVoice: async (blob: Blob, saveHistory = true): Promise<VoiceReply> => {
    const form = new FormData();
    form.append('audio', blob, 'speech.webm');
    const url = `${BASE_URL}/chat/voice${saveHistory ? '' : '?saveHistory=false'}`;
    const res = await fetch(url, { method: 'POST', body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body?.error ?? `Erro ${res.status}`);
    }
    return res.json() as Promise<VoiceReply>;
  },

  knowledgeStatus: () =>
    request<{ chunks: number; files: number; sources: string[]; dir: string }>('/knowledge/status'),
  reindexKnowledge: () =>
    request<{ files: number; chunks: number; errors: string[] }>('/knowledge/reindex', {
      method: 'POST',
    }),
  uploadKnowledge: async (files: File[]): Promise<{ saved: string[]; rejected: string[] }> => {
    const form = new FormData();
    for (const f of files) form.append('files', f, f.name);
    const res = await fetch(`${BASE_URL}/knowledge/upload`, { method: 'POST', body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body?.error ?? `Erro ${res.status}`);
    }
    return res.json() as Promise<{ saved: string[]; rejected: string[] }>;
  },

  googleStatus: () => request<GoogleStatus>('/auth/google/status'),
  calendarToday: () => request<{ events: CalendarEvent[] }>('/calendar/today'),

  baseUrl: BASE_URL,
};
