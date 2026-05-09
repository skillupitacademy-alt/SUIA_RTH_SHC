'use client';

import { initSecurityMuzzle } from '@quiz/observability';
import { useEffect } from 'react';

/**
 * SECURITY MUZZLE: Global Log Guardian (Admin Terminal)
 */

export function SecurityMuzzle() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return;

        // Activate core suppression
        initSecurityMuzzle();

        const originalError = console.error;
        const originalWarn = console.warn;

        const scrub = (msg: unknown) => {
            if (typeof msg !== 'string') return msg;
            return msg
                .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted]')
                .replace(/bearer\s+[A-Z0-9._-]+/gi, 'bearer [redacted]')
                .replace(/(x-internal-key|x-api-key|token|password|secret)=[^&\s]+/gi, '$1=[redacted]');
        };

        console.warn = (...args: unknown[]) => {
            const first = args[0];
            const msg = typeof first === 'string' ? first : String(first ?? '');
            if (msg.includes('Content Security Policy') || msg.includes('CSP')) return;
            originalWarn(...args.map(scrub));
        };

        console.error = (...args: unknown[]) => {
            const first = args[0];
            const msg = typeof first === 'string' ? first : String(first ?? '');
            if (msg.includes('Content Security Policy') || msg.includes('CSP')) return;
            originalError(...args.map(scrub));
        };

        return () => {
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    return null;
}
