"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { SessionWatcher } from '@/components/auth/SessionWatcher';
import { apiClient } from '@quiz/api-client';
import { useRouter } from 'next/navigation';

export function AppAuthWrapper({ children }: { children: React.ReactNode }) {
    const { expiresAt, login, logout, initialized } = useAuthStore();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const _router = useRouter();

    const handleRefresh = async () => {
        try {
            const { expiresAt: newExpiry } = await apiClient.auth.refresh();
            const { user: validatedUser } = await apiClient.auth.getAdminSession();
            login(validatedUser, newExpiry);
        } catch (_error) {
            handleLogout();
            throw _error;
        }
    };

    const handleLogout = () => {
        if (isRedirecting) return;
        setIsRedirecting(true);

        setTimeout(() => {
            logout();
            window.location.href = '/login?reason=session_expired';
            setIsRedirecting(false);
        }, 3000);
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
                onLogout={handleLogout}
                isRedirecting={isRedirecting}
            />
        </>
    );
}
