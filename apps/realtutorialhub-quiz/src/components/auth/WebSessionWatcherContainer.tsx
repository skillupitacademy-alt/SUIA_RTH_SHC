"use client";

import { apiClient } from '@quiz/api-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { useShallow } from 'zustand/react/shallow';
import { clientLogger } from '@/utils/clientLogger';

import { SessionWatcher } from './SessionWatcher';

export function WebSessionWatcherContainer() {
    const { expiresAt, login, logout, user, isAuthenticated, setSessionExpired } = useAuthStore(
        useShallow((s) => ({
            expiresAt: s.expiresAt,
            login: s.login,
            logout: s.logout,
            user: s.user,
            isAuthenticated: s.isAuthenticated,
            setSessionExpired: s.setSessionExpired,
        }))
    );
    const [isRedirecting, setIsRedirecting] = useState(false);
    const router = useRouter();

    const handleRefresh = async () => {
        try {
            const response = await apiClient.auth.refresh();
            if (response && response.expiresAt && user) {
                login(user, response.expiresAt);
            } else {
                throw new Error("Refresh failed");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Refresh failed";
            clientLogger.error('Session refresh failed', { error: message });
            // Bubble up so SessionWatcher can trigger logout flow
            throw err;
        }
    };

    const handleLogout = async () => {
        if (isRedirecting) return;
        setIsRedirecting(true);

        // Terminate session on server
        try {
            await apiClient.auth.logout();
        } catch (err) {
            clientLogger.error('Auto-logout server call failed', { error: err instanceof Error ? err.message : 'unknown' });
        }

        // 1. Clear state IMMEDIATELY so E2E and UI react
        setSessionExpired(true);
        logout();

        // 2. Brief delay to allow the user to see the notice/toast before redirection
        setTimeout(() => {
            router.push('/login?reason=session_expired');
            setIsRedirecting(false);
        }, 2000);
    };

    if (!isAuthenticated) return null;

    return (
        <SessionWatcher
            expiresAt={expiresAt}
            onRefresh={handleRefresh}
            onLogout={handleLogout}
            isRedirecting={isRedirecting}
        />
    );
}
