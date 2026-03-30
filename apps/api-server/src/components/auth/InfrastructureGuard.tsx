'use client';

import { apiClient } from '@quiz/api-client';
import { ApiRequestError } from '@quiz/api-client/core/fetch-client';
import { ZLoader } from '@quiz/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { type AuthState, useAuthStore } from '@/store/auth-store';

import { InfrastructureLockScreen } from './InfrastructureLockScreen';
import { SessionWatcher } from './SessionWatcher';

export function InfrastructureGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, initialized, expiresAt, isLocked, isLoggingOut, login, logout, setIsLoggingOut } = useAuthStore(
        useShallow((s: AuthState) => ({
            isAuthenticated: s.isAuthenticated,
            initialized: s.initialized,
            expiresAt: s.expiresAt,
            isLocked: s.isLocked,
            isLoggingOut: s.isLoggingOut,
            login: s.login,
            logout: s.logout,
            setIsLoggingOut: s.setIsLoggingOut,
        }))
    );
    const _user = useAuthStore((s) => s._user);
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
            _router.push('/login?reason=session_expired');
            setIsLoggingOut(false);
        }
    }, [isLoggingOut, logout, _router, setIsLoggingOut]);

    const handleRefresh = useCallback(async () => {
        try {
            const { user: refreshedUser, expiresAt: newExpiry } = await apiClient.auth.getAdminSession();
            login(refreshedUser, newExpiry);
        } catch (error) {
            if (error instanceof ApiRequestError && error.status === 403) {
                logout();
                _router.push('/login?reason=access_denied');
                return;
            }
            await handleLogout();
        }
    }, [handleLogout, login, logout, _router]);

    useEffect(() => {
        if (initialized === false || isLoggingOut === true) return;

        // Strict Check: Only 'infrastructure' role allowed
        const userRole = _user?.role ?? null;
        if (isAuthenticated === false) {
            console.warn('[InfrastructureGuard] No active session. Redirecting to login.');
            void _router.push('/login?reason=session_expired');
            return;
        }
        if (userRole !== 'infrastructure') {
            console.warn('[InfrastructureGuard] Unauthorized role attempt. Redirecting to login.', { user: _user?.email });
            void _router.push('/login?reason=access_denied');
            return;
        }

        // Hardening: Revalidate session state with server
        const revalidate = async () => {
            try {
                // Hint already set in global apiClient.client
                const { user: validatedUser, expiresAt: refreshedExpiresAt } = await apiClient.auth.getAdminSession();
                const isInfra = validatedUser.role === 'infrastructure';

                if (isInfra === false) throw new Error("REVOKED_ACCESS_PERMIT");

                login(validatedUser, refreshedExpiresAt);
            } catch (_err: unknown) {
                console.error(
                    { error: _err instanceof Error ? _err.message : 'unknown error' },
                    '[InfrastructureGuard] Executive handshake failed',
                );
                if (_err instanceof ApiRequestError && _err.status === 403) {
                    logout();
                    _router.push('/login?reason=access_denied');
                    return;
                }
                const msg = _err instanceof Error ? _err.message : '';
                if (msg.includes('Invalid _token') || msg.includes('signature') || msg.includes('jwt') || msg === "REVOKED_ACCESS_PERMIT" || msg.includes('Unauthorized')) {
                    await handleLogout();
                }
            }
        };

        void revalidate();

        const handleUnauthorized = () => {
            console.warn('[InfrastructureGuard] Circuit breaker: 401 detected. Terminating session.');
            void handleLogout();
        };

        const handleForbidden = () => {
            console.warn('[InfrastructureGuard] Circuit breaker: 403 detected. Access denied.');
            logout();
            _router.push('/login?reason=access_denied');
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        window.addEventListener('auth:forbidden', handleForbidden);
        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
            window.removeEventListener('auth:forbidden', handleForbidden);
        };
    }, [handleLogout, isAuthenticated, _user, initialized, _router, login, logout, isLoggingOut]);

    const currentRole = _user?.role ?? null;
    if (initialized === false || (isAuthenticated === false && !isLoggingOut) || currentRole !== 'infrastructure') {
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
