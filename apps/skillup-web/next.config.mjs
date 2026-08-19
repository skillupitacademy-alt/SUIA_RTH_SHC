import withSerwist from '@serwist/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  output: process.env.CLOUD_RUN_BUILD === 'true' ? 'standalone' : undefined,
  transpilePackages: ['@quiz/auth', '@quiz/db-tutorial', '@quiz/types', '@quiz/validation', '@quiz/ui', '@quiz/observability', '@quiz/api-client'],
  turbopack: {},
  experimental: {
    // Include ws package in standalone output for @neondatabase/serverless WebSocket support
    outputFileTracingIncludes: {
      '/tutorial-v2/**': ['./node_modules/.pnpm/ws@*/node_modules/**'],
      '/api/tutorial/**': ['./node_modules/.pnpm/ws@*/node_modules/**'],
    },
  },
};

const withSkillupSerwist = withSerwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  swUrl: '/sw.js',
  scope: '/',
  register: true,
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV !== 'production',
});

export default withSkillupSerwist(nextConfig);
