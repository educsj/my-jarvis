import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

export interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Executa um binário externo e resolve com stdout/stderr.
 * Opcionalmente escreve `input` no stdin (usado pelo Piper).
 */
export function run(bin: string, args: string[], input?: string): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));

    if (input !== undefined) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
}

/** true se o caminho existe (arquivo) ou parece um comando no PATH (sem separador). */
export function binAvailable(bin: string): boolean {
  if (!bin) return false;
  // Caminho absoluto/relativo: verifica existência. Comando puro: assume no PATH.
  if (bin.includes('/') || bin.includes('\\')) return existsSync(bin);
  return true;
}
