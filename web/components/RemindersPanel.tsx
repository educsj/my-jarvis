'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type Reminder } from '@/lib/api';

export function RemindersPanel() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.listReminders();
        if (active) setItems(data);
      } catch {
        // backend offline — mantém lista vazia
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function add() {
    const t = title.trim();
    if (!t) return;
    setTitle('');
    const created = await api.createReminder({ title: t });
    setItems((prev) => [created, ...prev]);
  }

  async function toggle(r: Reminder) {
    const updated = await api.updateReminder(r.id, { completed: !r.completed });
    setItems((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
  }

  async function remove(r: Reminder) {
    await api.deleteReminder(r.id);
    setItems((prev) => prev.filter((x) => x.id !== r.id));
  }

  const pending = items.filter((i) => !i.completed).length;

  return (
    <section className="panel reveal" style={{ animationDelay: '0.15s' }}>
      <div className="panel-head">
        <div>
          <div className="eyebrow">Registro de Tarefas</div>
          <div className="panel-title">Lembretes</div>
        </div>
        <span className="chip">
          <span className={`dot ${pending > 0 ? 'warn' : 'on'}`} />
          {pending} pendente{pending === 1 ? '' : 's'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '0.9rem' }}>
        <input
          className="field"
          placeholder="Novo lembrete…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="btn" onClick={add} disabled={!title.trim()}>
          + Add
        </button>
      </div>

      <div className="scroll" style={{ maxHeight: 260, display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
        {loading && <div className="mono" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>Carregando…</div>}
        {!loading && items.length === 0 && (
          <div className="mono" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
            Nenhum lembrete. Adicione o primeiro acima.
          </div>
        )}
        <AnimatePresence initial={false}>
          {items.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0.55rem 0.7rem',
                borderRadius: 9,
                border: '1px solid var(--line)',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <button
                aria-label={r.completed ? 'Reabrir' : 'Concluir'}
                onClick={() => toggle(r)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  border: `1px solid ${r.completed ? 'var(--color-ok)' : 'var(--line-bright)'}`,
                  background: r.completed ? 'var(--color-ok)' : 'transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  color: '#0a0d10',
                  fontSize: 12,
                  lineHeight: 1,
                }}
              >
                {r.completed ? '✓' : ''}
              </button>
              <span
                style={{
                  flex: 1,
                  fontSize: '0.88rem',
                  textDecoration: r.completed ? 'line-through' : 'none',
                  color: r.completed ? 'var(--color-muted)' : 'var(--color-text)',
                }}
              >
                {r.title}
              </span>
              <button
                aria-label="Remover"
                onClick={() => remove(r)}
                style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: 16 }}
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
