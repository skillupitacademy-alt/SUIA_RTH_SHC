'use client';

import { useEffect } from 'react';
import { clientLogger } from '@/utils/clientLogger';
import { initSecurityMuzzle } from '@quiz/observability';

/**
 * SECURITY MUZZLE: Global Log Guardian
 * Suppresses common production noise and scrubs PII from the log stream.
 * In production, it intercepts console methods to enforce JSON-only logging policy.
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

        // Extra filtering for CSP noise (specific to frontend)
        console.warn = (...args: unknown[]) => {
            const msg = String(args[0] || '');
            if (msg.includes('Content Security Policy') || msg.includes('CSP')) return;
            originalWarn(...args.map(scrub));
        };

        console.error = (...args: unknown[]) => {
            const msg = String(args[0] || '');
            if (msg.includes('Content Security Policy') || msg.includes('CSP')) return;
            originalError(...args.map(scrub));
        };

        clientLogger.debug('SecurityMuzzle: Armor active (Centralized + CSP Policy)');

        return () => {
            // Restore originals on unmount (mainly for HMR in local prod-like tests)
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    return null;
}
