import bundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from "@sentry/nextjs";
import { standardSecurityHeaders, getCSPHeader } from '../../packages/config/security-headers.mjs';

const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
});

const apiUrlBase = (process.env.NEXT_PUBLIC_API_URL || "https://api.realtutorialhub.com")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
    compress: true,
    output: process.env.CLOUD_RUN_BUILD === 'true' ? 'standalone' : undefined,
    transpilePackages: ['@quiz/api-client', '@quiz/db', 'react-markdown', 'remark-gfm', 'lucide-react'],
    async headers() {
        const isDev = process.env.NODE_ENV === 'development';
        const apiUrls = [
            process.env.NEXT_PUBLIC_API_URL,
            process.env.NEXT_PUBLIC_ADMIN_URL,
            process.env.NEXT_PUBLIC_WEB_APP_URL,
            "https://cloudflareinsights.com",
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
                source: '/(login|dashboard|questions|factory|users|reports|trends|governance|forgot-password|reset-password|_next/data/.*)',
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
                            reportUri: `${apiUrlBase}/api/security/report`,
                            isDev
                        })
                    },
                ],
            },
        ];
    },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
    org: "real-tutorial-hub",
    project: process.env.SENTRY_PROJECT || "quiz-platform",
    silent: true,
    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
});
