import { listEventsForDay, createEvent, parseLocalDate } from './calendar.js';

/**
 * Definições de ferramentas (Function Calling) expostas ao LLM, no formato
 * de tools do Ollama/OpenAI. O modelo decide quando chamá-las durante a conversa.
 */
export const calendarTools = [
  {
    type: 'function',
    function: {
      name: 'get_today_events',
      description:
        'Lê os compromissos/eventos do usuário no Google Calendar para uma data. Use quando ele perguntar sobre a agenda, compromissos ou o que tem no dia.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description:
              'Data no formato YYYY-MM-DD. Omita para usar o dia de hoje.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_calendar_event',
      description:
        'Agenda um novo compromisso no Google Calendar. Use quando o usuário pedir para marcar, agendar ou lembrar de um evento em um horário específico.',
      parameters: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Título do compromisso.' },
          startDateTime: {
            type: 'string',
            description: 'Início em ISO 8601, ex.: 2026-07-10T14:00:00.',
          },
          endDateTime: {
            type: 'string',
            description: 'Fim em ISO 8601. Opcional (padrão: 1h após o início).',
          },
          description: { type: 'string', description: 'Detalhes opcionais.' },
          location: { type: 'string', description: 'Local opcional.' },
        },
        required: ['summary', 'startDateTime'],
      },
    },
  },
];

type ToolArgs = Record<string, unknown>;

/**
 * Executa uma ferramenta pelo nome e retorna um texto que será devolvido ao LLM
 * como mensagem de role "tool". Erros são capturados e viram texto explicativo
 * (o modelo então informa o usuário com naturalidade).
 */
export async function runCalendarTool(name: string, args: ToolArgs): Promise<string> {
  try {
    switch (name) {
      case 'get_today_events': {
        const date = typeof args.date === 'string' ? parseLocalDate(args.date) : new Date();
        const events = await listEventsForDay(date);
        if (events.length === 0) return 'Nenhum evento encontrado para a data.';
        return JSON.stringify(events);
      }

      case 'create_calendar_event': {
        if (typeof args.summary !== 'string' || typeof args.startDateTime !== 'string') {
          return 'Erro: são obrigatórios "summary" e "startDateTime".';
        }
        const event = await createEvent({
          summary: args.summary,
          startDateTime: args.startDateTime,
          endDateTime: typeof args.endDateTime === 'string' ? args.endDateTime : undefined,
          description: typeof args.description === 'string' ? args.description : undefined,
          location: typeof args.location === 'string' ? args.location : undefined,
        });
        return `Evento criado com sucesso: ${JSON.stringify(event)}`;
      }

      default:
        return `Erro: ferramenta desconhecida "${name}".`;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `Erro ao executar "${name}": ${message}`;
  }
}
