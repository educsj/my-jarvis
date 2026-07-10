'use client';

import { useEffect, useState } from 'react';
import { api, type CalendarEvent, type GoogleStatus } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

function formatTime(iso?: string): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'dia todo';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function AgendaPanel() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useI18n();

  useEffect(() => {
    (async () => {
      try {
        const s = await api.googleStatus();
        setStatus(s);
        if (s.configured && s.connected) {
          const { events } = await api.calendarToday();
          setEvents(events);
        }
      } catch {
        setStatus({ configured: false, connected: false });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <section className="panel reveal" style={{ animationDelay: '0.2s' }}>
      <div className="panel-head">
        <div>
          <div className="eyebrow">{t('agenda.eyebrow')}</div>
          <div className="panel-title" style={{ textTransform: 'capitalize' }}>
            {today}
          </div>
        </div>
        <span className="chip">
          <span className={`dot ${status?.connected ? 'on' : status?.configured ? 'warn' : 'off'}`} />
          {status?.connected
            ? t('agenda.connected')
            : status?.configured
              ? t('agenda.disconnected')
              : t('agenda.notconfig')}
        </span>
      </div>

      {loading && <div className="mono" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>{t('agenda.syncing')}</div>}

      {!loading && !status?.configured && (
        <div className="mono" style={{ color: 'var(--color-muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
          Integração não configurada. Adicione as credenciais do Google no <span style={{ color: 'var(--color-amber)' }}>.env</span> do
          backend para ver e agendar compromissos por voz.
        </div>
      )}

      {!loading && status?.configured && !status.connected && (
        <div>
          <p className="mono" style={{ color: 'var(--color-muted)', fontSize: '0.8rem', marginBottom: 12 }}>
            Credenciais detectadas. Autorize o acesso à sua agenda.
          </p>
          <a className="btn btn-amber" href={`${api.baseUrl}/auth/google`}>
            Conectar Google Calendar
          </a>
        </div>
      )}

      {!loading && status?.connected && events.length === 0 && (
        <div className="mono" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
          {t('agenda.noevents')}
        </div>
      )}

      {!loading && status?.connected && events.length > 0 && (
        <div className="scroll" style={{ maxHeight: 220, display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
          {events.map((e) => (
            <div
              key={e.id}
              style={{ display: 'flex', gap: 12, padding: '0.55rem 0.7rem', borderRadius: 9, border: '1px solid var(--line)', background: 'rgba(0,0,0,0.2)' }}
            >
              <span className="mono" style={{ color: 'var(--color-amber)', fontSize: '0.82rem', minWidth: 46 }}>
                {formatTime(e.start)}
              </span>
              <div>
                <div style={{ fontSize: '0.88rem' }}>{e.summary}</div>
                {e.location && (
                  <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
                    {e.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
