'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, mode } = useThemeStore();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;

        // Use a transition class to avoid flashing during initial load but enable it for toggles
        root.classList.add('theme-transitioning');

        root.classList.remove('theme-a', 'theme-b', 'light', 'dark');
        root.classList.add(theme);
        root.classList.add(mode);

        const timer = setTimeout(() => {
            root.classList.remove('theme-transitioning');
        }, 300);

        return () => clearTimeout(timer);
    }, [theme, mode, mounted]);

    if (!mounted) {
        return <div className="invisible">{children}</div>;
    }

    return <>{children}</>;
}
