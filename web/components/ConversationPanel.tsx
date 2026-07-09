'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  offline?: boolean;
  tools?: string[];
}

/** Ondas sonoras enquanto o assistente "pensa" (eco do painel de voz do app). */
function Waveform() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 20 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          style={{ width: 3, borderRadius: 2, background: 'var(--color-amber)' }}
          animate={{ height: [6, 18, 6] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </div>
  );
}

export function ConversationPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setThinking(true);
    try {
      const res = await api.chat(text);
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: res.reply, offline: !res.ok, tools: res.toolsUsed },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: `Falha ao contatar o backend (${(err as Error).message}). Ele está rodando em ${api.baseUrl}?`,
          offline: true,
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <section
      className="panel reveal"
      style={{ display: 'flex', flexDirection: 'column', minHeight: 0, animationDelay: '0.1s' }}
    >
      <div className="panel-head">
        <div>
          <div className="eyebrow">Canal de Conversa</div>
          <div className="panel-title">Falar com o Jarvis</div>
        </div>
        <span className="chip">
          <span className={`dot ${thinking ? 'warn' : 'on'}`} />
          {thinking ? 'processando' : 'ocioso'}
        </span>
      </div>

      <div
        ref={logRef}
        className="scroll"
        style={{ flex: 1, minHeight: 240, display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: 4 }}
      >
        {messages.length === 0 && !thinking && (
          <div
            className="mono"
            style={{ color: 'var(--color-muted)', fontSize: '0.82rem', margin: 'auto', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}
          >
            Canal aberto. Pergunte sobre seus lembretes, sua agenda ou apenas converse.
            <br />O tom da resposta segue a matriz de personalidade ao lado.
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}
            >
              <div className="eyebrow" style={{ marginBottom: 4, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                {m.role === 'user' ? 'Você' : 'Jarvis'}
              </div>
              <div
                style={{
                  padding: '0.7rem 0.9rem',
                  borderRadius: 12,
                  border: '1px solid var(--line)',
                  background:
                    m.role === 'user'
                      ? 'rgba(127,200,216,0.08)'
                      : m.offline
                        ? 'rgba(224,106,91,0.08)'
                        : 'rgba(232,161,58,0.08)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                }}
              >
                {m.content}
                {m.tools && m.tools.length > 0 && (
                  <div className="mono" style={{ marginTop: 6, fontSize: '0.66rem', color: 'var(--color-ice)' }}>
                    ⚙ {m.tools.join(', ')}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {thinking && (
          <div style={{ alignSelf: 'flex-start' }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              Jarvis
            </div>
            <div style={{ padding: '0.7rem 0.9rem', borderRadius: 12, border: '1px solid var(--line)', background: 'rgba(232,161,58,0.06)' }}>
              <Waveform />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
        <input
          className="field mono"
          placeholder="> mensagem para o jarvis"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn btn-amber" onClick={send} disabled={thinking || !input.trim()}>
          Enviar
        </button>
      </div>
    </section>
  );
}
