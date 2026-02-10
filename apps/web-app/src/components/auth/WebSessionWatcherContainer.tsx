"use client";

import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import { SessionWatcher } from './SessionWatcher';
import { useRouter } from 'next/navigation';

export function WebSessionWatcherContainer() {
    const { expiresAt, login, logout, user, isAuthenticated } = useAuthStore();
    const router = useRouter();

    const handleRefresh = async () => {
        const response = await apiClient.auth.refresh();
        if (response && response.expiresAt && user) {
            login(user, response.expiresAt);
        } else {
            throw new Error("Refresh failed");
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login?reason=session_expired');
    };

    if (!isAuthenticated) return null;

    return (
        <SessionWatcher
            expiresAt={expiresAt}
            onRefresh={handleRefresh}
            onLogout={handleLogout}
        />
    );
}
