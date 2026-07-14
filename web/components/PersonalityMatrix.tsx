'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Settings, PersonalityKey } from '@/lib/api';
import { useI18n, type TKey } from '@/lib/i18n';

const SEGMENTS = 20;

/** Barra segmentada arrastável — o instrumento-assinatura do painel. */
function SegmentSlider({
  label,
  code,
  value,
  accent,
  onChange,
  onCommit,
}: {
  label: string;
  code: string;
  value: number;
  accent: 'amber' | 'ice';
  onChange: (v: number) => void;
  onCommit: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const valueFromEvent = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * 100);
  }, []);

  const filled = Math.round((value / 100) * SEGMENTS);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <div className="panel-title" style={{ fontSize: '0.9rem' }}>
            {label}
          </div>
          <div className="eyebrow" style={{ letterSpacing: '0.2em' }}>
            {code}
          </div>
        </div>
        <div
          className="mono"
          style={{ fontSize: '1.9rem', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}
        >
          {value}
          <span style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>%</span>
        </div>
      </div>

      <div
        ref={ref}
        className="segbar"
        role="slider"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onPointerDown={(e) => {
          if (e.button !== 0) return; // ignora botões não-primários
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          onChange(valueFromEvent(e.clientX));
        }}
        onPointerMove={(e) => {
          if (dragging.current) onChange(valueFromEvent(e.clientX));
        }}
        onPointerUp={(e) => {
          if (!dragging.current) return; // só commita se o arrasto começou aqui
          dragging.current = false;
          onCommit(valueFromEvent(e.clientX));
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            const v = Math.min(100, value + 5);
            onChange(v);
            onCommit(v);
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            const v = Math.max(0, value - 5);
            onChange(v);
            onCommit(v);
          }
        }}
      >
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div key={i} className={`seg ${i < filled ? `fill-${accent}` : ''}`} />
        ))}
      </div>
    </div>
  );
}

/** Chave da tradução do comentário do assistente, derivado dos níveis atuais. */
function tarsQuipKey(humor: number, empathy: number): TKey {
  if (humor >= 90) return 'quip.humor90';
  if (humor <= 15 && empathy <= 15) return 'quip.direct';
  if (empathy >= 80) return 'quip.empathy';
  if (humor >= 60) return 'quip.humor';
  return 'quip.default';
}

const PARAMS: { key: PersonalityKey; label: string; code: string; accent: 'amber' | 'ice' }[] = [
  { key: 'humorLevel', label: 'Humor', code: 'HUM //', accent: 'amber' },
  { key: 'empathyLevel', label: 'Empatia', code: 'EMP //', accent: 'ice' },
  { key: 'cautionLevel', label: 'Cautela', code: 'CAU //', accent: 'amber' },
  { key: 'objectivityLevel', label: 'Objetividade', code: 'OBJ //', accent: 'ice' },
  { key: 'formalityLevel', label: 'Formalidade', code: 'FOR //', accent: 'amber' },
  { key: 'proactivityLevel', label: 'Proatividade', code: 'PRO //', accent: 'ice' },
];

type Values = Record<PersonalityKey, number>;

function readValues(settings: Settings | null): Values {
  return Object.fromEntries(PARAMS.map((p) => [p.key, settings?.[p.key] ?? 50])) as Values;
}

export function PersonalityMatrix({
  settings,
  onUpdate,
}: {
  settings: Settings | null;
  onUpdate: (data: Partial<Record<PersonalityKey, number>>) => void;
}) {
  // Estado local para resposta instantânea ao arrastar; commit envia à API.
  const [values, setValues] = useState<Values>(() => readValues(settings));

  // Sincroniza com o backend quando os settings mudam (padrão oficial do React:
  // ajustar estado durante o render comparando com o valor anterior).
  const [prev, setPrev] = useState(settings);
  if (settings && settings !== prev) {
    setPrev(settings);
    setValues(readValues(settings));
  }

  const setOne = (key: PersonalityKey, v: number) =>
    setValues((cur) => ({ ...cur, [key]: v }));

  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    // Sincroniza com o localStorage no cliente (evita hydration mismatch do SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem('pm-collapsed') === '1');
  }, []);
  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem('pm-collapsed', c ? '0' : '1');
      return !c;
    });
  }

  return (
    <section className="panel reveal" style={{ animationDelay: '0.05s' }}>
      <div className="panel-head" style={{ marginBottom: collapsed ? 0 : undefined }}>
        <div>
          <div className="eyebrow">{t('personality.eyebrow')}</div>
          <div className="panel-title">{t('personality.title')}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="chip">
            <span className="dot warn" /> CORE-MODE
          </span>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expandir' : 'Recolher'}
            title={collapsed ? 'Expandir' : 'Recolher'}
            aria-expanded={!collapsed}
            className="btn"
            style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', lineHeight: 1 }}
          >
            {collapsed ? '▸' : '▾'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="flex flex-col" style={{ gap: '1.1rem' }}>
            {PARAMS.map((p) => (
              <SegmentSlider
                key={p.key}
                label={t(`p.${p.key}` as TKey)}
                code={p.code}
                value={values[p.key]}
                accent={p.accent}
                onChange={(v) => setOne(p.key, v)}
                onCommit={(v) => onUpdate({ [p.key]: v })}
              />
            ))}
          </div>

          <p
            className="mono"
            style={{
              marginTop: '1.15rem',
              fontSize: '0.78rem',
              color: 'var(--color-muted)',
              lineHeight: 1.5,
              borderTop: '1px solid var(--line)',
              paddingTop: '0.9rem',
            }}
          >
            {t(tarsQuipKey(values.humorLevel, values.empathyLevel))}
          </p>
        </>
      )}
    </section>
  );
}
