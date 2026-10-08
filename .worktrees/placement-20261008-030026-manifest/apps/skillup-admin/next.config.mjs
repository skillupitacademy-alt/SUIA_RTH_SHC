/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  output: process.env.CLOUD_RUN_BUILD === 'true' ? 'standalone' : undefined,
  transpilePackages: ['@quiz/auth', '@quiz/events', '@quiz/types', '@quiz/ui', '@quiz/observability', '@quiz/api-client'],
};

export default nextConfig;
