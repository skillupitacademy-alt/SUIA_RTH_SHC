import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';

export function usePresenceHeartbeat() {
    const { isAuthenticated, initialized } = useAuthStore();

    useEffect(() => {
        if (!initialized || !isAuthenticated) return;

        // Initial heartbeat
        apiClient.auth.heartbeat().catch(() => {});

        // Ping every 60 seconds
        const interval = setInterval(() => {
            apiClient.auth.heartbeat().catch(() => {});
        }, 60000);

        return () => clearInterval(interval);
    }, [isAuthenticated, initialized]);
}
