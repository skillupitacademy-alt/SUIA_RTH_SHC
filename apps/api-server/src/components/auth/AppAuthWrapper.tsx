'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { SessionWatcher } from '@/components/auth/SessionWatcher';
import { apiClient } from '@quiz/api-client';

export function AppAuthWrapper({ children }: { children: React.ReactNode }) {
    const { expiresAt, login, logout, initialized } = useAuthStore();

    const handleRefresh = async () => {
        try {
            const { expiresAt: newExpiry } = await apiClient.auth.refresh();
            const { user } = await apiClient.auth.getAdminSession();
            login(user, newExpiry);
        } catch (error) {
            logout();
            throw error;
        }
    };

    if (!initialized) {
        return <div className="invisible">{children}</div>;
    }

    return (
        <>
            {children}
            <SessionWatcher
                expiresAt={expiresAt}
                onRefresh={handleRefresh}
                onLogout={logout}
            />
        </>
    );
}
