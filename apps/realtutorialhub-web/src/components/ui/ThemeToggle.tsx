'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const THEME_SWATCHES = [
  { key: 'classic', label: 'Classic', color: '#3d5a9e' },
  { key: 'midnight', label: 'Midnight', color: '#1a2540' },
  { key: 'pastel', label: 'Pastel', color: '#6aa7ff' },
  { key: 'forest', label: 'Forest', color: '#2e7d46' },
  { key: 'ocean', label: 'Ocean', color: '#2e7d72' },
  { key: 'saffron', label: 'Saffron', color: '#f57c00' },
] as const;

interface ThemeToggleProps {
  currentTheme?: string;
  onThemeChange?: (theme: string) => void;
}

export function ThemeToggle({ currentTheme, onThemeChange }: ThemeToggleProps) {
  const t = useTranslations('navbar');
  const [theme, setTheme] = useState(currentTheme ?? 'classic');

  useEffect(() => {
    const storedTheme = currentTheme ?? window.localStorage.getItem('rth-tutorial-theme') ?? 'classic';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-tutorial-theme', storedTheme);
  }, [currentTheme]);

  const setTutorialTheme = (nextTheme: string) => {
    setTheme(nextTheme);
    window.localStorage.setItem('rth-tutorial-theme', nextTheme);
    document.documentElement.setAttribute('data-tutorial-theme', nextTheme);
    onThemeChange?.(nextTheme);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: 'var(--block-text-secondary)', fontWeight: 600 }}>{t('theme')}</span>
      {THEME_SWATCHES.map((swatch) => {
        const active = swatch.key === theme;
        return (
          <button
            key={swatch.key}
            type="button"
            title={swatch.label}
            onClick={() => setTutorialTheme(swatch.key)}
            aria-pressed={active}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: `1px solid ${swatch.color}`,
              background: swatch.color,
              boxShadow: active ? `0 0 0 2px var(--tutorial-surface), 0 0 0 4px ${swatch.color}` : 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          />
        );
      })}
    </div>
  );
}
