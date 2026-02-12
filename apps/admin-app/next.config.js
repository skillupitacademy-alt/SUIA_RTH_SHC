/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@quiz/api-client', '@quiz/db', 'react-markdown', 'remark-gfm', 'lucide-react'],
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    {
                        key: 'Content-Security-Policy-Report-Only',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
                            "style-src 'self' 'unsafe-inline' https:",
                            "img-src 'self' data: blob: https:",
                            "font-src 'self' data: https:",
                            "connect-src 'self' https: wss:",
                            "frame-ancestors 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
