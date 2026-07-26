import type { CSSProperties } from 'react';

export type NotesUiuxContract = Record<string, unknown>;

export function asUiuxRecord(value: unknown): NotesUiuxContract {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as NotesUiuxContract : {};
}

export function pickUiuxString(contract: NotesUiuxContract | undefined, keys: string[], fallback: string) {
  const source = contract ?? {};
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return fallback;
}

export function pickUiuxBoolean(contract: NotesUiuxContract | undefined, key: string, fallback = false) {
  const value = contract?.[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function getUiuxColor(contract: NotesUiuxContract | undefined, key: string, fallback: string) {
  const value = contract?.[key];
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export function getDensityPadding(contract: NotesUiuxContract | undefined, fallback = '1.75rem') {
  const density = pickUiuxString(contract, ['density'], 'comfortable').toLowerCase();
  if (density === 'compact') return '1.25rem';
  if (density === 'spacious' || density === 'relaxed') return '2.25rem';
  return fallback;
}

export function getSurfaceStyle(contract: NotesUiuxContract | undefined, themeColor: string): CSSProperties {
  return {
    backgroundColor: getUiuxColor(contract, 'background_color', '#ffffff'),
    borderColor: getUiuxColor(contract, 'border_color', '#dbeafe'),
    color: getUiuxColor(contract, 'text_color', '#0f172a'),
    padding: getDensityPadding(contract),
    boxShadow: pickUiuxString(contract, ['shadow'], 'soft') === 'none' ? 'none' : undefined,
    ['--notes-primary' as string]: getUiuxColor(contract, 'primary_color', themeColor),
    ['--notes-accent' as string]: getUiuxColor(contract, 'accent_color', '#10b981'),
  };
}

export function isPartVisible(contract: NotesUiuxContract | undefined, partId: string, fallback = true) {
  const visibleParts = asUiuxRecord(contract?.visible_parts);
  const directVisible = visibleParts[partId];
  if (typeof directVisible === 'boolean') return directVisible;

  const subcomponents = contract?.ui_subcomponents;
  if (Array.isArray(subcomponents)) {
    const match = subcomponents
      .map(asUiuxRecord)
      .find((item) => String(item.id || '').toLowerCase() === partId.toLowerCase());
    if (match && typeof match.visible === 'boolean') return match.visible;
  }

  return fallback;
}

export function getLayoutClass(contract: NotesUiuxContract | undefined, fallback: string) {
  const layout = pickUiuxString(contract, ['layout', 'layout_type'], '').toLowerCase();
  if (layout === 'grid') return 'grid gap-4 md:grid-cols-2';
  if (layout === 'inline') return 'flex flex-wrap items-center gap-4';
  if (layout === 'single_column' || layout === 'card') return 'space-y-5';
  return fallback;
}
