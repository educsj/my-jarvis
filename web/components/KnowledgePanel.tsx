'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

interface Status {
  chunks: number;
  files: number;
  sources: string[];
}

export function KnowledgePanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    let active = true;
    api
      .knowledgeStatus()
      .then((s) => active && setStatus(s))
      .catch(() => active && setStatus({ chunks: 0, files: 0, sources: [] }));
    return () => {
      active = false;
    };
  }, []);

  async function refreshStatus() {
    setStatus(await api.knowledgeStatus().catch(() => ({ chunks: 0, files: 0, sources: [] })));
  }

  async function reindex() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.reindexKnowledge();
      await refreshStatus();
      setMsg(`${r.files} arquivo(s), ${r.chunks} trecho(s)${r.errors.length ? ` · ${r.errors.length} erro(s)` : ''}`);
    } catch (e) {
      setMsg(`Falha: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setBusy(true);
    setMsg('Enviando…');
    try {
      const up = await api.uploadKnowledge(arr);
      setMsg('Indexando…');
      const r = await api.reindexKnowledge();
      await refreshStatus();
      const parts = [`${up.saved.length} enviado(s)`];
      if (up.rejected.length) parts.push(`${up.rejected.length} não suportado(s)`);
      parts.push(`${r.chunks} trecho(s)`);
      setMsg(parts.join(' · '));
    } catch (e) {
      setMsg(`Falha: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel reveal" style={{ animationDelay: '0.25s' }}>
      <div className="panel-head">
        <div>
          <div className="eyebrow">{t('knowledge.eyebrow')}</div>
          <div className="panel-title">{t('knowledge.title')}</div>
        </div>
        <span className="chip">
          <span className={`dot ${status && status.files > 0 ? 'on' : 'off'}`} />
          {status ? `${status.files} arq · ${status.chunks} trechos` : '…'}
        </span>
      </div>

      {/* Zona de arrastar-e-soltar / clicar para adicionar */}
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!busy && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        style={{
          border: `1px dashed ${dragOver ? 'var(--color-amber)' : 'var(--line-bright)'}`,
          borderRadius: 10,
          padding: '1rem',
          textAlign: 'center',
          cursor: busy ? 'default' : 'pointer',
          background: dragOver ? 'rgba(232,161,58,0.08)' : 'rgba(0,0,0,0.15)',
          transition: 'border-color 120ms, background 120ms',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".txt,.md,.pdf,.docx,.csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
          {busy ? (
            msg ?? 'Processando…'
          ) : (
            <>
              <span style={{ color: 'var(--color-amber)' }}>{t('knowledge.dropTitle')}</span>{' '}
              {t('knowledge.dropSub')}
              <br />
              .txt · .md · .pdf · .docx · .csv · .xlsx
            </>
          )}
        </div>
      </div>

      {status && status.sources.length > 0 && (
        <div
          className="scroll mono"
          style={{ maxHeight: 96, fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '0.6rem' }}
        >
          {status.sources.map((s) => (
            <div key={s}>• {s}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: '0.7rem' }}>
        <button className="btn" onClick={reindex} disabled={busy}>
          {busy ? '…' : t('knowledge.reindex')}
        </button>
        {!busy && msg && (
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>
            {msg}
          </span>
        )}
      </div>
    </section>
  );
}
