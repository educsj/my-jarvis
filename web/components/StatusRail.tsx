'use client';

import type { Settings, GoogleStatus } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export function StatusRail({
  online,
  brainOnline,
  google,
  settings,
  onOpenSettings,
}: {
  online: boolean;
  brainOnline: boolean | null;
  google: GoogleStatus | null;
  settings: Settings | null;
  onOpenSettings: () => void;
}) {
  const { t } = useI18n();
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
          {t('app.subtitle')}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <span className="chip">
          <span className={`dot ${online ? 'on' : 'off'}`} /> {t('status.backend')}
        </span>
        <span className="chip">
          <span className={`dot ${brainOnline ? 'on' : brainOnline === false ? 'off' : 'warn'}`} />{' '}
          {t('status.brain')}
          {settings ? ` · ${settings.llmModel}` : ''}
        </span>
        <span className="chip">
          <span className={`dot ${google?.connected ? 'on' : google?.configured ? 'warn' : 'off'}`} />{' '}
          {t('status.calendar')}
        </span>
        {settings && (
          <span className="chip">
            <span className="dot warn" /> HUM {settings.humorLevel} · EMP {settings.empathyLevel}
          </span>
        )}
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t('settings.open')}
          title={t('settings.open')}
          className="btn"
          style={{ padding: '0.35rem 0.55rem', fontSize: '0.95rem' }}
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
