"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import { ZConfirmationDialog } from '@/components/ui/ZConfirmationDialog';

const WARNING_THRESHOLD = 3 * 60 * 1000; // 3 minutes before expiration

export function SessionWatcher() {
    const { expiresAt, isAuthenticated, logout, login, user } = useAuthStore();
    const [showWarning, setShowWarning] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const lastCheckRef = useRef<number>(0);

    const handleLogout = useCallback(() => {
        setShowWarning(false);
        logout();
        window.location.href = '/login?reason=session_expired';
    }, [logout]);

    const handleStayLoggedIn = async () => {
        setIsRefreshing(true);
        try {
            const response = await apiClient.auth.refresh();
            if (response && response.expiresAt && user) {
                login(user, response.expiresAt);
                setShowWarning(false);
            } else {
                handleLogout();
            }
        } catch (error) {
            handleLogout();
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || !expiresAt) {
            setShowWarning(false);
            return;
        }

        const checkSession = () => {
            const now = Date.now();
            // Throttle checks to once every 5 seconds
            if (now - lastCheckRef.current < 5000) return;
            lastCheckRef.current = now;

            const expiryTime = new Date(expiresAt).getTime();
            const timeLeft = expiryTime - now;

            if (timeLeft <= 0) {
                handleLogout();
            } else if (timeLeft <= WARNING_THRESHOLD && !showWarning) {
                setShowWarning(true);
            }
        };

        const interval = setInterval(checkSession, 5000);
        checkSession();

        return () => clearInterval(interval);
    }, [expiresAt, isAuthenticated, showWarning, handleLogout]);

    return (
        <ZConfirmationDialog
            isOpen={showWarning}
            title="Session Expiring"
            description="Your secure governance session is about to expire. For security reasons, you will be logged out automatically. Would you like to stay logged in?"
            confirmText={isRefreshing ? "Renewing..." : "Stay Logged In"}
            cancelText="Sign Out Now"
            onConfirm={handleStayLoggedIn}
            onClose={handleLogout}
            variant="warning"
        />
    );
}
