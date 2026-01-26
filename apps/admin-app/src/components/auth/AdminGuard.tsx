'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, initialized, token } = useAuthStore(); // Unpack token
    const router = useRouter();
    const { logout } = useAuthStore();

    useEffect(() => {
        if (!initialized) return;

        if (!isAuthenticated || !user?.isAdmin) {
            router.push('/login');
            return;
        }

        // Hardening: Revalidate session state with server
        const revalidate = async () => {
            try {
                // Ensure token is set before validation call
                if (token) {
                    apiClient.setAccessToken(token);
                } else {
                    console.warn("AdminGuard: No token available for revalidation");
                    throw new Error("No token");
                }

                const { user: validatedUser } = await apiClient.auth.getSession();
                if (!validatedUser.isAdmin) throw new Error("Revoked");
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


        revalidate();

        // Circuit Breaker: Listen for global 401 events from FetchClient
        const handleUnauthorized = () => {
            console.warn("Circuit Breaker: Global 401 detected. Logging out.");
            logout();
            router.push('/login');
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [isAuthenticated, user, initialized, router, logout, token]);

    // Synchronously ensure token is set before rendering children
    // This allows child components (AdminMetricsGrid) to use apiClient immediately in their effects
    if (token) {
        apiClient.setAccessToken(token);
    }

    if (!initialized || !isAuthenticated || !user?.isAdmin) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-black tracking-widest text-xs uppercase animate-pulse">Authenticating Admin Session...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
