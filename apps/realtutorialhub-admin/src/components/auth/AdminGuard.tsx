import { apiClient } from '@quiz/api-client';
import { useAuthSync,ZLoader } from '@quiz/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback,useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';

const normalizeRole = (value: string | null | undefined) => (typeof value === 'string' ? value.toLowerCase() : '');

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, initialized, login, logout, expiresAt, isLocked, setAccessDenied } = useAuthStore(
        useShallow((s) => ({
            user: s.user,
            isAuthenticated: s.isAuthenticated,
            initialized: s.initialized,
            login: s.login,
            logout: s.logout,
            expiresAt: s.expiresAt,
            isLocked: s.isLocked,
            setAccessDenied: s.setAccessDenied,
        }))
    );
    const router = useRouter();
    const pathname = usePathname();

    const isSameAuthSession = useCallback(
        (currentUser: typeof user, nextUser: typeof user) => {
            if (currentUser === null || currentUser === undefined || nextUser === null || nextUser === undefined) {
                return false;
            }

            return (
                currentUser.id === nextUser.id &&
                currentUser.email === nextUser.email &&
                normalizeRole(currentUser.role) === normalizeRole(nextUser.role) &&
                Boolean(currentUser.isAdmin) === Boolean(nextUser.isAdmin)
            );
        },
        [],
    );

    // Circuit Breaker: Custom handler for Admin
    const handleUnauthorized = useCallback((e: Event) => {
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
    }, [isLocked, logout, router]);

    const handleForbidden = useCallback((e: Event) => {
        e.preventDefault();
        setAccessDenied(true);
    }, [setAccessDenied]);

    // Centralized Auth Sync Hook
    useAuthSync({
        portal: 'admin',
        isAuthenticated,
        isLocked,
        logout,
        onUnauthorized: handleUnauthorized,
        onForbidden: handleForbidden,
    });

    useEffect(() => {
        if (initialized === false) return;

        const hasAdminRole = user?.role === 'admin' || user?.role === 'super_admin';

        if (isAuthenticated === false && pathname !== '/login') {
            router.push('/login?reason=session_expired');
            return;
        }

        if (hasAdminRole === false && pathname !== '/login') {
            router.push('/login?reason=access_denied');
            return;
        }

        // Hardening: Revalidate session state with server
        const revalidate = async () => {
            try {
                const { user: validatedUser, expiresAt: validatedExpiresAt } = await apiClient.auth.getAdminSession();
                const validatedHasAdminRole = validatedUser?.role === 'admin' || validatedUser?.role === 'super_admin';
                if (validatedUser === null || validatedUser === undefined || validatedHasAdminRole === false) throw new Error("Revoked");

                // Only update if the stable session fields actually changed.
                // The admin /me response intentionally omits some login-only fields, so
                // comparing the full object creates a render loop when the session is valid.
                if (isSameAuthSession(user, validatedUser) === false) {
                    login(validatedUser, validatedExpiresAt);
                }
            } catch (err: unknown) {
                clientLogger.error("Session revalidation failed", { error: err instanceof Error ? err.message : 'unknown' });
                if (err instanceof Error && (err.message.includes('Invalid token') || err.message.includes('signature') || err.message.includes('jwt'))) {
                    clientLogger.warn("Detected invalid token, forcing logout...");
                    logout();
                    router.push('/login?reason=session_expired');
                }
            }
        };

        if (isAuthenticated === true && pathname !== '/login') {
            // Optimization: Don't revalidate while locked to avoid background 401 race conditions
            if (isLocked === false) {
                void revalidate();
            }
        }
    }, [expiresAt, initialized, isAuthenticated, isLocked, isSameAuthSession, login, logout, pathname, router, user]);


    // Bypass guard for login page
    if (pathname === '/login') {
        return <>{children}</>;
    }

    const hasAdminRole = user?.role === 'admin' || user?.role === 'super_admin';

    if (initialized === false || isAuthenticated === false || hasAdminRole === false) {
        return (
            <div className="h-screen w-screen bg-background flex flex-col items-center justify-center">
                <ZLoader size="lg" text="Authenticating Admin Session" />
            </div>
        );
    }

    return <>{children}</>;
}
