/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@quiz/api-client', '@quiz/db'],
    async headers() {
        return [
            {
                source: '/api/(.*)',
                headers: [
                    { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
                ],
            },
            {
                source: '/(login|signup|forgot-password|reset-password|dashboard|quiz|onboarding|_next/data/.*)',
                headers: [
                    { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
                ],
            },
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    {
                        key: 'Content-Security-Policy-Report-Only',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "img-src 'self' data: blob: https://images.unsplash.com " + (process.env.NEXT_PUBLIC_WEB_APP_URL || ""),
                            "font-src 'self' https://fonts.gstatic.com",
                            "connect-src 'self' " +
                            [process.env.NEXT_PUBLIC_API_URL, process.env.NEXT_PUBLIC_ADMIN_URL, process.env.NEXT_PUBLIC_WEB_APP_URL, "https://cloudflareinsights.com"]
                                .filter(Boolean).join(" "),
                            "frame-ancestors 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "object-src 'none'",
                            "manifest-src 'self'",
                            "upgrade-insecure-requests",
                            `report-uri ${process.env.NEXT_PUBLIC_API_URL || "https://api.realtutorialhub.com"}/api/security/report`,
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
