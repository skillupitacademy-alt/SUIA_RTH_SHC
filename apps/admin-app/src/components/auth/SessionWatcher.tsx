"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { ZConfirmationDialog } from '@/components/ui/ZConfirmationDialog';

const WARNING_THRESHOLD = 180; // 180 seconds (3 minutes)

interface SessionWatcherProps {
    expiresAt: string | null;
    onRefresh: () => Promise<void>;
    onLogout: () => void;
}

export function SessionWatcher({ expiresAt, onRefresh, onLogout }: SessionWatcherProps) {
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

        // Polling every 30 seconds as per Senior Engineer spec
        const interval = setInterval(checkSession, 30000);
        checkSession(); // Initial check

        return () => clearInterval(interval);
    }, [expiresAt, onLogout]);

    return (
        <ZConfirmationDialog
            isOpen={showWarning}
            title="Session Expiring"
            description={`Your secure governance session will expire in ${remainingSeconds ? Math.ceil(remainingSeconds / 60) : 3} minutes. Would you like to stay logged in?`}
            confirmText={isRefreshing ? "Renewing..." : "Stay Logged In"}
            cancelText="Sign Out Now"
            onConfirm={handleStayLoggedIn}
            onClose={onLogout}
            variant="warning"
        />
    );
}
