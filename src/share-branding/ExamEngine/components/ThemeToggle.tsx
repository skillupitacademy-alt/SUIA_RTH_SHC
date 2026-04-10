'use client';

import { Palette, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CardThemeMode, EXAM_CARD_THEMES } from './cardThemes';

interface ThemeToggleProps {
  value: CardThemeMode;
  onChange: (mode: CardThemeMode) => void;
  accentColor: string;
}

const THEME_ORDER: CardThemeMode[] = ['premium-white', 'soft-sage', 'warm-sage', 'high-clarity'];

export function ThemeToggle({ value, onChange, accentColor }: ThemeToggleProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const activeTheme = EXAM_CARD_THEMES[value];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex min-h-10 min-w-[152px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        style={{ borderColor: 'rgba(255,255,255,0.22)' }}
      >
        <span className="flex items-center gap-2">
          <Palette className="h-4 w-4 shrink-0" />
          <span>Theme</span>
        </span>
        <span className="truncate text-xs text-white/82">{activeTheme.shortLabel}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Theme options"
          className="absolute bottom-[calc(100%+12px)] left-0 z-50 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_70px_rgba(15,23,42,0.28)]"
        >
          <div className="border-b border-slate-200 px-3 py-3">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Surface Theme</div>
            <p className="mt-1 text-sm text-slate-600">Applied across the full exam layout, including header, footer, and all cards.</p>
          </div>

          <div className="space-y-2 p-2">
            {THEME_ORDER.map((mode) => {
              const theme = EXAM_CARD_THEMES[mode];
              const isActive = mode === value;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    onChange(mode);
                    setOpen(false);
                  }}
                  className="flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
                  style={{ borderColor: isActive ? accentColor : '#E2E8F0', backgroundColor: isActive ? `${accentColor}10` : '#FFFFFF' }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{theme.label}</span>
                      {theme.accessibilityBadge && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                          {theme.accessibilityBadge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{theme.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-5 w-5 rounded-md border border-slate-200" style={{ backgroundColor: theme.questionSurface }} />
                      <span className="h-5 w-5 rounded-md border border-slate-200" style={{ backgroundColor: theme.answerSurface }} />
                      <span className="h-5 w-5 rounded-md border border-slate-200" style={{ backgroundColor: theme.trackerSurface }} />
                    </div>
                  </div>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: isActive ? accentColor : '#E2E8F0' }}>
                    {isActive ? <Check className="h-4 w-4 text-white" /> : <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
