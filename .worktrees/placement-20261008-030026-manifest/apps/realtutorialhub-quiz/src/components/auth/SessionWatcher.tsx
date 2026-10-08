"use client";

import { useEffect, useState, useCallback } from 'react';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

const WARNING_THRESHOLD = 180; // 3 minutes
const FORCED_IDLE_WARNING_MS = 55 * 60 * 1000;
const FORCED_IDLE_LOGOUT_MS = 60 * 60 * 1000;

interface SessionWatcherProps {
    expiresAt: string | null;
    onRefresh: () => Promise<void>;
    onLogout: () => void;
    isRedirecting?: boolean;
}

export function SessionWatcher({ expiresAt, onRefresh, onLogout, isRedirecting }: SessionWatcherProps) {
    const [showWarning, setShowWarning] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    // Idle State
    const [lastActivityAt, setLastActivityAt] = useState(Date.now());
    const [isForcedLogoutWarning, setIsForcedLogoutWarning] = useState(false);

    const handleStayLoggedIn = async () => {
        setIsRefreshing(true);
        try {
            if (isForcedLogoutWarning) {
                setLastActivityAt(Date.now());
                setIsForcedLogoutWarning(false);
                setShowWarning(false);
            } else {
                await onRefresh();
                setShowWarning(false);
            }
        } catch (err) {
            const status = typeof err === 'object' && err !== null ? (err as { status?: number }).status : undefined;
            if (status === 403) {
                setShowWarning(false);
                return;
            }
            onLogout();
        } finally {
            setIsRefreshing(false);
        }
    };

    // Track Activity
    const resetIdleTimer = useCallback(() => {
        if (!isForcedLogoutWarning) {
            setLastActivityAt(Date.now());
        }
    }, [isForcedLogoutWarning]);

    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'mousemove'];
        events.forEach(e => window.addEventListener(e, resetIdleTimer));
        return () => events.forEach(e => window.removeEventListener(e, resetIdleTimer));
    }, [resetIdleTimer]);

    useEffect(() => {
        const checkStatus = () => {
            const now = Date.now();
            const idleTime = now - lastActivityAt;

            // 1. Forced Logout Check
            if (idleTime >= FORCED_IDLE_LOGOUT_MS) {
                onLogout();
                return;
            }

            // 2. Session Expiry Check
            if (expiresAt) {
                const expiryTime = new Date(expiresAt).getTime();
                const timeLeftSeconds = Math.floor((expiryTime - now) / 1000);
                setRemainingSeconds(timeLeftSeconds);

                if (timeLeftSeconds <= 0) {
                    onLogout();
                    return;
                } else if (timeLeftSeconds <= WARNING_THRESHOLD) {
                    setIsForcedLogoutWarning(false);
                    setShowWarning(true);
                    return;
                }
            }

            // 3. Forced Warning Check
            if (idleTime >= FORCED_IDLE_WARNING_MS) {
                setIsForcedLogoutWarning(true);
                setShowWarning(true);
            }
        };

        const interval = setInterval(checkStatus, 1000);
        checkStatus();
        return () => clearInterval(interval);
    }, [expiresAt, onLogout, lastActivityAt]);

    let title = "Session Expiring";
    let message = `Your session will expire in ${remainingSeconds ? Math.ceil(remainingSeconds / 60) : 3} minutes. Would you like to stay logged in?`;

    if (isForcedLogoutWarning) {
        title = "Security Cutoff Imminent";
        message = "You have been idle for 55 minutes. For security, you will be signed out in 5 minutes.";
    }

    return (
        <>
            {isRedirecting && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-top duration-300">
                    <div className="bg-white/95 backdrop-blur-md border-b-2 border-primary px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px]">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-bold uppercase tracking-widest text-foreground">
                            Session expired. Redirecting to login...
                        </span>
                    </div>
                </div>
            )}

            <ConfirmationDialog
                isOpen={showWarning && !isRedirecting}
                title={title}
                message={message}
                confirmText={isRefreshing ? "Renewing..." : (isForcedLogoutWarning ? "Stay Active" : "Stay Logged In")}
                cancelText="Sign Out"
                onConfirm={handleStayLoggedIn}
                onCancel={onLogout}
                variant={isForcedLogoutWarning ? "danger" : "warning"}
            />
        </>
    );
}
