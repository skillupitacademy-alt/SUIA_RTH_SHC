"use client";

import { useCallback, useEffect, useState } from 'react';

import { ZConfirmationDialog } from '@/components/ui/ZConfirmationDialog';
import { useAuthStore } from '@/store/auth-store';

declare global {
    interface Window {
        __idleTestConfig?: {
            IDLE_WARNING_MS: number;
            IDLE_LOCK_MS: number;
            FORCED_IDLE_WARNING_MS: number;
            FORCED_IDLE_LOGOUT_MS: number;
        };
    }
}

// Default Constants
const WARNING_THRESHOLD = 180; // 180 seconds (3 minutes) for token expiry
const DEFAULT_IDLE_WARNING_MS = 3 * 60 * 1000;
const DEFAULT_IDLE_LOCK_MS = 5 * 60 * 1000;
const DEFAULT_FORCED_IDLE_WARNING_MS = 55 * 60 * 1000;
const DEFAULT_FORCED_IDLE_LOGOUT_MS = 60 * 60 * 1000;

interface SessionWatcherProps {
    expiresAt: string | null;
    onRefresh: () => Promise<void>;
    onLogout: () => void;
    isRedirecting?: boolean;
    redirectMessage?: string;
}

export function SessionWatcher({ expiresAt, onRefresh, onLogout, isRedirecting, redirectMessage }: SessionWatcherProps) {
    const { lock, isLocked, isLoggingOut } = useAuthStore();
    const [showWarning, setShowWarning] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    // Idle Tracking State
    const [lastActivityAt, setLastActivityAt] = useState(Date.now());
    const [isIdleWarning, setIsIdleWarning] = useState(false);
    const [isForcedLogoutWarning, setIsForcedLogoutWarning] = useState(false);

    // ... (Handlers kept same, but re-pasting for context if needed, focusing on checkStatus)

    const handleStayLoggedIn = async () => {
        setIsRefreshing(true);
        try {
            if (isIdleWarning || isForcedLogoutWarning) {
                // For idle warnings, just reset the idle timer
                setLastActivityAt(Date.now());
                setIsIdleWarning(false);
                setIsForcedLogoutWarning(false);
                setShowWarning(false);
            } else {
                // For session expiry, do a real refresh
                await onRefresh();
                setShowWarning(false);
            }
        } catch {
            onLogout();
        } finally {
            setIsRefreshing(false);
        }
    };

    // 1. Monitor User Activity
    const resetIdleTimer = useCallback(() => {
        if (!isLocked && !isForcedLogoutWarning) {
            setLastActivityAt(Date.now());
        }
    }, [isLocked, isForcedLogoutWarning]);

    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'mousemove'];
        events.forEach(e => window.addEventListener(e, resetIdleTimer));

        // E2E Test Hook
        const handleTestTrigger = (e: Event) => {
            const ce = e as CustomEvent<{ detail?: number }>;
            if (typeof ce.detail === 'number') {
                setLastActivityAt(Date.now() - ce.detail);
            }
        };
        window.addEventListener('test:trigger-idle', handleTestTrigger);

        return () => {
            events.forEach(e => window.removeEventListener(e, resetIdleTimer));
            window.removeEventListener('test:trigger-idle', handleTestTrigger);
        };
    }, [resetIdleTimer]);

    // 2. Poll for Session Expiry & Inactivity
    useEffect(() => {
        const checkStatus = () => {
            if (isLoggingOut) return;
            const now = Date.now();
            const idleTime = now - lastActivityAt;

            // Determine thresholds (Support E2E overrides)
            const config = typeof window !== 'undefined' && window.__idleTestConfig ? window.__idleTestConfig : {
                IDLE_WARNING_MS: DEFAULT_IDLE_WARNING_MS,
                IDLE_LOCK_MS: DEFAULT_IDLE_LOCK_MS,
                FORCED_IDLE_WARNING_MS: DEFAULT_FORCED_IDLE_WARNING_MS,
                FORCED_IDLE_LOGOUT_MS: DEFAULT_FORCED_IDLE_LOGOUT_MS
            };

            // A. Check for Forced Idle Logout - Absolute Priority
            if (idleTime >= config.FORCED_IDLE_LOGOUT_MS) {
                onLogout();
                return;
            }

            // B. Check absolute token session expiry
            if (expiresAt) {
                const expiryTime = new Date(expiresAt).getTime();
                const timeLeftSeconds = Math.floor((expiryTime - now) / 1000);
                setRemainingSeconds(timeLeftSeconds);

                if (timeLeftSeconds <= 0) {
                    onLogout();
                    return;
                } else if (timeLeftSeconds <= WARNING_THRESHOLD) {
                    setIsIdleWarning(false);
                    setIsForcedLogoutWarning(false);
                    setShowWarning(true);
                    return;
                }
            }

            // C. Check Inactivity (Lock & Logout logic)
            if (idleTime >= config.FORCED_IDLE_WARNING_MS) {
                setIsForcedLogoutWarning(true);
                setIsIdleWarning(false);
                setShowWarning(true);
            } else if (!isLocked) {
                if (idleTime >= config.IDLE_LOCK_MS) {
                    setIsIdleWarning(false);
                    setShowWarning(false);
                    lock();
                } else if (idleTime >= config.IDLE_WARNING_MS) {
                    setIsIdleWarning(true);
                    setShowWarning(true);
                }
            }
        };

        const interval = setInterval(checkStatus, 1000); // Check every 1s for responsiveness in tests
        checkStatus();

        return () => clearInterval(interval);
    }, [expiresAt, onLogout, lastActivityAt, isLocked, lock, isLoggingOut]);

    // If a redirect is already underway or locked, suppress the warning modal, 
    // unless it's the high-priority forced logout warning.
    useEffect(() => {
        if ((isRedirecting || isLocked) && !isForcedLogoutWarning) {
            setShowWarning(false);
        }
    }, [isRedirecting, isLocked, isForcedLogoutWarning]);

    let warningTitle = "Session Expiring";
    let warningDesc = `Your secure governance session will expire in ${remainingSeconds ? Math.ceil(remainingSeconds / 60) : 3} minutes. Would you like to stay logged in?`;

    if (isForcedLogoutWarning) {
        warningTitle = "Security Cutoff Imminent";
        warningDesc = "You have been idle for 55 minutes. For security, you will be automatically signed out in 5 minutes. Click below to confirm you are still present.";
    } else if (isIdleWarning) {
        warningTitle = "Inactivity Protection";
        warningDesc = "You have been idle for a while. For security, your terminal will lock in 2 minutes. Click stay active to continue.";
    }

    return (
        <>
            {isRedirecting ? <div className="fixed top-6 right-6 z-[10000] animate-in fade-in slide-in-from-right duration-500">
                <div className="bg-white border-l-4 border-[#FF4B91] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]">
                    <div className="h-2 w-2 rounded-full bg-[#FF4B91] animate-pulse" />
                    <div className="flex flex-col">
                        <span className="alpha-terminal text-[10px] text-[#FF4B91] !tracking-[0.2em]">Security Protocol</span>
                        <span className="text-sm font-bold text-slate-800">{redirectMessage ?? 'Redirecting...'}</span>
                    </div>
                </div>
            </div> : null}

            <ZConfirmationDialog
                isOpen={!!(showWarning && !isRedirecting && !isLoggingOut && (!isLocked || isForcedLogoutWarning))}
                title={warningTitle}
                description={warningDesc}
                confirmText={isRefreshing ? "Renewing..." : ((isIdleWarning || isForcedLogoutWarning) ? "Stay Active" : "Stay Logged In")}
                cancelText={(isIdleWarning || isForcedLogoutWarning) ? (isForcedLogoutWarning ? "Sign Out Now" : "Lock Now") : "Sign Out Now"}
                onConfirm={handleStayLoggedIn}
                onClose={isForcedLogoutWarning ? onLogout : (isIdleWarning ? () => lock() : onLogout)}
                variant={isForcedLogoutWarning ? "danger" : "warning"}
            />
        </>
    );
}
