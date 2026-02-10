"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

const WARNING_THRESHOLD = 180; // 180 seconds (3 minutes)

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

    const handleStayLoggedIn = async () => {
        setIsRefreshing(true);
        try {
            await onRefresh();
            setShowWarning(false);
        } catch (error) {
            onLogout();
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!expiresAt) {
            setShowWarning(false);
            setRemainingSeconds(null);
            return;
        }

        const checkSession = () => {
            const now = Date.now();
            const expiryTime = new Date(expiresAt).getTime();
            const timeLeftSeconds = Math.floor((expiryTime - now) / 1000);

            setRemainingSeconds(timeLeftSeconds);

            if (timeLeftSeconds <= 0) {
                onLogout();
            } else if (timeLeftSeconds <= WARNING_THRESHOLD) {
                setShowWarning(true);
            } else {
                setShowWarning(false);
            }
        };

        const interval = setInterval(checkSession, 30000);
        checkSession();

        return () => clearInterval(interval);
    }, [expiresAt, onLogout]);

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
                title="Session Expiring"
                message={`Your session will expire in ${remainingSeconds ? Math.ceil(remainingSeconds / 60) : 3} minutes. Would you like to stay logged in?`}
                confirmText={isRefreshing ? "Renewing..." : "Stay Logged In"}
                cancelText="Sign Out"
                onConfirm={handleStayLoggedIn}
                onCancel={onLogout}
                variant="warning"
            />
        </>
    );
}
