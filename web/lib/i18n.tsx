'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'pt' | 'en';

// Dicionário de tradução. Adicione novas chaves aqui (PT + EN).
const dict = {
  pt: {
    'app.subtitle': 'Painel de Controle',
    'status.backend': 'Backend',
    'status.brain': 'Cérebro',
    'status.calendar': 'Calendar',
    'settings.open': 'Configurações',

    'personality.eyebrow': 'Matriz de Personalidade',
    'personality.title': 'Configuração do núcleo',
    'conversation.eyebrow': 'Canal de Conversa',
    'conversation.title': 'Falar com o Jarvis',
    'conversation.placeholder': '> mensagem para o jarvis',
    'conversation.send': 'Enviar',
    'conversation.idle': 'ocioso',
    'conversation.thinking': 'processando',
    'reminders.eyebrow': 'Registro de Tarefas',
    'reminders.title': 'Lembretes',
    'reminders.new': 'Novo lembrete…',
    'agenda.eyebrow': 'Google Calendar',
    'knowledge.eyebrow': 'Base de Conhecimento',
    'knowledge.title': 'Documentos (RAG)',
    'knowledge.reindex': 'Reindexar',

    'settings.title': 'Configurações',
    'settings.language': 'Idioma',
    'settings.appearance': 'Aparência',
    'settings.voice': 'Voz do assistente',
    'settings.voice.none': 'Nenhuma voz encontrada. Instale vozes do Piper.',
    'settings.logs': 'Logs (auditoria)',
    'settings.logs.errorsOnly': 'Só erros',
    'settings.logs.refresh': 'Atualizar',
    'settings.logs.empty': 'Nenhum registro hoje.',
    'settings.close': 'Fechar',
  },
  en: {
    'app.subtitle': 'Control Panel',
    'status.backend': 'Backend',
    'status.brain': 'Brain',
    'status.calendar': 'Calendar',
    'settings.open': 'Settings',

    'personality.eyebrow': 'Personality Matrix',
    'personality.title': 'Core configuration',
    'conversation.eyebrow': 'Conversation Channel',
    'conversation.title': 'Talk to Jarvis',
    'conversation.placeholder': '> message for jarvis',
    'conversation.send': 'Send',
    'conversation.idle': 'idle',
    'conversation.thinking': 'thinking',
    'reminders.eyebrow': 'Task Log',
    'reminders.title': 'Reminders',
    'reminders.new': 'New reminder…',
    'agenda.eyebrow': 'Google Calendar',
    'knowledge.eyebrow': 'Knowledge Base',
    'knowledge.title': 'Documents (RAG)',
    'knowledge.reindex': 'Reindex',

    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.appearance': 'Appearance',
    'settings.voice': 'Assistant voice',
    'settings.voice.none': 'No voices found. Install Piper voices.',
    'settings.logs': 'Logs (audit)',
    'settings.logs.errorsOnly': 'Errors only',
    'settings.logs.refresh': 'Refresh',
    'settings.logs.empty': 'No entries today.',
    'settings.close': 'Close',
  },
} as const;

export type TKey = keyof (typeof dict)['pt'];

const I18nContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
}>({ lang: 'pt', setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('pt');

  useEffect(() => {
    const saved = localStorage.getItem('lang');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'en' || saved === 'pt') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  const t = (k: TKey): string => dict[lang][k] ?? dict.pt[k] ?? k;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
