'use client';

import { useEffect, useState } from 'react';
import { api, type Settings, type GoogleStatus, type PersonalityKey } from '@/lib/api';
import { StatusRail } from '@/components/StatusRail';
import { PersonalityMatrix } from '@/components/PersonalityMatrix';
import { ConversationPanel } from '@/components/ConversationPanel';
import { RemindersPanel } from '@/components/RemindersPanel';
import { AgendaPanel } from '@/components/AgendaPanel';
import { KnowledgePanel } from '@/components/KnowledgePanel';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { applyTheme, savedTheme } from '@/lib/theme';

export default function Home() {
  const [online, setOnline] = useState(false);
  const [brainOnline, setBrainOnline] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [google, setGoogle] = useState<GoogleStatus | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    applyTheme(savedTheme()); // aplica o tema salvo ao carregar
    (async () => {
      try {
        await api.health();
        setOnline(true);
        setSettings(await api.getSettings());
        setGoogle(await api.googleStatus().catch(() => ({ configured: false, connected: false })));
        setBrainOnline((await api.brainStatus().catch(() => ({ brainOnline: false }))).brainOnline);
      } catch {
        setOnline(false);
      }
    })();
  }, []);

  async function updateSettings(data: Partial<Record<PersonalityKey, number>>) {
    const updated = await api.updateSettings(data);
    setSettings(updated);
  }

  return (
    <I18nProvider>
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1240,
          margin: '0 auto',
          padding: 'clamp(1rem, 3vw, 2.25rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(1rem, 2vw, 1.5rem)',
        }}
      >
        <StatusRail
          online={online}
          brainOnline={brainOnline}
          google={google}
          settings={settings}
          onOpenSettings={() => setSettingsOpen(true)}
        />

      {!online && (
        <div className="panel mono" style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>
          Backend offline. Inicie o servidor com <span style={{ color: 'var(--color-amber)' }}>npm run dev</span> na raiz do
          projeto (esperado em {api.baseUrl}).
        </div>
      )}

      <div className="dash">
        <div className="col">
          <PersonalityMatrix settings={settings} onUpdate={updateSettings} />
          <AgendaPanel />
          <KnowledgePanel />
        </div>
        <div className="col">
          <ConversationPanel />
          <RemindersPanel />
        </div>
      </div>

        <Footer />

      <style>{`
        .dash {
          display: grid;
          grid-template-columns: minmax(300px, 380px) 1fr;
          gap: clamp(1rem, 2vw, 1.5rem);
          align-items: start;
        }
        .col {
          display: flex;
          flex-direction: column;
          gap: clamp(1rem, 2vw, 1.5rem);
          min-width: 0;
        }
        @media (max-width: 900px) {
          .dash { grid-template-columns: 1fr; }
        }
      `}</style>
      </main>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </I18nProvider>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="eyebrow" style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
      {t('footer')}
    </footer>
  );
}
