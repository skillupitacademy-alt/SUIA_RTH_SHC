
'use client';

import { apiClient } from '@quiz/api-client';
import { LogOut, ShieldAlert } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';

export function SessionExpiryModal() {
    const router = useRouter();
    const pathname = usePathname();
    const { isSessionExpired, isAccessDenied, setSessionExpired, setAccessDenied, logout, isLoggingOut } = useAuthStore(
        useShallow((s) => ({
            isSessionExpired: s.isSessionExpired,
            isAccessDenied: s.isAccessDenied,
            setSessionExpired: s.setSessionExpired,
            setAccessDenied: s.setAccessDenied,
            logout: s.logout,
            isLoggingOut: s.isLoggingOut,
        }))
    );

    useEffect(() => {
        const handleUnauthorized = (event: Event) => {
            if (isLoggingOut === true) return;
            // Prevent auto-redirect logic in FetchClient
            event.preventDefault();
            setAccessDenied(false);
            setSessionExpired(true);
        };

        const handleForbidden = (event: Event) => {
            if (isLoggingOut === true) return;
            event.preventDefault();
            setSessionExpired(false);
            setAccessDenied(true);
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        window.addEventListener('auth:forbidden', handleForbidden);
        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
            window.removeEventListener('auth:forbidden', handleForbidden);
        };
    }, [setAccessDenied, setSessionExpired, isLoggingOut]);

    const handleLogin = async () => {
        setSessionExpired(false);
        setAccessDenied(false);
        try {
            clientLogger.warn('[AUTH_FLOW][ADMIN_SESSION_MODAL][RETURN_TO_LOGIN]', {
                step: isAccessDenied ? 'return_to_login_access_denied' : 'return_to_login_session_expired',
                path: pathname,
            });
            await apiClient.auth.logout();
        } catch (err) {
            clientLogger.error("Session expiry server-logout failed", { error: err instanceof Error ? err.message : 'unknown' });
        } finally {
            logout(); // Clear Zustand state
            localStorage.removeItem('quiz-platform-admin-auth'); // Force hard purge
            const redirectUrl = encodeURIComponent('/');
            clientLogger.warn('[AUTH_FLOW][ADMIN_SESSION_MODAL][REDIRECT]', {
                step: 'redirect',
                safeRedirect: '/',
                rawRedirect: redirectUrl,
            });
            router.push(`/login?redirect=${redirectUrl}&reason=${isAccessDenied ? 'access_denied' : 'session_expired'}`);
        }
    };

    // Don't show modal if already on login page or logging out
    if ((isSessionExpired === false && isAccessDenied === false) || pathname === '/login' || isLoggingOut === true) return null;

    const isForbidden = isAccessDenied === true;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className={`p-4 rounded-full ${isForbidden ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'}`}>
                        <ShieldAlert size={32} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-black font-outfit uppercase tracking-tight text-[#1A1A1A]">
                            {isForbidden ? 'Access Denied' : 'Session Expired'}
                        </h2>
                        <p className="text-sm font-medium text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                            {isForbidden
                                ? 'This account is not permitted for the current portal. Please sign in with an authorized account.'
                                : 'Your admin session has timed out. Please authenticate again to continue managing the platform.'}
                        </p>
                    </div>

                    <button
                        onClick={() => { void handleLogin(); }}
                        className="w-full py-4 rounded-xl bg-[#1A1A1A] text-white font-bold tracking-widest text-xs uppercase shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} />
                        {isForbidden ? 'Return to Login' : 'Return to Console'}
                    </button>
                </div>
            </div>
        </div>
    );
}
