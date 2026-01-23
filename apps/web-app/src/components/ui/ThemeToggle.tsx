'use client';

import { useThemeStore } from '@/store/theme-store';
import { Moon, Sun, Palette } from 'lucide-react';

export function ThemeToggle() {
    const { theme, mode, toggleTheme, toggleMode } = useThemeStore();

    return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <button
                onClick={toggleMode}
                className="p-2 rounded-md hover:bg-background transition-colors"
                title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
            >
                {mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="w-[1px] h-6 bg-border mx-1" />

            <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-background transition-colors font-medium text-sm"
                title="Toggle Enterprise Theme"
            >
                <Palette size={20} className="text-primary" />
                <span>{theme === 'theme-a' ? 'Enterprise A' : 'Enterprise B'}</span>
            </button>
        </div>
    );
}
