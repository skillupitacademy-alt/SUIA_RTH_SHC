'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';

// We keep the Context API for backward compatibility/wrapping, 
// but it delegates to the store.

const AuthContext = createContext<any>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, login, logout: storeLogout } = useAuthStore();
    const [loading, setLoading] = useState(true);

    const handleLogout = async () => {
        try {
            await apiClient.auth.logout();
        } catch (err) {
            console.error("Server-side logout failed:", err);
        } finally {
            storeLogout();
            localStorage.removeItem('quiz-platform-auth');
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Re-validate session on mount using the httpOnly cookie
                const session = await apiClient.auth.getSession();
                if (session && session.user) {
                    login(session.user, session.expiresAt);
                } else {
                    // If session returns successfully but without a user, we are logged out
                    handleLogout();
                }
            } catch (error) {
                // If session is invalid, try refresh logic
                try {
                    const refreshResponse = await apiClient.auth.refresh();
                    const session = await apiClient.auth.getSession();
                    if (session && session.user) {
                        login(session.user, session.expiresAt || refreshResponse.expiresAt);
                    } else {
                        handleLogout();
                    }
                } catch (refreshError) {
                    handleLogout();
                }
            } finally {
                setLoading(false);
            }
        };

        const handleUnauthorized = () => {
            handleLogout();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        initAuth();

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, [login, storeLogout]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout: handleLogout, isAuthenticated }}>
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
