import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Gera previews ao vivo do HTML que o assistente cria. Extrai o HTML da resposta,
 * salva em previews/ e devolve uma URL servida pelo backend (funciona em
 * localhost e via túnel). Assim o usuário vê a página renderizada, não só o código.
 */
const PREVIEWS_DIR = path.resolve(process.cwd(), 'previews');

/** Garante que o fragmento vire um documento HTML renderizável. */
function ensureDocument(html: string): string {
  if (/<html[\s>]/i.test(html)) return html;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body>
${html}
</body>
</html>`;
}

/** Extrai HTML da resposta do modelo (bloco ```html, documento completo, ou fragmento). */
export function extractHtml(text: string): string | null {
  const fenced = text.match(/```html\s*([\s\S]*?)```/i);
  if (fenced) return ensureDocument(fenced[1].trim());

  const doc = text.match(/<!DOCTYPE html[\s\S]*?<\/html>/i) || text.match(/<html[\s\S]*?<\/html>/i);
  if (doc) return doc[0];

  const anyFence = text.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  if (anyFence && /<(html|body|main|section|div|h1|header)\b/i.test(anyFence[1])) {
    return ensureDocument(anyFence[1].trim());
  }
  return null;
}

/** Salva um HTML como preview e retorna a URL relativa (/preview/<id>.html). */
export async function savePreview(html: string): Promise<string> {
  await mkdir(PREVIEWS_DIR, { recursive: true });
  const filename = `${randomUUID()}.html`;
  await writeFile(path.join(PREVIEWS_DIR, filename), html, 'utf-8');
  return `/preview/${filename}`;
}

/** Se a resposta contém HTML, gera o preview e retorna a URL; senão null. */
export async function maybeCreatePreview(replyText: string): Promise<string | null> {
  const html = extractHtml(replyText);
  if (!html) return null;
  return savePreview(html);
}
