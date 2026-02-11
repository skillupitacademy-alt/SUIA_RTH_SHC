'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, initialized, login, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!initialized) return;

        if ((!isAuthenticated || !user?.isAdmin) && pathname !== '/login') {
            router.push('/login');
            return;
        }

        // Hardening: Revalidate session state with server
        const revalidate = async () => {
            try {
                // Access token is now handled via httpOnly cookies automatically
                // Strictly use Admin Session endpoint
                const { user: validatedUser, expiresAt } = await apiClient.auth.getAdminSession();
                if (!validatedUser.isAdmin) throw new Error("Revoked");
                login(validatedUser, expiresAt);
            } catch (err: any) {
                console.error("Session revalidation failed:", err);
                // Auto-heal on invalid token signature
                if (err.message.includes('Invalid token') || err.message.includes('signature') || err.message.includes('jwt')) {
                    console.warn("Detected invalid token, forcing logout...");
                    logout();
                    router.push('/login');
                }
            }
        };

        if (isAuthenticated && pathname !== '/login') {
            revalidate();
        }

        // Circuit Breaker: Listen for global 401 events from FetchClient
        const handleUnauthorized = async () => {
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
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [isAuthenticated, user, initialized, router, logout, pathname]);

    // SECURITY: Surveillance for session termination
    // If auth state is lost, surgically clear potentially sensitive Factory data
    useEffect(() => {
        if (initialized && !isAuthenticated) {
            console.warn("Security: Session terminated. Purging Question Factory storage.");
            localStorage.removeItem('quiz-factory-storage-v1');
        }
    }, [isAuthenticated, initialized]);

    // Bypass guard for login page
    if (pathname === '/login') {
        return <>{children}</>;
    }

    if (!initialized || !isAuthenticated || !user?.isAdmin) {
        return (
            <div className="h-screen w-screen bg-background flex flex-col items-center justify-center">
                <ZLoader size="lg" text="Authenticating Admin Session" />
            </div>
        );
    }

    return <>{children}</>;
}
