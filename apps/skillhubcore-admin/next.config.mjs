/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  output: process.env.CLOUD_RUN_BUILD === 'true' ? 'standalone' : undefined,
  transpilePackages: ['@quiz/auth', '@quiz/types', '@quiz/db-tutorial', '@quiz/observability', '@quiz/ui', '@quiz/api-client'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
};

export default nextConfig;
