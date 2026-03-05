import path from 'path';
import { fileURLToPath } from 'url';
import { withSentryConfig } from "@sentry/nextjs";
import { standardSecurityHeaders, getCSPHeader } from '../../packages/config/security-headers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@quiz/api-client', '@quiz/db', '@quiz/ui', 'lucide-react'],
    serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
    outputFileTracingRoot: path.join(__dirname, '../../'),
    outputFileTracingIncludes: {
        '/api/generate-report': ['../../node_modules/@sparticuz/chromium/**/*'],
        '/api/cron/pdf-health': ['../../node_modules/@sparticuz/chromium/**/*'],
    },
    async headers() {
        const isDev = process.env.NODE_ENV === 'development';
        const apiUrls = [
            process.env.NEXT_PUBLIC_API_URL,
            process.env.NEXT_PUBLIC_ADMIN_URL,
            process.env.NEXT_PUBLIC_WEB_APP_URL,
            "https://api.realtutorialhub.com"
        ].filter(Boolean);

        return [
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
