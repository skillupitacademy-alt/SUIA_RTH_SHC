"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import { SessionWatcher } from './SessionWatcher';
import { useRouter } from 'next/navigation';

export function WebSessionWatcherContainer() {
    const { expiresAt, login, logout, user, isAuthenticated, setSessionExpired } = useAuthStore();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const router = useRouter();

    const handleRefresh = async () => {
        const response = await apiClient.auth.refresh();
        if (response && response.expiresAt && user) {
            login(user, response.expiresAt);
        } else {
            throw new Error("Refresh failed");
        }
    };

    const handleLogout = async () => {
        if (isRedirecting) return;
        setIsRedirecting(true);

        // Terminate session on server
        try {
            await apiClient.auth.logout();
        } catch (err) {
            console.error("Auto-logout server call failed:", err);
        }

        // 1. Clear state IMMEDIATELY so E2E and UI react
        setSessionExpired(true);
        logout();
        localStorage.removeItem('quiz-platform-auth');

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
