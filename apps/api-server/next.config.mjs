import path from 'path';
import { fileURLToPath } from 'url';
import { withSentryConfig } from "@sentry/nextjs";
import { standardSecurityHeaders, getCSPHeader } from '../../packages/config/security-headers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    compress: true,
    transpilePackages: ['@quiz/api-client', '@quiz/db', '@quiz/ui', 'lucide-react'],
    // Bundle ioredis/BullMQ to avoid Turbopack “can't be external” warnings; keep heavy binaries out.
    serverExternalPackages: [],
    env: {
        QUEUE_ENABLED: process.env.QUEUE_ENABLED ?? 'false',
    },
    outputFileTracingRoot: path.join(__dirname, '../../'),
    outputFileTracingIncludes: {
        '/api/generate-report': ['../../node_modules/@sparticuz/chromium/**/*'],
        '/api/cron/pdf-health': ['../../node_modules/@sparticuz/chromium/**/*'],
    },
    async headers() {
        const isDev = process.env.NODE_ENV === 'development';
        const reportAllowedOrigin = process.env.NEXT_PUBLIC_WEB_APP_URL || "https://quiz.realtutorialhub.com";
        const apiUrls = [
            process.env.NEXT_PUBLIC_API_URL,
            process.env.NEXT_PUBLIC_ADMIN_URL,
            process.env.NEXT_PUBLIC_WEB_APP_URL,
            "https://api.realtutorialhub.com"
        ].filter(Boolean);

        return [
            {
                source: '/api/security/report',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: reportAllowedOrigin },
                    { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
                    { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
                ],
            },
            {
                source: '/api/(.*)',
                headers: [
                    { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
                ],
            },
            {
                source: '/(.*)',
                headers: [
                    ...standardSecurityHeaders,
                    {
                        key: 'Content-Security-Policy-Report-Only',
                        value: getCSPHeader({
                            apiUrls,
                            webAppUrl: process.env.NEXT_PUBLIC_WEB_APP_URL,
                            adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL,
                            reportUri: `${process.env.NEXT_PUBLIC_API_URL || "https://api.realtutorialhub.com"}/api/security/report`,
                            isDev
                        })
                    },
                ],
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                destination: '/api/:path*',
            },
        ];
    },
};

const sentryConfig = {
    org: "real-tutorial-hub",
    project: process.env.SENTRY_PROJECT || "quiz-platform",
    silent: true,
    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
};

export default withSentryConfig(nextConfig, sentryConfig);
