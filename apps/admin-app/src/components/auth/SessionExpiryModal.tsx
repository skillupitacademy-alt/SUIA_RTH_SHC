
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { LogOut, ShieldAlert } from 'lucide-react';
import { apiClient } from '@quiz/api-client';

export function SessionExpiryModal() {
    const router = useRouter();
    const pathname = usePathname();
    const { isSessionExpired, setSessionExpired, logout, isLoggingOut } = useAuthStore();

    useEffect(() => {
        const handleUnauthorized = (event: Event) => {
            if (isLoggingOut) return;
            // Prevent auto-redirect logic in FetchClient
            event.preventDefault();
            setSessionExpired(true);
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [setSessionExpired, isLoggingOut]);

    const handleLogin = async () => {
        setSessionExpired(false);
        try {
            await apiClient.auth.logout();
        } catch (err) {
            console.error("Session expiry server-logout failed:", err);
        } finally {
            logout(); // Clear Zustand state
            localStorage.removeItem('quiz-platform-admin-auth'); // Force hard purge
            const redirectUrl = encodeURIComponent(pathname);
            router.push(`/login?redirect=${redirectUrl}&reason=session_expired`);
        }
    };

    // Don't show modal if already on login page or logging out
    if (!isSessionExpired || pathname === '/login' || isLoggingOut) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="p-4 rounded-full bg-red-50 text-red-500">
                        <ShieldAlert size={32} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-black font-outfit uppercase tracking-tight text-[#1A1A1A]">
                            Session Expired
                        </h2>
                        <p className="text-sm font-medium text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                            Your admin session has timed out. Please authenticate again to continue managing the platform.
                        </p>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="w-full py-4 rounded-xl bg-[#1A1A1A] text-white font-bold tracking-widest text-xs uppercase shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} />
                        Return to Console
                    </button>
                </div>
            </div>
        </div>
    );
}
