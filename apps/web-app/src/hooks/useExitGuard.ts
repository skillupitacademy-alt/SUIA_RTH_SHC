'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseExitGuardOptions {
    enabled: boolean;
    message?: string;
}

interface UseExitGuardReturn {
    showDialog: boolean;
    confirmExit: () => void;
    cancelExit: () => void;
}

/**
 * Custom hook for exit protection with custom dialog support.
 * Handles browser close/refresh (beforeunload) and back button (popstate).
 */
export function useExitGuard({ enabled, message }: UseExitGuardOptions): UseExitGuardReturn {
    const [showDialog, setShowDialog] = useState(false);
    const pendingNavigationRef = useRef<(() => void) | null>(null);
    const historyPushedRef = useRef(false);
    const isExitingRef = useRef(false);

    // Handle beforeunload (browser close/refresh)
    useEffect(() => {
        if (!enabled) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isExitingRef.current) return;
            e.preventDefault();
            e.returnValue = message || '';
            return message || '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [enabled, message]);

    // Handle back button via History API
    useEffect(() => {
        if (!enabled) {
            historyPushedRef.current = false;
            isExitingRef.current = false;
            return;
        }

        // Push a dummy state to intercept back button
        if (!historyPushedRef.current) {
            window.history.pushState({ exitGuard: true }, '', window.location.href);
            historyPushedRef.current = true;
        }

        const handlePopState = (e: PopStateEvent) => {
            // User pressed back button
            if (enabled && !isExitingRef.current) {
                // Re-push state to stay on page
                window.history.pushState({ exitGuard: true }, '', window.location.href);
                
                // Store the pending navigation action
                pendingNavigationRef.current = () => {
                    isExitingRef.current = true;
                    window.history.go(-2); // Go back past our dummy state
                };
                
                setShowDialog(true);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [enabled]);

    const confirmExit = useCallback(() => {
        setShowDialog(false);
        
        if (pendingNavigationRef.current) {
            // Remove exit guard listener temporarily
            historyPushedRef.current = false;
            pendingNavigationRef.current();
            pendingNavigationRef.current = null;
        }
    }, []);

    const cancelExit = useCallback(() => {
        setShowDialog(false);
        pendingNavigationRef.current = null;
    }, []);

    return {
        showDialog,
        confirmExit,
        cancelExit
    };
}
