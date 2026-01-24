'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, initialized } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (initialized && (!isAuthenticated || !user?.isAdmin)) {
            router.push('/login');
        }
    }, [isAuthenticated, user, initialized, router]);

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
