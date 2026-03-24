'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useShallow } from 'zustand/react/shallow';
import { apiClient } from '@quiz/api-client';
import { useAuthSync } from '@quiz/ui';
import { Loader2 } from 'lucide-react';
import { clientLogger } from '@/utils/clientLogger';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, login, logout, isSessionExpired } = useAuthStore(
        useShallow((s) => ({
            user: s.user,
            isAuthenticated: s.isAuthenticated,
            login: s.login,
            logout: s.logout,
            isSessionExpired: s.isSessionExpired,
        }))
    );
    const [isChecking, setIsChecking] = useState(true);

    // Centralized Auth Sync Hook
    useAuthSync({
        portal: 'user',
        isAuthenticated: isAuthenticated,
        logout: () => {
            logout();
            router.push('/login?reason=session_expired');
        }
    });

    useEffect(() => {
        const checkAuth = async () => {
            clientLogger.warn('[AUTH_FLOW][AUTH_GUARD][START]', {
                step: 'start',
                path: pathname,
                hasUser: user !== null,
                isSessionExpired,
            });

            // CRITICAL: If session is already marked as expired, 
            // don't try to "re-login" from the background.
            if (isSessionExpired) {
                clientLogger.warn('[AUTH_FLOW][AUTH_GUARD][SKIP_SESSION_EXPIRED]', {
                    step: 'skip',
                    path: pathname,
                });
                setIsChecking(false);
                return;
            }

            setIsChecking(true);
            try {
                // If we already have a user in store, we might be good, but let's verify session if needed
                if (!user) {
                    const session = await apiClient.auth.getSession();
                    clientLogger.warn('[AUTH_FLOW][AUTH_GUARD][SESSION_RESPONSE]', {
                        step: 'session_response',
                        path: pathname,
                        hasSessionUser: Boolean(session?.user),
                    });
                    // Assuming session returns { user: ... }
                    if (session && session.user) {
                        login({ ...session.user, onboarded: session.user.onboarded ?? false });
                    } else {
                        throw new Error('No session');
                    }
                }

                // Admin check
                const role = user?.role ?? 'user';
                if (requireAdmin && role !== 'admin' && role !== 'super_admin') {
                    clientLogger.warn('[AUTH_FLOW][AUTH_GUARD][ADMIN_REDIRECT]', {
                        step: 'admin_redirect',
                        path: pathname,
                        role,
                    });
                    router.push('/dashboard');
                    return;
                }

                // Onboarding check
                if (user && !user.onboarded && pathname !== '/onboarding') {
                    clientLogger.warn('[AUTH_FLOW][AUTH_GUARD][ONBOARDING_REDIRECT]', {
                        step: 'onboarding_redirect',
                        path: pathname,
                    });
                    router.push('/onboarding');
                    return;
                }

                if (user && user.onboarded && pathname === '/onboarding') {
                    clientLogger.warn('[AUTH_FLOW][AUTH_GUARD][DASHBOARD_REDIRECT]', {
                        step: 'dashboard_redirect',
                        path: pathname,
                    });
                    router.push('/dashboard');
                    return;
                }

            } catch {
                clientLogger.error('[AUTH_FLOW][AUTH_GUARD][FAILURE]', {
                    step: 'failure',
                    path: pathname,
                });
                logout(); // Clear stale store data on failure
                if (pathname !== '/login' && pathname !== '/signup') {
                    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
                }
            } finally {
                clientLogger.warn('[AUTH_FLOW][AUTH_GUARD][END]', {
                    step: 'end',
                    path: pathname,
                    isCheckingNext: false,
                });
                setIsChecking(false);
            }
        };

        checkAuth();
    }, [user, router, pathname, login, logout, requireAdmin, isSessionExpired]);

    if (isChecking) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Verifying session...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
