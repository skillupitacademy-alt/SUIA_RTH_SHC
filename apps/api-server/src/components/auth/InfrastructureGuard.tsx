'use client';

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

import { logger } from '@/lib/logger';
import { type AuthState, useAuthStore } from '@/store/auth-store';

import { InfrastructureLockScreen } from './InfrastructureLockScreen';
import { SessionWatcher } from './SessionWatcher';

const log = logger.child({ module: 'client:infrastructure-guard' });

export function InfrastructureGuard({ children }: { children: React.ReactNode }) {
    const { _user, isAuthenticated, initialized, expiresAt, isLocked, isLoggingOut, login, logout, setIsLoggingOut } = useAuthStore() as AuthState;
    const _router = useRouter();

    // 1. Establish Portal Identity Hint globally for this portal
    useEffect(() => {
        apiClient.client.setPortalIdentity('infrastructure');
    }, []);

    const handleLogout = useCallback(async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await apiClient.auth.logout();
        } catch {
            // silent fail
        } finally {
            logout();
            _router.push('/login');
            setIsLoggingOut(false);
        }
    }, [isLoggingOut, logout, _router, setIsLoggingOut]);

    const handleRefresh = useCallback(async () => {
        try {
            const { user: refreshedUser, expiresAt: newExpiry } = await apiClient.auth.getAdminSession();
            login(refreshedUser, newExpiry);
        } catch {
            await handleLogout();
        }
    }, [handleLogout, login]);

    useEffect(() => {
        if (initialized === false || isLoggingOut === true) return;

        // Strict Check: Only 'infrastructure' role allowed
        if (isAuthenticated === false || (_user?.role as string) !== 'infrastructure') {
            log.warn({ user: _user?.email }, 'Unauthorized role attempt. Redirecting to login.');
            void _router.push('/login');
            return;
        }

        // Hardening: Revalidate session state with server
        const revalidate = async () => {
            try {
                // Hint already set in global apiClient.client
                const { user: validatedUser, expiresAt: refreshedExpiresAt } = await apiClient.auth.getAdminSession();
                const isInfra = (validatedUser.role as string) === 'infrastructure';

                if (isInfra === false) throw new Error("REVOKED_ACCESS_PERMIT");

                login(validatedUser, refreshedExpiresAt);
            } catch (_err: unknown) {
                log.error(
                    { error: _err instanceof Error ? _err.message : 'unknown error' },
                    'Executive handshake failed',
                );
                const msg = _err instanceof Error ? _err.message : '';
                if (msg.includes('Invalid _token') || msg.includes('signature') || msg.includes('jwt') || msg === "REVOKED_ACCESS_PERMIT" || msg.includes('Unauthorized')) {
                    await handleLogout();
                }
            }
        };

        void revalidate();

        const handleUnauthorized = () => {
            log.warn('Circuit Breaker: 401 Detected. Terminating session.');
            void handleLogout();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [handleLogout, isAuthenticated, _user, initialized, _router, login, isLoggingOut]);

    if (initialized === false || (isAuthenticated === false && !isLoggingOut) || (_user?.role as string) !== 'infrastructure') {
        return (
            <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center">
                <ZLoader size="xl" text="COMMAND CENTER SYNCHRONIZING_" color="#FF4B91" />
            </div>
        );
    }

    return (
        <>
            <SessionWatcher
                expiresAt={expiresAt}
                onRefresh={handleRefresh}
                onLogout={() => handleLogout()}
                isRedirecting={isLoggingOut}
            />
            <InfrastructureLockScreen />
            <div className={isLocked ? 'blur-2xl pointer-events-none transition-all duration-700' : 'transition-all duration-700'}>
                {children}
            </div>
        </>
    );
}
