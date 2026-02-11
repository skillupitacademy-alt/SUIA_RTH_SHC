'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, initialized, login, logout } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!initialized) return;

        if (!isAuthenticated || !user?.isAdmin) {
            router.push('/login');
            return;
        }

        // Hardening: Revalidate session state with server
        const revalidate = async () => {
            try {
                // Access token is handled via httpOnly cookies
                // Using getAdminSession parity
                const { user: validatedUser, expiresAt } = await apiClient.auth.getAdminSession();
                if (!validatedUser.isAdmin) throw new Error("Revoked");
                login(validatedUser, expiresAt);
            } catch (err: any) {
                console.error("Session revalidation failed:", err);
                if (err.message.includes('Invalid token') || err.message.includes('signature') || err.message.includes('jwt')) {
                    logout();
                    router.push('/login');
                }
            }
        };

        revalidate();

        const handleUnauthorized = () => {
            console.warn("Circuit Breaker: Global 401 detected. Logging out.");
            logout();
            router.push('/login');
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [isAuthenticated, user, initialized, router, logout, login]);

    if (!initialized || !isAuthenticated || !user?.isAdmin) {
        return (
            <div className="h-screen w-screen bg-white flex flex-col items-center justify-center">
                <ZLoader size="lg" text="Authenticating API Terminal_" color="#FF2D55" />
            </div>
        );
    }

    return <>{children}</>;
}
