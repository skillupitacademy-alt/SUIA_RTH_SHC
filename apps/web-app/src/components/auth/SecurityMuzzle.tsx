'use client';

import { useEffect } from 'react';

/**
 * SECURITY MUZZLE: CSP Console Filter
 * Prevents Content Security Policy (Report-Only) noise from cluttering the browser console.
 * It intercepts console methods and suppresses messages related to CSP violations
 * while the system is in AUDIT MODE.
 */

export function SecurityMuzzle() {
    useEffect(() => {
        // Only engage in client-side browser environment
        if (typeof window === 'undefined') return;

        const originalWarn = console.warn;
        const originalInfo = console.info;
        const originalError = console.error;

        const isCspNoise = (args: unknown[]) => {
            const msg = args.join(' ');
            return (
                msg.includes('Content Security Policy') ||
                msg.includes('violates the following Content Security Policy directive') ||
                msg.includes('upgrade-insecure-requests')
            );
        };

        console.warn = (...args: unknown[]) => {
            if (isCspNoise(args)) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            originalWarn.apply(console, args as any[]);
        };

        console.info = (...args: unknown[]) => {
            if (isCspNoise(args)) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            originalInfo.apply(console, args as any[]);
        };

        // Browsers often log CSP violations as "errors", though next.js might catch them
        console.error = (...args: unknown[]) => {
            if (isCspNoise(args)) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            originalError.apply(console, args as any[]);
        };

        return () => {
            console.warn = originalWarn;
            console.info = originalInfo;
            console.error = originalError;
        };
    }, []);

    return null; // Transparent utility component
}
