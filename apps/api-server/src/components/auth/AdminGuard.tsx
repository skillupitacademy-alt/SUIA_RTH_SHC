'use client';

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore } from '@/store/auth-store';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, initialized, login, logout } = useAuthStore(
        useShallow((s) => ({
            isAuthenticated: s.isAuthenticated,
            initialized: s.initialized,
            login: s.login,
            logout: s.logout,
        }))
    );
    const _user = useAuthStore((s) => s._user);
    const _router = useRouter();

    useEffect(() => {
        if (initialized === false) return;

        if (isAuthenticated === false || _user?.isAdmin !== true) {
            _router.push('/login');
            return;
        }

        // Hardening: Revalidate session state with server
        const revalidate = async () => {
            try {
                const { user: validatedUser, expiresAt } = await apiClient.auth.getAdminSession();
                const isAdmin = validatedUser.isAdmin === true;
                if (isAdmin === false) throw new Error("Revoked");
                login(validatedUser, expiresAt);
            } catch (_err: unknown) {
                console.error(
                    { error: _err instanceof Error ? _err.message : 'unknown error' },
                    '[AdminGuard] Session revalidation failed',
                );
                if (_err instanceof Error && (_err.message.includes('Invalid _token') || _err.message.includes('signature') || _err.message.includes('jwt'))) {
                    logout();
                    _router.push('/login');
                }
            }
        };

        void revalidate();

        const handleUnauthorized = () => {
            console.warn('[AdminGuard] Circuit breaker: global 401 detected. Logging out.');
            logout();
            _router.push('/login');
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [isAuthenticated, _user, initialized, _router, logout, login]);

    if (initialized === false || isAuthenticated === false || _user?.isAdmin !== true) {
        return (
            <div className="h-screen w-screen bg-white flex flex-col items-center justify-center">
                <ZLoader size="lg" text="Authenticating API Terminal_" color="#FF2D55" />
            </div>
        );
    }

    return <>{children}</>;
}
