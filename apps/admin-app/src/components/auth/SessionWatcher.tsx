"use client";

import { useEffect, useState } from 'react';
import { ZConfirmationDialog } from '@/components/ui/ZConfirmationDialog';

const WARNING_THRESHOLD = 180; // 180 seconds (3 minutes)

interface SessionWatcherProps {
    expiresAt: string | null;
    onRefresh: () => Promise<void>;
    onLogout: () => void;
    isRedirecting?: boolean;
    redirectMessage?: string;
}

export function SessionWatcher({ expiresAt, onRefresh, onLogout, isRedirecting, redirectMessage }: SessionWatcherProps) {
    const [showWarning, setShowWarning] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    const handleStayLoggedIn = async () => {
        setIsRefreshing(true);
        try {
            await onRefresh();
            setShowWarning(false);
        } catch {
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

        // Polling every 30 seconds as per Senior Engineer spec
        const interval = setInterval(checkSession, 30000);
        checkSession(); // Initial check

        return () => clearInterval(interval);
    }, [expiresAt, onLogout]);

    // If a redirect is already underway, suppress the warning modal to avoid flicker.
    useEffect(() => {
        if (isRedirecting) {
            setShowWarning(false);
        }
    }, [isRedirecting]);

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
                isOpen={showWarning && !isRedirecting}
                title="Session Expiring"
                description={`Your secure governance session will expire in ${remainingSeconds ? Math.ceil(remainingSeconds / 60) : 3} minutes. Would you like to stay logged in?`}
                confirmText={isRefreshing ? "Renewing..." : "Stay Logged In"}
                cancelText="Sign Out Now"
                onConfirm={handleStayLoggedIn}
                onClose={onLogout}
                variant="warning"
            />
        </>
    );
}
