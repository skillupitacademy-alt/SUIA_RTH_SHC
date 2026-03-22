'use client';

import React, { useState, useLayoutEffect, useRef } from 'react';

interface StableRenderGuardProps {
    children: React.ReactNode;
}

/**
 * DEFINITIVE FIX FOR Recharts width(-1) / height(-1) errors.
 * This component waits for the parent container to have actual non-zero dimensions
 * before rendering the chart. It also guards against SSR mismatch and animation delays.
 */
export const StableRenderGuard: React.FC<StableRenderGuardProps> = ({ children }) => {
    const [stable, setStable] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 1 && height > 1) {
                    setStable(true);
                    observer.disconnect();
                }
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[inherit]">
            {stable ? children : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50/5 animate-pulse rounded-2xl" />
            )}
        </div>
    );
};
