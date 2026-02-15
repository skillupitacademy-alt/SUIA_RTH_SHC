'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth-store';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, initialized, login, logout, expiresAt } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

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
                console.error("Session revalidation failed:", err);
                if (err instanceof Error && (err.message.includes('Invalid token') || err.message.includes('signature') || err.message.includes('jwt'))) {
                    console.warn("Detected invalid token, forcing logout...");
                    logout();
                    router.push('/login');
                }
            }
        };

        if (isAuthenticated === true && pathname !== '/login') {
            void revalidate();
        }

        // Circuit Breaker: Listen for global 401 events from FetchClient
        const handleUnauthorized = () => {
            void (async () => {
                console.warn("Circuit Breaker: Global 401 detected. Logging out.");
                try {
                    await apiClient.auth.logout();
                } catch (err) {
                    console.error("Server-side logout failed during unauthorized event:", err);
                } finally {
                    logout();
                    localStorage.removeItem('quiz-platform-admin-auth');
                    router.push('/login?reason=session_expired');
                }
            })();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [isAuthenticated, user, initialized, router, logout, pathname]);

    // SECURITY: Surveillance for session termination
    // If auth state is lost, surgically clear potentially sensitive Factory data
    useEffect(() => {
        if (initialized === true && isAuthenticated === false) {
            console.warn("Security: Session terminated. Purging Question Factory storage.");
            localStorage.removeItem('quiz-factory-storage-v1');
        }
    }, [isAuthenticated, initialized]);

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
