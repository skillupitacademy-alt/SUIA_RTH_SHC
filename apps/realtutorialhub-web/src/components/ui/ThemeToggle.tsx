'use client';

import type { MouseEvent } from 'react';

const THEME_SWATCHES = [
  { key: 'classic', label: 'Classic', color: '#3d5a9e' },
  { key: 'midnight', label: 'Midnight', color: '#1a2540' },
  { key: 'pastel', label: 'Pastel', color: '#6aa7ff' },
  { key: 'forest', label: 'Forest', color: '#2e7d46' },
  { key: 'ocean', label: 'Ocean', color: '#2e7d72' },
  { key: 'saffron', label: 'Saffron', color: '#f57c00' },
] as const;

interface ThemeToggleProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export function ThemeToggle({ currentTheme, onThemeChange }: ThemeToggleProps) {
  const handleClick = (theme: string) => (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onThemeChange(theme);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: '#718096', fontWeight: 600 }}>Theme:</span>
      {THEME_SWATCHES.map((theme) => {
        const active = currentTheme === theme.key;
        return (
          <button
            key={theme.key}
            type="button"
            title={theme.label}
            onClick={handleClick(theme.key)}
            aria-pressed={active}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: `1px solid ${theme.color}`,
              background: theme.color,
              boxShadow: active ? `0 0 0 2px #ffffff, 0 0 0 4px ${theme.color}` : 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'scale(1)';
            }}
          />
        );
      })}
    </div>
  );
}
