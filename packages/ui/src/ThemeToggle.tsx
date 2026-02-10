'use client';

import React from 'react';
import { Palette } from 'lucide-react';
import { useThemeStore } from './theme-store';

export function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 shadow-sm">
            <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white hover:shadow-sm transition-all duration-300 font-bold text-xs uppercase tracking-widest text-slate-600"
                title="Toggle Enterprise Theme"
            >
                <Palette size={16} className="text-[#FF4B91]" />
                <span className="font-mono">{theme === 'theme-a' ? 'Enterprise A' : 'Enterprise B'}</span>
            </button>
        </div>
    );
}
