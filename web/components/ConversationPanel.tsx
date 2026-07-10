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
  const [recording, setRecording] = useState(false);
  const [muted, setMuted] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mutedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggleMute() {
    setMuted((m) => {
      mutedRef.current = !m;
      if (mutedRef.current) audioRef.current?.pause();
      return !m;
    });
  }

  // Toca a voz (Piper) da resposta, se houver e não estiver mudo.
  function speak(url: string | null) {
    if (!url || mutedRef.current) return;
    audioRef.current?.pause();
    const a = new Audio(`${api.baseUrl}${url}`);
    audioRef.current = a;
    a.play().catch(() => {});
  }

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
      speak(res.audioUrl);
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

  // ---- Entrada de voz (grava no navegador → POST /chat/voice) ----
  async function sendVoice(blob: Blob) {
    setThinking(true);
    try {
      const res = await api.chatVoice(blob);
      setMessages((m) => [
        ...m,
        { role: 'user', content: res.transcription || '(áudio)' },
        { role: 'assistant', content: res.reply, offline: !res.ok, tools: res.toolsUsed },
      ]);
      speak(res.audioUrl);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Falha ao enviar o áudio (${(err as Error).message}).`, offline: true },
      ]);
    } finally {
      setThinking(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    if (thinking) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Seu navegador não suporta gravação de áudio.', offline: true },
      ]);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        void sendVoice(blob);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'Não consegui acessar o microfone. Verifique a permissão do navegador.',
          offline: true,
        },
      ]);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Ativar voz' : 'Silenciar voz'}
            title={muted ? 'Voz desligada — clique para ligar' : 'Voz ligada — clique para silenciar'}
            className="btn"
            style={{ padding: '0.35rem 0.55rem', fontSize: '0.9rem', opacity: muted ? 0.5 : 1 }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <span className="chip">
            <span className={`dot ${thinking ? 'warn' : 'on'}`} />
            {thinking ? 'processando' : 'ocioso'}
          </span>
        </div>
      </div>

      <div
        ref={logRef}
        className="scroll"
        style={{
          flex: 1,
          minHeight: 240,
          // Limita a altura para o log rolar internamente em vez de esticar a página.
          maxHeight: '52vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          paddingRight: 4,
        }}
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
        <button
          type="button"
          onClick={toggleRecording}
          disabled={thinking}
          aria-label={recording ? 'Parar gravação' : 'Gravar áudio'}
          title={recording ? 'Parar e enviar' : 'Falar com o Jarvis'}
          className="btn"
          style={{
            padding: '0.5rem 0.7rem',
            borderColor: recording ? 'var(--color-danger)' : undefined,
            background: recording ? 'rgba(224,106,91,0.15)' : undefined,
          }}
        >
          {recording ? (
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: 3,
                background: 'var(--color-danger)',
                animation: 'pulse 1s ease-in-out infinite',
              }}
            />
          ) : (
            '🎙'
          )}
        </button>
        <input
          className="field mono"
          placeholder={recording ? '● gravando… toque no quadrado para enviar' : '> mensagem para o jarvis'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={recording}
        />
        <button className="btn btn-amber" onClick={send} disabled={thinking || recording || !input.trim()}>
          Enviar
        </button>
      </div>
    </section>
  );
}
