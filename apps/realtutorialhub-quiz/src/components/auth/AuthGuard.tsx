'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useShallow } from 'zustand/react/shallow';
import { useAuthSync } from '@quiz/ui';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuthStore(
        useShallow((s) => ({
            user: s.user,
            isAuthenticated: s.isAuthenticated,
            logout: s.logout,
        }))
    );

    // Centralized Auth Sync Hook
    useAuthSync({
        portal: 'user',
        isAuthenticated,
        logout: () => {
            logout();
            router.push('/login?reason=session_expired');
        }
    });

    useEffect(() => {
        if (!user) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        // Admin check
        const role = user.role ?? 'user';
        if (requireAdmin && role !== 'admin' && role !== 'super_admin') {
            router.push('/dashboard');
            return;
        }

        // Onboarding check
        if (!user.onboarded && pathname !== '/onboarding') {
            router.push('/onboarding');
            return;
        }

        if (user.onboarded && pathname === '/onboarding') {
            router.push('/dashboard');
        }
    }, [user, router, pathname, requireAdmin]);

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
