'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from "@sentry/nextjs";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    appId: string;
    sessionIdKey: string;
    recoveryMode?: 'reload' | 'home' | 'both';
}

interface State {
    hasError: boolean;
}

export class ZErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const sessionId = typeof window !== 'undefined' ? (sessionStorage.getItem(this.props.sessionIdKey) ?? 'no-session') : 'unknown';
        const requestId = typeof window !== 'undefined' ? (sessionStorage.getItem('last_request_id') ?? 'no-request') : 'unknown';

        // 1. Sentry Capture with proper correlation IDs
        Sentry.withScope((scope) => {
            scope.setTag("sessionId", sessionId);
            scope.setTag("requestId", requestId);
            scope.setTag("app", this.props.appId);
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
                event: 'frontend_error',
                severity: 'error',
                sessionId,
                requestId,
                service: this.props.appId,
                component: 'error-boundary',
                metadata: {
                    message: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack,
                    url: typeof window !== 'undefined' ? window.location.href : 'unknown'
                }
            })
        }).catch(e => console.error('[ZErrorBoundary] Failed to log error', e));
    }

    private handleReload = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    private handleGoHome = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            const mode = this.props.recoveryMode ?? 'reload';

            return (
                <div className="p-6 m-6 border-2 border-red-500 rounded-lg bg-red-50 text-red-900 shadow-xl dark:bg-red-950 dark:border-red-900 dark:text-red-100">
                    <h2 className="text-xl font-bold font-mono">
                        {this.props.appId === 'admin-app' ? 'CRITICAL_ADMIN_FAILURE' : 'Something went wrong'}
                    </h2>
                    <p className="mt-2 text-sm opacity-80">
                        We&apos;ve logged this error for immediate audit. Please try reloading the platform.
                    </p>

                    <div className="mt-6 flex gap-4">
                        {(mode === 'reload' || mode === 'both') && (
                            <button
                                onClick={this.handleReload}
                                className="px-4 py-2 bg-red-800 text-white font-bold rounded hover:bg-black transition-all text-sm"
                            >
                                {this.props.appId === 'admin-app' ? 'TERMINAL_RELOAD' : 'Reload Page'}
                            </button>
                        )}
                        {(mode === 'home' || mode === 'both') && (
                            <button
                                onClick={this.handleGoHome}
                                className="px-4 py-2 border border-red-800 text-red-800 font-bold rounded hover:bg-red-100 dark:hover:bg-red-900 transition-all text-sm"
                            >
                                {this.props.appId === 'admin-app' ? 'EXIT_TO_DASHBOARD' : 'Return Home'}
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
