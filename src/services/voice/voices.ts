import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { env } from '../../config/env.js';

/**
 * Gerenciamento das vozes do Piper: lista os modelos .onnx disponíveis na pasta
 * de vozes e permite escolher a voz ativa (persistida em voice-config.json).
 */

const VOICES_DIR = env.PIPER_MODEL ? path.dirname(env.PIPER_MODEL) : '';
const CONFIG_FILE = path.resolve(process.cwd(), 'voice-config.json');

export interface Voice {
  path: string;
  file: string;
  name: string;
  lang: string; // ex.: pt-BR, en-US
}

const LANG_LABEL: Record<string, string> = {
  pt_BR: 'pt-BR',
  pt_PT: 'pt-PT',
  en_US: 'en-US',
  en_GB: 'en-GB',
  es_ES: 'es-ES',
  fr_FR: 'fr-FR',
  de_DE: 'de-DE',
  it_IT: 'it-IT',
};

function parseVoice(file: string, full: string): Voice {
  const base = file.replace(/\.onnx$/i, '');
  const prefix = base.split('-')[0]; // ex.: pt_BR
  return { path: full, file, name: base, lang: LANG_LABEL[prefix] ?? prefix };
}

/** Lista as vozes .onnx disponíveis na pasta do Piper. */
export async function listVoices(): Promise<Voice[]> {
  if (!VOICES_DIR || !existsSync(VOICES_DIR)) return [];
  const entries = await readdir(VOICES_DIR);
  return entries
    .filter((f) => f.toLowerCase().endsWith('.onnx'))
    .map((f) => parseVoice(f, path.join(VOICES_DIR, f)))
    .sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
}

/** Caminho da voz ativa (config salva; senão o padrão do .env). */
export async function getSelectedVoicePath(): Promise<string> {
  try {
    const raw = await readFile(CONFIG_FILE, 'utf-8');
    const { path: p } = JSON.parse(raw) as { path?: string };
    if (p && existsSync(p)) return p;
  } catch {
    // sem config — usa o padrão
  }
  return env.PIPER_MODEL;
}

/** Define a voz ativa (por caminho absoluto de um .onnx existente). */
export async function setSelectedVoice(voicePath: string): Promise<void> {
  if (!existsSync(voicePath)) throw new Error('Arquivo de voz não encontrado.');
  await writeFile(CONFIG_FILE, JSON.stringify({ path: voicePath }, null, 2), 'utf-8');
}
