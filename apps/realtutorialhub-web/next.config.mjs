import bundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';
import withSerwist from '@serwist/next';
import createNextIntlPlugin from 'next-intl/plugin';

import { standardSecurityHeaders, getCSPHeader } from '../../packages/config/security-headers.mjs';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const apiUrlBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.realtutorialhub.com')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  output: process.env.CLOUD_RUN_BUILD === 'true' ? 'standalone' : undefined,
  transpilePackages: ['@quiz/api-client', '@quiz/auth', '@quiz/db', '@quiz/db-tutorial', '@quiz/events', '@quiz/types', '@quiz/validation', '@quiz/ui', 'lucide-react'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.realtutorialhub.com',
        pathname: '/content/**',
      },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const apiUrls = [
      process.env.NEXT_PUBLIC_API_URL,
      process.env.NEXT_PUBLIC_ADMIN_URL,
      process.env.NEXT_PUBLIC_WEB_APP_URL,
      'https://cloudflareinsights.com',
      'https://api.realtutorialhub.com',
    ].filter(Boolean);

    return [
      {
        source: '/api/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }],
      },
      {
        source: '/(login|signup|forgot-password|reset-password|dashboard|learn|onboarding|_next/data/.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }],
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
              isDev,
            }),
          },
        ],
      },
    ];
  },
};

const withTutorialSerwist = withSerwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  swUrl: '/sw.js',
  scope: '/',
  register: true,
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV !== 'production',
});

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withSentryConfig(withTutorialSerwist(withNextIntl(withBundleAnalyzer(nextConfig))), {
  org: 'real-tutorial-hub',
  project: process.env.SENTRY_PROJECT || 'quiz-platform',
  silent: true,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
});
