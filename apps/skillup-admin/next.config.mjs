/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  output: process.env.CLOUD_RUN_BUILD === 'true' ? 'standalone' : undefined,
  transpilePackages: ['@quiz/auth', '@quiz/events', '@quiz/types'],
};

export default nextConfig;
