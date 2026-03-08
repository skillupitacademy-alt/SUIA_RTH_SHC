'use client';

import { apiClient } from '@quiz/api-client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';
import { useShallow } from 'zustand/react/shallow';

// We keep the Context API for backward compatibility/wrapping, 
// but it delegates to the store.
declare global {
    interface Window {
        __E2E_IS_AUTHENTICATED__?: () => boolean;
    }
}

type AuthState = ReturnType<typeof useAuthStore.getState>;
type AuthUser = NonNullable<AuthState['user']>;

interface AuthContextValue {
    user: AuthState['user'];
    isAuthenticated: boolean;
    loading: boolean;
    login: (user: AuthUser, expiresAt?: string | null) => void;
    logout: (onLogout?: () => void) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, login, logout: storeLogout } = useAuthStore(
        useShallow((s) => ({
            user: s.user,
            isAuthenticated: s.isAuthenticated,
            login: s.login,
            logout: s.logout,
        }))
    );
    const [loading, setLoading] = useState(true);

    const handleLogout = useCallback(async () => {
        try {
            await apiClient.auth.logout();
        } catch (err) {
            clientLogger.error('Server-side logout failed', { error: err instanceof Error ? err.message : 'unknown' });
        } finally {
            storeLogout();
            localStorage.removeItem('quiz-platform-auth');
        }
    }, [storeLogout]);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Re-validate session on mount using the httpOnly cookie
                const session = await apiClient.auth.getSession();
                if (session && session.user) {
                    const normalizedUser: AuthUser = {
                        ...session.user,
                        onboarded: session.user.onboarded ?? false,
                        isAdmin: session.user.isAdmin ?? false,
                    };
                    login(normalizedUser, session.expiresAt);
                } else {
                    // If session returns successfully but without a user, we are logged out
                    handleLogout();
                }
            } catch {
                // If session is invalid, try refresh logic
                try {
                    const refreshResponse = await apiClient.auth.refresh();
                    const session = await apiClient.auth.getSession();
                    if (session && session.user) {
                        const normalizedUser: AuthUser = {
                            ...session.user,
                            onboarded: session.user.onboarded ?? false,
                            isAdmin: session.user.isAdmin ?? false,
                        };
                        login(normalizedUser, session.expiresAt || refreshResponse.expiresAt);
                    } else {
                        handleLogout();
                    }
                } catch {
                    handleLogout();
                }
            } finally {
                setLoading(false);
            }
        };

        const handleUnauthorized = () => {
            handleLogout();
        };

        if (process.env.NODE_ENV !== 'production') {
            window.__E2E_IS_AUTHENTICATED__ = () => {
                return useAuthStore.getState().isAuthenticated;
            };
        }

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        initAuth();

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
            if (process.env.NODE_ENV !== 'production') {
                delete window.__E2E_IS_AUTHENTICATED__;
            }
        };
    }, [handleLogout, login, storeLogout]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout: handleLogout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    // If the provider isn't mounted (e.g., on public pages), return null so callers can render fallbacks.
    return useContext(AuthContext) ?? null;
};
