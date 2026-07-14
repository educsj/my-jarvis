import { Platform } from 'react-native';

// Paleta "Cockpit Monolith" — coerente com o painel web (estética de cockpit).
export const colors = {
  void: '#0a0d10',
  panel: '#12161b',
  panel2: '#181e25',
  amber: '#e8a13a',
  amberSoft: '#f5b85c',
  ice: '#7fc8d8',
  text: '#e7eaed',
  muted: '#7c858e',
  ok: '#6fce8f',
  danger: '#e06a5b',
  line: 'rgba(255,255,255,0.08)',
};

// Fonte monoespaçada do sistema (para telemetria/labels), sem assets extras.
export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
