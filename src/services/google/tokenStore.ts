import { readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { Credentials } from 'google-auth-library';

/**
 * Armazena os tokens OAuth2 do Google em um arquivo local (token.json),
 * protegido pelo .gitignore. MVP mono-usuário — em produção multiusuário,
 * isto iria para o banco por usuário.
 */
const TOKEN_PATH = path.resolve(process.cwd(), 'token.json');

export async function saveTokens(tokens: Credentials): Promise<void> {
  await writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf-8');
}

export async function loadTokens(): Promise<Credentials | null> {
  try {
    const raw = await readFile(TOKEN_PATH, 'utf-8');
    return JSON.parse(raw) as Credentials;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await unlink(TOKEN_PATH);
  } catch {
    // arquivo já não existe — ok
  }
}

export async function hasTokens(): Promise<boolean> {
  const tokens = await loadTokens();
  return Boolean(tokens?.access_token || tokens?.refresh_token);
}
