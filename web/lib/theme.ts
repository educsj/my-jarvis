// Temas de aparência. Adicione novos temas aqui e (se mudar cores) em globals.css.
export const THEMES = [
  { id: 'amber', name: 'Âmbar (Cockpit)', color: '#e8a13a' },
  { id: 'ice', name: 'Gelo', color: '#46c8e6' },
  { id: 'emerald', name: 'Matrix', color: '#3fd08a' },
  { id: 'violet', name: 'Nebulosa', color: '#a98bf0' },
  { id: 'crimson', name: 'Endurance', color: '#ef6a6a' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

/** Aplica o tema (atributo data-theme na raiz) e persiste. */
export function applyTheme(id: string): void {
  if (id === 'amber') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem('theme', id);
}

/** Lê o tema salvo (ou o padrão). */
export function savedTheme(): string {
  if (typeof localStorage === 'undefined') return 'amber';
  return localStorage.getItem('theme') || 'amber';
}
