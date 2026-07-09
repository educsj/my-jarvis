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
  llmModel: string;
}

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
  updateSettings: (data: Partial<Pick<Settings, 'humorLevel' | 'empathyLevel' | 'llmModel'>>) =>
    request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  listReminders: () => request<Reminder[]>('/reminders'),
  createReminder: (data: { title: string; description?: string; dueDate?: string }) =>
    request<Reminder>('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id: string, data: Partial<Pick<Reminder, 'title' | 'completed'>>) =>
    request<Reminder>(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReminder: (id: string) => request<void>(`/reminders/${id}`, { method: 'DELETE' }),

  chat: (message: string) =>
    request<ChatReply>('/chat', { method: 'POST', body: JSON.stringify({ message }) }),

  googleStatus: () => request<GoogleStatus>('/auth/google/status'),
  calendarToday: () => request<{ events: CalendarEvent[] }>('/calendar/today'),

  baseUrl: BASE_URL,
};
