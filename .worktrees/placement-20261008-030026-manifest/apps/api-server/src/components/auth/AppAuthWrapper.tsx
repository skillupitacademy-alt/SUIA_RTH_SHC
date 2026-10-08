"use client";

import { apiClient } from '@quiz/api-client';
import { ApiRequestError } from '@quiz/api-client/core/fetch-client';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { SessionWatcher } from '@/components/auth/SessionWatcher';
import { useAuthStore } from '@/store/auth-store';

export function AppAuthWrapper({ children }: { children: React.ReactNode }) {
    const { expiresAt, login, logout, initialized, isAuthenticated } = useAuthStore(
        useShallow((s) => ({
            expiresAt: s.expiresAt,
            login: s.login,
            logout: s.logout,
            initialized: s.initialized,
            isAuthenticated: s.isAuthenticated,
        }))
    );
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleRefresh = async () => {
        try {
            const { expiresAt: newExpiry } = await apiClient.auth.refresh();
            const { user: validatedUser } = await apiClient.auth.getAdminSession();
            login(validatedUser, newExpiry);
        } catch (error) {
            if (error instanceof ApiRequestError && error.status === 403) {
                logout();
                window.location.href = '/login?reason=access_denied';
                return;
            }
            void handleLogout();
            throw error;
        }
    };

    const handleLogout = async () => {
        if (isRedirecting) return;
        setIsRedirecting(true);

        return new Promise<void>((resolve) => {
            setTimeout(() => {
                logout();
                window.location.href = '/login?reason=session_expired';
                setIsRedirecting(false);
                resolve();
            }, 3000);
        });
    };

    if (!initialized) return null;

    const shouldWatchSession = isAuthenticated && typeof expiresAt === 'string' && expiresAt.length > 0;
    const sessionWatcher = shouldWatchSession ? (
        <SessionWatcher
            expiresAt={expiresAt}
            onRefresh={() => { void handleRefresh(); }}
            onLogout={() => { void handleLogout(); }}
            isRedirecting={isRedirecting}
        />
    ) : null;

    return (
        <>
            {children}
            {sessionWatcher}
        </>
    );
}
