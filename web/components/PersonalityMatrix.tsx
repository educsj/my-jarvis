'use client';

import { useCallback, useRef, useState } from 'react';
import type { Settings } from '@/lib/api';

const SEGMENTS = 20;

/** Barra segmentada arrastável — o instrumento-assinatura (estilo TARS). */
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
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          onChange(valueFromEvent(e.clientX));
        }}
        onPointerMove={(e) => {
          if (dragging.current) onChange(valueFromEvent(e.clientX));
        }}
        onPointerUp={(e) => {
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

/** Comentário no estilo TARS, derivado dos níveis atuais. */
function tarsQuip(humor: number, empathy: number): string {
  if (humor >= 90) return '"Ajuste de humor em 90%. Vou avisar quando começar a exagerar."';
  if (humor <= 15 && empathy <= 15) return '"Modo direto. Sem rodeios, sem piadas."';
  if (empathy >= 80) return '"Empatia alta. Estou aqui pra te ouvir de verdade."';
  if (humor >= 60) return '"Humor calibrado. Espere alguma ironia ocasional."';
  return '"Parâmetros aplicados. Pronto para operar."';
}

export function PersonalityMatrix({
  settings,
  onUpdate,
}: {
  settings: Settings | null;
  onUpdate: (data: Partial<Pick<Settings, 'humorLevel' | 'empathyLevel'>>) => void;
}) {
  // Estado local para resposta instantânea ao arrastar; commit envia à API.
  const [humor, setHumor] = useState(settings?.humorLevel ?? 50);
  const [empathy, setEmpathy] = useState(settings?.empathyLevel ?? 50);

  // Sincroniza com o backend quando os settings mudam (padrão oficial do React:
  // ajustar estado durante o render comparando com o valor anterior).
  const [prev, setPrev] = useState(settings);
  if (settings && settings !== prev) {
    setPrev(settings);
    setHumor(settings.humorLevel);
    setEmpathy(settings.empathyLevel);
  }

  return (
    <section className="panel reveal" style={{ animationDelay: '0.05s' }}>
      <div className="panel-head">
        <div>
          <div className="eyebrow">Matriz de Personalidade</div>
          <div className="panel-title">Configuração do núcleo</div>
        </div>
        <span className="chip">
          <span className="dot warn" /> TARS-MODE
        </span>
      </div>

      <div className="flex flex-col gap-6">
        <SegmentSlider
          label="Humor"
          code="HUM //"
          value={humor}
          accent="amber"
          onChange={setHumor}
          onCommit={(v) => onUpdate({ humorLevel: v })}
        />
        <SegmentSlider
          label="Empatia"
          code="EMP //"
          value={empathy}
          accent="ice"
          onChange={setEmpathy}
          onCommit={(v) => onUpdate({ empathyLevel: v })}
        />
      </div>

      <p
        className="mono"
        style={{
          marginTop: '1.25rem',
          fontSize: '0.78rem',
          color: 'var(--color-muted)',
          lineHeight: 1.5,
          borderTop: '1px solid var(--line)',
          paddingTop: '0.9rem',
        }}
      >
        {tarsQuip(humor, empathy)}
      </p>
    </section>
  );
}
