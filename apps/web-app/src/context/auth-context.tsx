'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';

// We keep the Context API for backward compatibility/wrapping, 
// but it delegates to the store.
// Actually, to avoid confusion, we'll make useAuth just a wrapper around the store 
// and AuthProvider just a logic mounter.

const AuthContext = createContext<any>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { token, user, login, logout } = useAuthStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                apiClient.setAccessToken(token);
                try {
                    await apiClient.auth.getSession();
                    // Session valid
                } catch (error) {
                    console.log('Session check failed, trying refresh...');
                    try {
                        const { accessToken } = await apiClient.auth.refresh();
                        apiClient.setAccessToken(accessToken);
                        login(user!, accessToken); // Update store
                    } catch (refreshError) {
                        console.log('Refresh failed, logging out');
                        logout();
                    }
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []); // Run once on mount

    // Sync token to apiClient on change (e.g. login/logout during session)
    useEffect(() => {
        apiClient.setAccessToken(token);
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    // If we want to use the context:
    const context = useContext(AuthContext);
    // If context is missing/undefined, we could fallback to store, but let's stick to context pattern to ensure Provider is checking session.
    // However, since components might use this hook, we return context values.
    // But honestly, direct store usage is better. 
    // For now, let's keep this shim active.
    if (context === undefined) {
        // Fallback if used outside provider (shouldn't happen with RootLayout)
        // return useAuthStore();
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
