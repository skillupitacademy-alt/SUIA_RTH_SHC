'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, initialized, login, logout, expiresAt, isLocked } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // 1. Establish Portal Identity Hint
        apiClient.client.setPortalIdentity('admin');
    }, []);

    useEffect(() => {
        if (initialized === false) return;

        if ((isAuthenticated === false || user?.isAdmin !== true) && pathname !== '/login') {
            router.push('/login');
            return;
        }

        // Hardening: Revalidate session state with server
        const revalidate = async () => {
            try {
                const { user: validatedUser, expiresAt: validatedExpiresAt } = await apiClient.auth.getAdminSession();
                if (validatedUser === null || validatedUser === undefined || (validatedUser as { isAdmin?: boolean }).isAdmin !== true) throw new Error("Revoked");

                // Only update if something actually changed to avoid unnecessary re-renders/loop
                if (JSON.stringify(validatedUser) !== JSON.stringify(user) || validatedExpiresAt !== expiresAt) {
                    login(validatedUser, validatedExpiresAt);
                }
            } catch (err: unknown) {
                clientLogger.error("Session revalidation failed", { error: err instanceof Error ? err.message : 'unknown' });
                if (err instanceof Error && (err.message.includes('Invalid token') || err.message.includes('signature') || err.message.includes('jwt'))) {
                    clientLogger.warn("Detected invalid token, forcing logout...");
                    logout();
                    router.push('/login');
                }
            }
        };

        if (isAuthenticated === true && pathname !== '/login') {
            // Optimization: Don't revalidate while locked to avoid background 401 race conditions
            if (isLocked === false) {
                void revalidate();
            }
        }

        // Circuit Breaker: Listen for global 401 events from FetchClient
        const handleUnauthorized = (e: Event) => {
            // PATIENCE PROTOCOL: If the terminal is locked, the user is still at their desk (or pause-mode)
            // We should NOT trigger a hard logout/redirect in the background.
            // The AdminLockScreen will handle re-authentication when the user attempts to unlock.
            if (isLocked === true) {
                clientLogger.warn("Circuit Breaker: 401 detected while LOCKED. Deferring to Lock Protocol.");
                e.preventDefault(); // Tells FetchClient NOT to perform hard window.location redirect
                return;
            }

            void (async () => {
                clientLogger.warn("Circuit Breaker: Global 401 detected. Logging out.");
                try {
                    await apiClient.auth.logout();
                } catch (err) {
                    clientLogger.error("Server-side logout failed during unauthorized event", { error: err instanceof Error ? err.message : 'unknown' });
                } finally {
                    logout();
                    if (typeof window !== 'undefined') {
                        window.localStorage.removeItem('quiz-platform-admin-auth');
                    }
                    router.push('/login?reason=session_expired');
                }
            })();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [isAuthenticated, user, initialized, router, logout, pathname, isLocked]);


    // Bypass guard for login page
    if (pathname === '/login') {
        return <>{children}</>;
    }

    if (initialized === false || isAuthenticated === false || user?.isAdmin !== true) {
        return (
            <div className="h-screen w-screen bg-background flex flex-col items-center justify-center">
                <ZLoader size="lg" text="Authenticating Admin Session" />
            </div>
        );
    }

    return <>{children}</>;
}
