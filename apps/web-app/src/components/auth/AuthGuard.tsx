'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, login } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            setIsChecking(true);
            try {
                // If we already have a user in store, we might be good, but let's verify session if needed
                // For now, simpler optimization: trust store if present, verify if missing
                if (!user) {
                    const session = await apiClient.auth.getSession();
                    // Assuming session returns { user: ... }
                    // We might need an accessToken here if getSession provides it or we rely on cookie
                    // For now, let's assume getSession validates the cookie and returns user
                    if (session && session.user) {
                        login(session.user, ''); // Token might be httpOnly cookie handled
                    } else {
                        throw new Error('No session');
                    }
                }

                // Admin check
                if (requireAdmin && user?.role !== 'admin' && user?.role !== 'super_admin') {
                    router.push('/dashboard');
                    return;
                }

                // Onboarding check
                if (user && !user.onboarded && pathname !== '/onboarding') {
                    router.push('/onboarding');
                    return;
                }

                if (user && user.onboarded && pathname === '/onboarding') {
                    router.push('/dashboard');
                    return;
                }

            } catch {
                if (pathname !== '/login' && pathname !== '/signup') {
                    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
                }
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, [user, router, pathname, login, requireAdmin]);

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
