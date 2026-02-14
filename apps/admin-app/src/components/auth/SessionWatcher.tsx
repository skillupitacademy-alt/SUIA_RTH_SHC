"use client";

import { useEffect, useState, useCallback } from 'react';
import { ZConfirmationDialog } from '@/components/ui/ZConfirmationDialog';
import { useAuthStore } from '@/store/auth-store';

const WARNING_THRESHOLD = 180; // 180 seconds (3 minutes) for token expiry
const IDLE_WARNING_MS = 3 * 60 * 1000; // 3 minutes
const IDLE_LOCK_MS = 5 * 60 * 1000;    // 5 minutes

interface SessionWatcherProps {
    expiresAt: string | null;
    onRefresh: () => Promise<void>;
    onLogout: () => void;
    isRedirecting?: boolean;
    redirectMessage?: string;
}

export function SessionWatcher({ expiresAt, onRefresh, onLogout, isRedirecting, redirectMessage }: SessionWatcherProps) {
    const { lock, isLocked } = useAuthStore();
    const [showWarning, setShowWarning] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    // Idle Tracking State
    const [lastActivityAt, setLastActivityAt] = useState(Date.now());
    const [isIdleWarning, setIsIdleWarning] = useState(false);

    const handleStayLoggedIn = async () => {
        setIsRefreshing(true);
        try {
            if (isIdleWarning) {
                // For idle warning, just reset the idle timer
                setLastActivityAt(Date.now());
                setIsIdleWarning(false);
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
        if (!isLocked && !isIdleWarning) {
            setLastActivityAt(Date.now());
        }
    }, [isLocked, isIdleWarning]);

    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'mousemove'];
        events.forEach(e => window.addEventListener(e, resetIdleTimer));

        // E2E Test Hook: Allow triggering specific idle offsets
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
            const now = Date.now();

            // A. Check absolute token session expiry
            if (expiresAt) {
                const expiryTime = new Date(expiresAt).getTime();
                const timeLeftSeconds = Math.floor((expiryTime - now) / 1000);
                setRemainingSeconds(timeLeftSeconds);

                if (timeLeftSeconds <= 0) {
                    onLogout();
                    return;
                } else if (timeLeftSeconds <= WARNING_THRESHOLD) {
                    setIsIdleWarning(false); // Token expiry takes precedence
                    setShowWarning(true);
                }
            }

            // B. Check Inactivity (Lock Logic)
            if (!isLocked) {
                const idleTime = now - lastActivityAt;
                if (idleTime >= IDLE_LOCK_MS) {
                    setIsIdleWarning(false);
                    setShowWarning(false);
                    lock();
                } else if (idleTime >= IDLE_WARNING_MS) {
                    setIsIdleWarning(true);
                    setShowWarning(true);
                }
            }
        };

        const interval = setInterval(checkStatus, 5000); // Check every 5s for accuracy
        checkStatus();

        return () => clearInterval(interval);
    }, [expiresAt, onLogout, lastActivityAt, isLocked, lock]);

    // If a redirect is already underway or locked, suppress the warning modal.
    useEffect(() => {
        if (isRedirecting || isLocked) {
            setShowWarning(false);
        }
    }, [isRedirecting, isLocked]);

    const warningTitle = isIdleWarning ? "Inactivity Protection" : "Session Expiring";
    const warningDesc = isIdleWarning
        ? "You have been idle for a while. For security, your terminal will lock in 2 minutes. Click stay active to continue."
        : `Your secure governance session will expire in ${remainingSeconds ? Math.ceil(remainingSeconds / 60) : 3} minutes. Would you like to stay logged in?`;

    return (
        <>
            {isRedirecting && (
                <div className="fixed top-6 right-6 z-[10000] animate-in fade-in slide-in-from-right duration-500">
                    <div className="bg-white border-l-4 border-[#FF4B91] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]">
                        <div className="h-2 w-2 rounded-full bg-[#FF4B91] animate-pulse" />
                        <div className="flex flex-col">
                            <span className="alpha-terminal text-[10px] text-[#FF4B91] !tracking-[0.2em]">Security Protocol</span>
                            <span className="text-sm font-bold text-slate-800">{redirectMessage ?? 'Redirecting...'}</span>
                        </div>
                    </div>
                </div>
            )}

            <ZConfirmationDialog
                isOpen={showWarning && !isRedirecting && !isLocked}
                title={warningTitle}
                description={warningDesc}
                confirmText={isRefreshing ? "Renewing..." : (isIdleWarning ? "Stay Active" : "Stay Logged In")}
                cancelText={isIdleWarning ? "Lock Now" : "Sign Out Now"}
                onConfirm={handleStayLoggedIn}
                onClose={isIdleWarning ? () => lock() : onLogout}
                variant="warning"
            />
        </>
    );
}
