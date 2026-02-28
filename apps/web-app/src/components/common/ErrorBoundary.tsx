'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from "@sentry/nextjs";

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
        const sessionId = typeof window !== 'undefined' ? (sessionStorage.getItem('quiz_session_id') ?? 'no-session') : 'unknown';
        const requestId = typeof window !== 'undefined' ? (sessionStorage.getItem('last_request_id') ?? 'no-request') : 'unknown';

        // 1. Sentry Capture with proper correlation IDs
        Sentry.withScope((scope) => {
            scope.setTag("sessionId", sessionId);
            scope.setTag("requestId", requestId);
            scope.setTag("app", "web-app");
            scope.setTag("component", "error-boundary");
            scope.setExtra("componentStack", errorInfo.componentStack);
            Sentry.captureException(error);
        });

        // 2. Log to internal telemetry endpoint (aligned to contract)
        fetch('/api/telemetry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId
            },
            body: JSON.stringify({
                event: 'frontend_error',
                severity: 'error',
                sessionId,
                requestId,
                service: 'web-app',
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
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 m-4 border border-red-200 rounded-lg bg-red-50 text-red-900">
                    <h2 className="text-lg font-bold">Something went wrong.</h2>
                    <p className="text-sm">We&apos;ve logged the error and our team is looking into it.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
