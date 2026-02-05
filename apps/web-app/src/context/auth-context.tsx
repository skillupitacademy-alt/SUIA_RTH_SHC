'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';

// We keep the Context API for backward compatibility/wrapping, 
// but it delegates to the store.

const AuthContext = createContext<any>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, login, logout } = useAuthStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Re-validate session on mount using the httpOnly cookie
                const session = await apiClient.auth.getSession();
                if (session && session.user) {
                    login(session.user);
                } else {
                    // If session returns successfully but without a user, we are logged out
                    logout();
                }
            } catch (error) {
                // If session is invalid, try refresh logic
                try {
                    await apiClient.auth.refresh();
                    const session = await apiClient.auth.getSession();
                    if (session && session.user) {
                        login(session.user);
                    } else {
                        logout();
                    }
                } catch (refreshError) {
                    logout();
                }
            } finally {
                setLoading(false);
            }
        };

        const handleUnauthorized = () => {
            logout();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        initAuth();

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, [login, logout]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
