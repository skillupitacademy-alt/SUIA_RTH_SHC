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
            // Re-validate session on mount using the httpOnly cookie
            try {
                const session = await apiClient.auth.getSession();
                if (session && session.user) {
                    login(session.user);
                }
            } catch (error) {
                // If session is invalid, try refresh logic
                try {
                    await apiClient.auth.refresh();
                    const session = await apiClient.auth.getSession();
                    if (session && session.user) {
                        login(session.user);
                    }
                } catch (refreshError) {
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, [login, logout]); // Essential store methods

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
