import { google } from 'googleapis';
import { env } from '../../config/env.js';
import { loadTokens, saveTokens } from './tokenStore.js';

/** Tipo do cliente OAuth2 do googleapis (evita conflito entre cópias do google-auth-library). */
type GoogleOAuthClient = InstanceType<typeof google.auth.OAuth2>;

/** Escopo mínimo para ler e criar eventos no calendário. */
export const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

/** As credenciais do Google foram configuradas no .env? */
export function isGoogleConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export class GoogleNotConfiguredError extends Error {
  constructor() {
    super(
      'Google OAuth2 não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env.'
    );
    this.name = 'GoogleNotConfiguredError';
  }
}

/** Cria um cliente OAuth2 (sem tokens carregados). */
export function createOAuthClient(): GoogleOAuthClient {
  if (!isGoogleConfigured()) throw new GoogleNotConfiguredError();

  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

/** URL para o usuário autorizar o acesso ao Google Calendar. */
export function generateAuthUrl(): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline', // garante refresh_token
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
  });
}

/** Troca o "code" do callback por tokens e os persiste. */
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  await saveTokens(tokens);
}

/**
 * Retorna um cliente OAuth2 já autenticado (com tokens carregados).
 * Faz refresh automático e re-persiste tokens atualizados.
 * Retorna null se não houver tokens (usuário não conectou).
 */
export async function getAuthenticatedClient(): Promise<GoogleOAuthClient | null> {
  if (!isGoogleConfigured()) return null;

  const tokens = await loadTokens();
  if (!tokens) return null;

  const client = createOAuthClient();
  client.setCredentials(tokens);

  // Persiste tokens renovados automaticamente
  client.on('tokens', (newTokens) => {
    void saveTokens({ ...tokens, ...newTokens });
  });

  return client;
}
