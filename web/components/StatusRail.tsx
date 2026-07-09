'use client';

import type { Settings, GoogleStatus } from '@/lib/api';

export function StatusRail({
  online,
  brainOnline,
  google,
  settings,
}: {
  online: boolean;
  brainOnline: boolean | null;
  google: GoogleStatus | null;
  settings: Settings | null;
}) {
  return (
    <header
      className="reveal"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: '1.35rem',
            letterSpacing: '0.14em',
          }}
        >
          TARS<span style={{ color: 'var(--color-amber)' }}>{'//'}</span>JARVIS
        </span>
        <span className="eyebrow" style={{ letterSpacing: '0.2em' }}>
          Painel de Controle
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <span className="chip">
          <span className={`dot ${online ? 'on' : 'off'}`} /> Backend
        </span>
        <span className="chip">
          <span className={`dot ${brainOnline ? 'on' : brainOnline === false ? 'off' : 'warn'}`} /> Cérebro
          {settings ? ` · ${settings.llmModel}` : ''}
        </span>
        <span className="chip">
          <span className={`dot ${google?.connected ? 'on' : google?.configured ? 'warn' : 'off'}`} /> Calendar
        </span>
        {settings && (
          <span className="chip">
            <span className="dot warn" /> HUM {settings.humorLevel} · EMP {settings.empathyLevel}
          </span>
        )}
      </div>
    </header>
  );
}
