import { apiClient } from '@quiz/api-client';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';

export function usePresenceHeartbeat() {
    const { isAuthenticated, initialized, isLocked } = useAuthStore(
        useShallow((s) => ({
            isAuthenticated: s.isAuthenticated,
            initialized: s.initialized,
            isLocked: s.isLocked,
        }))
    );

    useEffect(() => {
        if (initialized === false || isAuthenticated === false || isLocked === true) return;

        // Initial heartbeat
        apiClient.auth.adminHeartbeat().catch((err) => {
            clientLogger.error('Admin presence heartbeat failed', { error: err instanceof Error ? err.message : 'unknown' });
        });

        // Ping every 60 seconds
        const interval = setInterval(() => {
            apiClient.auth.adminHeartbeat().catch((err) => {
                clientLogger.error('Admin presence heartbeat failed', { error: err instanceof Error ? err.message : 'unknown' });
            });
        }, 60000);

        return () => clearInterval(interval);
    }, [isAuthenticated, initialized, isLocked]);
}
