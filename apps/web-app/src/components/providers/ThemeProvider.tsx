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
        root.classList.remove('theme-a', 'theme-b', 'light', 'dark');
        root.classList.add(theme);
        root.classList.add(mode);
    }, [theme, mode, mounted]);

    if (!mounted) {
        return <>{children}</>;
    }

    return <>{children}</>;
}
