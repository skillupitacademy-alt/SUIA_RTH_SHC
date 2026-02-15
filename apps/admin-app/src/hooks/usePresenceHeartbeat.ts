import { apiClient } from '@quiz/api-client';
import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth-store';

export function usePresenceHeartbeat() {
    const { isAuthenticated, initialized } = useAuthStore();

    useEffect(() => {
        if (!initialized || !isAuthenticated) return;

        // Initial heartbeat
        apiClient.auth.adminHeartbeat().catch(() => {});

        // Ping every 60 seconds
        const interval = setInterval(() => {
            apiClient.auth.adminHeartbeat().catch(() => {});
        }, 60000);

        return () => clearInterval(interval);
    }, [isAuthenticated, initialized]);
}
