'use client';

import { useEffect } from 'react';

/**
 * SecurityMuzzle
 * Suppresses console noise and potential PII leak via console in production.
 * Only active when process.env.NODE_ENV === 'production'
 */
export const SecurityMuzzle = () => {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return;

        const muzzle = () => {
            const noop = () => { };
            // Preserve only critical errors if needed, but muzzle mostly everything
            // to ensure no tokens/PII leak into user browser logs
            console.log = noop;
            console.debug = noop;
            console.info = noop;

            // We keep console.error but wrap it to ensure it doesn't log object/payload blobs
            const originalError = console.error;
            console.error = (...args: any[]) => {
                const safeArgs = args.map(arg => {
                    if (typeof arg === 'object') return '[Object]';
                    if (typeof arg === 'string' && (arg.includes('token') || arg.includes('key'))) return '[Redacted]';
                    return arg;
                });
                originalError("[SecurityMuzzle] intercepted error:", ...safeArgs);
            };
        };

        muzzle();
    }, []);

    return null;
};
