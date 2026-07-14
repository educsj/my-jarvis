'use client';

import { useEffect, useState } from 'react';
import {
  api,
  ASSISTANT_NAME_MAX,
  DEFAULT_ASSISTANT_NAME,
  type AuditEntry,
  type Settings,
} from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { THEMES, applyTheme, savedTheme } from '@/lib/theme';

interface Voice {
  path: string;
  name: string;
  lang: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.6rem' }}>
      <div className="eyebrow" style={{ marginBottom: '0.7rem' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn"
      style={{
        borderColor: active ? 'var(--color-amber)' : undefined,
        background: active ? 'rgba(232,161,58,0.14)' : undefined,
        color: active ? 'var(--color-text)' : undefined,
      }}
    >
      {children}
    </button>
  );
}

export function SettingsDrawer({
  open,
  onClose,
  settings,
  onRename,
}: {
  open: boolean;
  onClose: () => void;
  settings: Settings | null;
  onRename: (name: string) => Promise<void>;
}) {
  const { lang, setLang, t } = useI18n();
  const [theme, setTheme] = useState('amber');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [name, setName] = useState('');
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(savedTheme());
  }, []);

  // Reidrata o campo sempre que o painel abre ou o nome salvo muda.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(settings?.assistantName ?? '');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNameStatus('idle');
  }, [settings?.assistantName, open]);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === settings?.assistantName) return;
    setNameStatus('saving');
    try {
      await onRename(trimmed);
      setNameStatus('saved');
    } catch {
      setNameStatus('error');
    }
  }

  async function loadLogs(errors = onlyErrors) {
    setLogs((await api.getLogs({ limit: 60, errors }).catch(() => ({ entries: [] }))).entries);
  }

  useEffect(() => {
    if (!open) return;
    api
      .getVoices()
      .then((v) => {
        setVoices(v.voices);
        setSelectedVoice(v.selected);
      })
      .catch(() => setVoices([]));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function pickTheme(id: string) {
    applyTheme(id);
    setTheme(id);
  }

  async function pickVoice(path: string) {
    setSelectedVoice(path);
    await api.selectVoice(path).catch(() => {});
  }

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
      />
      <aside
        role="dialog"
        aria-label={t('settings.title')}
        className="scroll"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 'min(420px, 92vw)',
          background: 'var(--color-panel)',
          borderLeft: '1px solid var(--line-bright)',
          zIndex: 41,
          padding: '1.4rem 1.5rem',
          boxShadow: '-30px 0 80px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.6rem',
          }}
        >
          <div className="panel-title" style={{ fontSize: '1.1rem' }}>
            ⚙ {t('settings.title')}
          </div>
          <button className="btn" onClick={onClose}>
            {t('settings.close')}
          </button>
        </div>

        {/* Nome do assistente */}
        <Section title={t('settings.name')}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameStatus('idle');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
              }}
              maxLength={ASSISTANT_NAME_MAX}
              placeholder={DEFAULT_ASSISTANT_NAME}
              aria-label={t('settings.name')}
              className="field"
              style={{ flex: 1, minWidth: 0 }}
            />
            <button
              type="button"
              className="btn btn-amber"
              onClick={saveName}
              disabled={
                nameStatus === 'saving' || !name.trim() || name.trim() === settings?.assistantName
              }
            >
              {t('settings.name.save')}
            </button>
          </div>
          <p
            className="mono"
            style={{
              fontSize: '0.72rem',
              marginTop: '0.5rem',
              color:
                nameStatus === 'error'
                  ? 'var(--color-danger)'
                  : nameStatus === 'saved'
                    ? 'var(--color-amber)'
                    : 'var(--color-muted)',
            }}
          >
            {nameStatus === 'saved'
              ? t('settings.name.saved')
              : nameStatus === 'error'
                ? t('settings.name.error')
                : t('settings.name.hint')}
          </p>
        </Section>

        {/* Idioma */}
        <Section title={t('settings.language')}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Pill active={lang === 'pt'} onClick={() => setLang('pt')}>
              🇧🇷 Português
            </Pill>
            <Pill active={lang === 'en'} onClick={() => setLang('en')}>
              🇺🇸 English
            </Pill>
          </div>
        </Section>

        {/* Aparência */}
        <Section title={t('settings.appearance')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {THEMES.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => pickTheme(th.id)}
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  borderColor: theme === th.id ? 'var(--color-amber)' : undefined,
                  background: theme === th.id ? 'rgba(232,161,58,0.14)' : undefined,
                }}
              >
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: '50%',
                    background: th.color,
                    boxShadow: `0 0 8px ${th.color}`,
                  }}
                />
                {th.name}
              </button>
            ))}
          </div>
        </Section>

        {/* Voz */}
        <Section title={t('settings.voice')}>
          {voices.length === 0 ? (
            <p className="mono" style={{ fontSize: '0.76rem', color: 'var(--color-muted)' }}>
              {t('settings.voice.none')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {voices.map((v) => (
                <button
                  key={v.path}
                  type="button"
                  onClick={() => pickVoice(v.path)}
                  className="btn"
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    borderColor: selectedVoice === v.path ? 'var(--color-amber)' : undefined,
                    background: selectedVoice === v.path ? 'rgba(232,161,58,0.14)' : undefined,
                  }}
                >
                  <span style={{ color: 'var(--color-amber)', marginRight: 8 }}>{v.lang}</span>
                  {v.name}
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Logs */}
        <Section title={t('settings.logs')}>
          <div style={{ display: 'flex', gap: 8, marginBottom: '0.7rem' }}>
            <Pill
              active={onlyErrors}
              onClick={() => {
                const nv = !onlyErrors;
                setOnlyErrors(nv);
                loadLogs(nv);
              }}
            >
              {t('settings.logs.errorsOnly')}
            </Pill>
            <button className="btn" onClick={() => loadLogs()}>
              ↻ {t('settings.logs.refresh')}
            </button>
          </div>
          {logs.length === 0 ? (
            <p className="mono" style={{ fontSize: '0.76rem', color: 'var(--color-muted)' }}>
              {t('settings.logs.empty')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logs.map((e, i) => (
                <div
                  key={i}
                  className="mono"
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.5rem 0.6rem',
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    background: 'rgba(0,0,0,0.2)',
                    color:
                      e.type === 'error' || e.ok === false ? 'var(--color-danger)' : 'var(--color-muted)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>
                      {e.type}
                      {e.ok === false ? ' · falhou' : ''}
                      {typeof e.ms === 'number' ? ` · ${e.ms}ms` : ''}
                    </span>
                    <span>{e.ts ? new Date(e.ts).toLocaleTimeString() : ''}</span>
                  </div>
                  <div style={{ color: 'var(--color-text)', marginTop: 3, wordBreak: 'break-word' }}>
                    {e.error ?? e.userText ?? ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </aside>
    </>
  );
}
