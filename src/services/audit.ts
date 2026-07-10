import { appendFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Log de auditoria de interações (para depurar bugs e erros).
 * Grava uma linha JSON por evento em logs/YYYY-MM-DD.jsonl (fora do Git).
 */
const LOGS_DIR = path.resolve(process.cwd(), 'logs');

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
  [key: string]: unknown;
}

function todayFile(): string {
  const day = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
  return path.join(LOGS_DIR, `${day}.jsonl`);
}

/** Registra uma entrada no log de auditoria (nunca lança). */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await mkdir(LOGS_DIR, { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
    await appendFile(todayFile(), line, 'utf-8');
  } catch {
    // logging nunca deve quebrar a requisição
  }
}

/** Lê as últimas N entradas do log de hoje (para auditoria via API). */
export async function readRecentLogs(limit = 100, onlyErrors = false): Promise<AuditEntry[]> {
  const file = todayFile();
  if (!existsSync(file)) return [];
  const raw = await readFile(file, 'utf-8');
  const lines = raw.split('\n').filter(Boolean);
  const parsed = lines
    .map((l) => {
      try {
        return JSON.parse(l) as AuditEntry;
      } catch {
        return null;
      }
    })
    .filter((e): e is AuditEntry => e !== null);
  const filtered = onlyErrors ? parsed.filter((e) => e.type === 'error' || e.ok === false) : parsed;
  return filtered.slice(-limit).reverse();
}

/** Lista os dias que possuem log. */
export async function listLogDays(): Promise<string[]> {
  if (!existsSync(LOGS_DIR)) return [];
  const files = await readdir(LOGS_DIR);
  return files.filter((f) => f.endsWith('.jsonl')).map((f) => f.replace('.jsonl', ''));
}
