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
            } catch (err) {
                console.error("Session revalidation failed:", err);
                logout();
                router.push('/login');
            }
        };

        revalidate();

    }, [isAuthenticated, user, initialized, router, logout, token]);

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
