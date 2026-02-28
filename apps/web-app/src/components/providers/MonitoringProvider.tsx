'use client';

import React, { createContext, useContext, useState } from 'react';

type MonitoringContextType = {
    sessionId: string;
    logEvent: (event: string, metadata?: Record<string, unknown>, severity?: 'info' | 'warn' | 'error') => void;
};

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
    const [sessionId] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('quiz_session_id');
            if (stored) return stored;
            const newId = crypto.randomUUID();
            sessionStorage.setItem('quiz_session_id', newId);
            return newId;
        }
        return '';
    });

    const logEvent = async (event: string, metadata: Record<string, unknown> = {}, severity: 'info' | 'warn' | 'error' = 'info') => {
        try {
            const requestId = typeof window !== 'undefined' ? sessionStorage.getItem('last_request_id') : null;

            await fetch('/api/telemetry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event,
                    metadata,
                    severity,
                    sessionId,
                    requestId,
                    timestamp: new Date().toISOString(),
                }),
            });
        } catch (err) {
            // Fail silent on telemetry failure to avoid secondary crashes
            console.warn('[Telemetry] Failed to send event', err);
        }
    };

    return (
        <MonitoringContext.Provider value={{ sessionId, logEvent }}>
            {children}
        </MonitoringContext.Provider>
    );
}

export const useMonitoring = () => {
    const context = useContext(MonitoringContext);
    if (context === undefined) {
        throw new Error('useMonitoring must be used within a MonitoringProvider');
    }
    return context;
};
