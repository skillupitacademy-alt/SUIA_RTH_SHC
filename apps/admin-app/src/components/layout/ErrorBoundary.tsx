'use client';

import * as Sentry from "@sentry/nextjs";
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const sessionId = typeof window !== 'undefined' ? (sessionStorage.getItem('admin_session_id') ?? 'no-session') : 'unknown';
        const requestId = typeof window !== 'undefined' ? (sessionStorage.getItem('last_request_id') ?? 'no-request') : 'unknown';

        // 1. Sentry Capture with proper correlation tags
        Sentry.withScope((scope) => {
            scope.setTag("sessionId", sessionId);
            scope.setTag("requestId", requestId);
            scope.setTag("app", "admin-app");
            scope.setTag("component", "error-boundary");
            scope.setExtra("componentStack", errorInfo.componentStack);
            Sentry.captureException(error);
        });

        // 2. Log to internal telemetry endpoint
        fetch('/api/telemetry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId
            },
            body: JSON.stringify({
                event: 'admin_frontend_error',
                severity: 'error',
                sessionId,
                requestId,
                service: 'admin-app',
                component: 'error-boundary',
                metadata: {
                    message: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack,
                    url: typeof window !== 'undefined' ? window.location.href : 'unknown'
                }
            })
        }).catch(e => console.error('[ErrorBoundary] Failed to log error', e));
    }

    public render() {
        if (this.state.hasError === true) {
            if (this.props.fallback !== undefined) return this.props.fallback;
            return (
                <div className="p-6 m-6 border-2 border-red-500 rounded-lg bg-red-50 text-red-900 shadow-xl">
                    <h2 className="text-xl font-bold font-mono">CRITICAL_ADMIN_FAILURE</h2>
                    <p className="mt-2 text-sm opacity-80">The admin terminal encountered an unhandled exception. This event has been logged for immediate audit.</p>
                    <div className="mt-6 flex gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-800 text-white font-bold rounded hover:bg-black transition-colors text-sm"
                        >
                            TERMINAL_RELOAD
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-4 py-2 border border-red-800 text-red-800 font-bold rounded hover:bg-red-100 transition-colors text-sm"
                        >
                            EXIT_TO_DASHBOARD
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
