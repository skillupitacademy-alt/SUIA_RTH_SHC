'use client';

import { useEffect } from 'react';

// Global counter and style storage to manage multiple open modals
let openModalsCount = 0;
let originalBodyOverflow = '';
let originalMainOverflowY = '';

/**
 * Hook to lock scrolling on the document body and the main layout content area.
 * This ensures that when a modal is open, the background doesn't scroll.
 * Uses reference counting to be safe for multiple simultaneous overlays.
 */
export function useScrollLock(lock: boolean) {
    useEffect(() => {
        if (!lock) return;

        openModalsCount++;

        if (openModalsCount === 1) {
            // 1. Lock document body
            originalBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            // 2. Lock the main layout content area (which has overflow-y-auto)
            const mainContent = document.querySelector('main');
            if (mainContent) {
                originalMainOverflowY = mainContent.style.overflowY;
                mainContent.style.overflowY = 'hidden';
            }
        }

        return () => {
            openModalsCount--;

            if (openModalsCount === 0) {
                // Restore styles only when the last modal closes
                document.body.style.overflow = originalBodyOverflow;
                
                const mainContent = document.querySelector('main');
                if (mainContent) {
                    mainContent.style.overflowY = originalMainOverflowY;
                }
            }
        };
    }, [lock]);
}
