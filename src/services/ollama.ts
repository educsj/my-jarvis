import { env } from '../config/env.js';

/** Pedido de chamada de ferramenta retornado pelo modelo (Function Calling). */
export interface ToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

/** Mensagem no formato aceito pela API de chat do Ollama. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
}

export interface OllamaChatOptions {
  model?: string;
  temperature?: number;
  /** Ferramentas para Function Calling (usado na Fase 3 - Google Calendar). */
  tools?: unknown[];
}

export interface OllamaChatResult {
  content: string;
  model: string;
  /** true quando a resposta veio de fato do Ollama; false = fallback/erro. */
  ok: boolean;
  /** Chamadas de ferramenta solicitadas pelo modelo, se houver. */
  toolCalls?: ToolCall[];
}

export class OllamaUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OllamaUnavailableError';
  }
}

/** Verifica se o Ollama está no ar. */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${env.OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Envia mensagens para o Ollama e retorna a resposta do assistente.
 * Se o Ollama estiver indisponível, retorna um resultado de fallback (ok=false)
 * em vez de derrubar a requisição.
 */
export async function chat(
  messages: ChatMessage[],
  options: OllamaChatOptions = {}
): Promise<OllamaChatResult> {
  const model = options.model ?? env.OLLAMA_MODEL;

  const post = (tools?: unknown[]) =>
    fetch(`${env.OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature: options.temperature ?? 0.7 },
        ...(tools ? { tools } : {}),
      }),
      signal: AbortSignal.timeout(120_000),
    });

  try {
    let res = await post(options.tools);

    // Alguns modelos (ex.: dolphin3) não têm template de tools no Ollama e
    // respondem "does not support tools". Nesse caso, refazemos a chamada sem
    // ferramentas: o chat continua funcionando, apenas sem function calling.
    if (!res.ok && options.tools) {
      const text = await res.text().catch(() => '');
      if (text.includes('does not support tools')) {
        res = await post(undefined);
      } else {
        throw new OllamaUnavailableError(`Ollama respondeu ${res.status}: ${text.slice(0, 200)}`);
      }
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new OllamaUnavailableError(`Ollama respondeu ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      message?: { content?: string; tool_calls?: ToolCall[] };
    };
    return {
      content: data.message?.content?.trim() ?? '',
      model,
      ok: true,
      toolCalls: data.message?.tool_calls,
    };
  } catch (err) {
    const reason =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'tempo de resposta esgotado'
        : 'serviço indisponível';

    return {
      content: `[Cérebro offline] Não consegui falar com o Ollama (${reason}). Verifique se ele está rodando em ${env.OLLAMA_BASE_URL} e se o modelo "${model}" foi baixado (ollama pull ${model}).`,
      model,
      ok: false,
    };
  }
}
