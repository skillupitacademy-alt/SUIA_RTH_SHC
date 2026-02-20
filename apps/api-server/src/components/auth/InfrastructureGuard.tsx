'use client';

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { logger } from '@/lib/logger';
import { type AuthState, useAuthStore } from '@/store/auth-store';

const log = logger.child({ module: 'client:infrastructure-guard' });

export function InfrastructureGuard({ children }: { children: React.ReactNode }) {
    const { _user, isAuthenticated, initialized, login, logout } = useAuthStore() as AuthState;
    const _router = useRouter();

    useEffect(() => {
        if (initialized === false) return;

        // Strict Check: Only 'infrastructure' role allowed
        if (isAuthenticated === false || (_user?.role as string) !== 'infrastructure') {
            log.warn({ user: _user?.email }, 'Unauthorized role attempt. Redirecting to login.');
            _router.push('/login');
            return;
        }

        // Hardening: Revalidate session state with server
        const revalidate = async () => {
            try {
                const { user: validatedUser, expiresAt } = await apiClient.auth.getAdminSession();
                const isInfra = (validatedUser.role as string) === 'infrastructure';

                if (isInfra === false) throw new Error("REVOKED_ACCESS_PERMIT");

                login(validatedUser, expiresAt);
            } catch (_err: unknown) {
                log.error(
                    { error: _err instanceof Error ? _err.message : 'unknown error' },
                    'Executive handshake failed',
                );
                if (_err instanceof Error && (_err.message.includes('Invalid _token') || _err.message.includes('signature') || _err.message.includes('jwt') || _err.message === "REVOKED_ACCESS_PERMIT")) {
                    logout();
                    _router.push('/login');
                }
            }
        };

        void revalidate();

        const handleUnauthorized = () => {
            log.warn('Circuit Breaker: 401 Detected. Terminating session.');
            logout();
            _router.push('/login');
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [isAuthenticated, _user, initialized, _router, logout, login]);

    if (initialized === false || isAuthenticated === false || (_user?.role as string) !== 'infrastructure') {
        return (
            <div className="h-screen w-screen bg-white flex flex-col items-center justify-center">
                <ZLoader size="xl" text="COMMAND CENTER SYNCHRONIZING_" color="#FF2D55" />
            </div>
        );
    }

    return <>{children}</>;
}
