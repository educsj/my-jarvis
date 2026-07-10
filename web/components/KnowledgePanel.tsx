'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Status {
  chunks: number;
  files: number;
  sources: string[];
}

export function KnowledgePanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

  async function reindex() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.reindexKnowledge();
      setStatus(await api.knowledgeStatus());
      setMsg(
        `${r.files} arquivo(s), ${r.chunks} trecho(s)` +
          (r.errors.length ? ` · ${r.errors.length} com erro` : ' · ok')
      );
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
          <div className="eyebrow">Base de Conhecimento</div>
          <div className="panel-title">Documentos (RAG)</div>
        </div>
        <span className="chip">
          <span className={`dot ${status && status.files > 0 ? 'on' : 'off'}`} />
          {status ? `${status.files} arq · ${status.chunks} trechos` : '…'}
        </span>
      </div>

      <p className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
        Coloque arquivos (.txt, .md, .pdf, .docx, .csv, .xlsx) na pasta{' '}
        <span style={{ color: 'var(--color-amber)' }}>knowledge/</span> do projeto e clique em
        reindexar para o Jarvis consultá-los.
      </p>

      {status && status.sources.length > 0 && (
        <div
          className="scroll mono"
          style={{ maxHeight: 96, fontSize: '0.72rem', color: 'var(--color-muted)', margin: '0.5rem 0' }}
        >
          {status.sources.map((s) => (
            <div key={s}>• {s}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: '0.6rem' }}>
        <button className="btn btn-amber" onClick={reindex} disabled={busy}>
          {busy ? 'Indexando…' : 'Reindexar'}
        </button>
        {msg && (
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>
            {msg}
          </span>
        )}
      </div>
    </section>
  );
}
