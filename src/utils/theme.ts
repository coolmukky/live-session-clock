export interface Accent {
  key: string;
  label: string;
  /** Base accent color. */
  color: string;
  /** Lighter accent used for emphasis/text. */
  strong: string;
  /** Secondary color used in gradients. */
  secondary: string;
}

export const ACCENTS: Accent[] = [
  { key: 'indigo', label: 'Indigo', color: '#6366f1', strong: '#818cf8', secondary: '#22d3ee' },
  { key: 'violet', label: 'Violet', color: '#8b5cf6', strong: '#a78bfa', secondary: '#22d3ee' },
  { key: 'sky', label: 'Sky', color: '#0ea5e9', strong: '#38bdf8', secondary: '#22d3ee' },
  { key: 'emerald', label: 'Emerald', color: '#10b981', strong: '#34d399', secondary: '#22d3ee' },
  { key: 'amber', label: 'Amber', color: '#f59e0b', strong: '#fbbf24', secondary: '#f43f5e' },
  { key: 'rose', label: 'Rose', color: '#f43f5e', strong: '#fb7185', secondary: '#f59e0b' },
];

/** Preset colors offered for per-section accents. */
export const SECTION_COLORS: string[] = [
  '#6366f1',
  '#22d3ee',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#8b5cf6',
  '#0ea5e9',
  '#ec4899',
];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** True if `value` is a valid hex color string. */
export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value);
}

/** Resolve a settings accent value (preset key or hex) to concrete colors. */
export function resolveAccent(value: string): Accent {
  const preset = ACCENTS.find((a) => a.key === value);
  if (preset) return preset;
  if (HEX.test(value)) {
    return { key: value, label: 'Custom', color: value, strong: value, secondary: value };
  }
  return ACCENTS[0];
}

/** Apply accent colors and light/dark theme to the document root. */
export function applyTheme(accentValue: string, theme: 'dark' | 'light'): void {
  const root = document.documentElement;
  const accent = resolveAccent(accentValue);
  root.style.setProperty('--accent', accent.color);
  root.style.setProperty('--accent-strong', accent.strong);
  root.style.setProperty('--accent-2', accent.secondary);
  root.dataset.theme = theme;
}
