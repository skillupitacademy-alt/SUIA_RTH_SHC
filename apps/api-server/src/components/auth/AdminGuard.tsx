'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type AuthState } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { _user, isAuthenticated, initialized, login, logout } = useAuthStore() as AuthState;
    const _router = useRouter();

    useEffect(() => {
        if (!initialized) return;

        if (isAuthenticated === false || _user?.isAdmin !== true) {
            _router.push('/login');
            return;
        }

        // Hardening: Revalidate session state with server
        const revalidate = async () => {
            try {
                // Access _token is handled via httpOnly cookies
                // Using getAdminSession parity
                const { user: validatedUser, expiresAt } = await apiClient.auth.getAdminSession();
                const isAdmin = (validatedUser as { isAdmin?: boolean }).isAdmin === true;
                if (!isAdmin) throw new Error("Revoked");
                login(validatedUser, expiresAt);
            } catch (_err: unknown) {
                console.error("Session revalidation failed:", _err);
                if (_err instanceof Error && (_err.message.includes('Invalid _token') || _err.message.includes('signature') || _err.message.includes('jwt'))) {
                    logout();
                    _router.push('/login');
                }
            }
        };

        void revalidate();

        const handleUnauthorized = () => {
            console.warn("Circuit Breaker: Global 401 detected. Logging out.");
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
