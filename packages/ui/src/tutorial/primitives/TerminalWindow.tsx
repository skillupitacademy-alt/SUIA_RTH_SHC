'use client';

import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Copy, Check } from 'lucide-react';
import type { DomainTheme } from '../types';
import { getThemeColor, DEFAULT_THEME } from '../theme-utils';

export interface TerminalWindowProps {
  title: string;
  children: ReactNode;
  copySource?: string;
  theme?: DomainTheme;
  className?: string;
}

/**
 * Universal Terminal Window - Generic UBA Code & Shell Primitive
 * 
 * Standardizes terminal header with macOS-style window controls,
 * copy-to-clipboard button, and high-contrast code presentation.
 * Used across CodeBlock (C1–C10), ExecutionBlock (E1–E8), and ExerciseBlock (EX1–EX8).
 */
export function TerminalWindow({
  title,
  children,
  copySource,
  theme,
  className = '',
}: TerminalWindowProps) {
  const [copied, setCopied] = useState(false);
  const activeTheme = theme ?? DEFAULT_THEME;

  const copy = async () => {
    if (!copySource) return;
    try {
      await navigator.clipboard?.writeText(copySource);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // Gracefully handle clipboard rejection (permissions, unavailable, etc.)
      console.warn('Clipboard write failed:', err);
    }
  };

  return (
    <div
      data-testid="terminal-window"
      className={`w-full overflow-hidden rounded-[11px] border shadow-[0_8px_24px_rgba(7,20,47,0.12)] ${className}`.trim()}
      style={{
        borderColor: getThemeColor(activeTheme, 'slate', 800),
        backgroundColor: getThemeColor(activeTheme, 'slate', 900),
      }}
    >
      <div
        className="flex min-h-[58px] items-center gap-3.5 border-b px-[18px]"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          backgroundColor: getThemeColor(activeTheme, 'slate', 900),
          color: getThemeColor(activeTheme, 'slate', 50),
        }}
      >
        <div data-testid="terminal-control-dots" className="flex items-center gap-[7px]" aria-hidden="true">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: getThemeColor(activeTheme, 'rose', 500) }}
          />
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: getThemeColor(activeTheme, 'amber', 400) }}
          />
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: getThemeColor(activeTheme, 'emerald', 500) }}
          />
        </div>
        <span className="text-sm font-bold leading-snug">{title}</span>
        {copySource ? (
          <button
            type="button"
            onClick={copy}
            className="ml-auto inline-flex items-center gap-[7px] rounded-md border border-white/15 px-3 py-2 text-[13px] font-bold text-white transition hover:border-white/25 hover:bg-white/10"
            aria-label={copied ? 'Copied code to clipboard' : 'Copy code to clipboard'}
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
