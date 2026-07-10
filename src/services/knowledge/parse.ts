import { readFile } from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { extractText, getDocumentProxy } from 'unpdf';

/** Extensões de arquivo suportadas na base de conhecimento. */
export const SUPPORTED = ['.txt', '.md', '.csv', '.pdf', '.docx', '.xlsx', '.xls'];

/** Extrai texto puro de um arquivo, de acordo com o tipo. */
export async function extractFileText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.txt':
    case '.md':
    case '.csv':
      return readFile(filePath, 'utf-8');

    case '.pdf': {
      const buf = await readFile(filePath);
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const { text } = await extractText(pdf, { mergePages: true });
      return Array.isArray(text) ? text.join('\n') : text;
    }

    case '.docx': {
      const { value } = await mammoth.extractRawText({ path: filePath });
      return value;
    }

    case '.xlsx':
    case '.xls': {
      const wb = XLSX.readFile(filePath);
      return wb.SheetNames.map((name) => `# ${name}\n${XLSX.utils.sheet_to_csv(wb.Sheets[name])}`).join(
        '\n\n'
      );
    }

    default:
      return '';
  }
}
