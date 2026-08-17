'use client';

import { Bell, Menu, Search } from 'lucide-react';
import type { BrandTutorialTheme, TutorialFooterNavigationItem } from '@quiz/types';

interface TutorialHeaderProps {
  crumbs: string[];
  active: string;
  theme: BrandTutorialTheme;
  onMenuClick?: () => void;
}

interface TutorialFooterProps {
  previous: TutorialFooterNavigationItem | null;
  next: TutorialFooterNavigationItem | null;
  theme: BrandTutorialTheme;
}

export function TutorialHeader({ crumbs, active, theme, onMenuClick }: TutorialHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e6ebf2] bg-white/95 backdrop-blur">
      <div className="flex min-h-[70px] items-center gap-5 px-6">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dfe7f1] text-[#071f63]"
          onClick={onMenuClick}
          aria-label="Toggle tutorial sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <nav className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold text-[#071f63]">
          {crumbs.map((crumb) => (
            <span key={crumb} className="truncate">
              {crumb}
              <span className="mx-2 text-[#9aa8bc]">&gt;</span>
            </span>
          ))}
          <span className="truncate" style={{ color: theme.primary }}>{active}</span>
        </nav>
        <div className="hidden h-10 w-[280px] items-center gap-2 rounded-lg border border-[#dfe7f1] px-3 text-xs font-semibold text-[#7a8aa2] md:flex">
          <span className="flex-1">Search anything...</span>
          <Search className="h-4 w-4 text-[#071f63]" />
        </div>
        <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe7f1] text-[#071f63]" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-1 h-2 w-2 rounded-full" style={{ backgroundColor: theme.primary }} />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white" style={{ backgroundColor: theme.primary }}>
          S
        </div>
      </div>
    </header>
  );
}

export function TutorialFooterNavigation({ previous, next, theme }: TutorialFooterProps) {
  return (
    <footer className="mt-8 border-t border-[#e6ebf2] bg-white px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        {previous ? (
          <a href={previous.url ?? '#'} className="rounded-lg border px-5 py-3 text-sm font-black" style={{ borderColor: theme.primary, color: theme.primary }}>
            &larr; {previous.name}
          </a>
        ) : <span />}
        {next ? (
          <a href={next.url ?? '#'} className="rounded-lg px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: theme.primary }}>
            {next.name} &rarr;
          </a>
        ) : <span />}
      </div>
    </footer>
  );
}
