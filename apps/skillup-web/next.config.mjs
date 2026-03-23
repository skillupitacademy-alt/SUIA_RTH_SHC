import withSerwist from '@serwist/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  output: process.env.CLOUD_RUN_BUILD === 'true' ? 'standalone' : undefined,
  transpilePackages: ['@quiz/auth'],
  turbopack: {},
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
