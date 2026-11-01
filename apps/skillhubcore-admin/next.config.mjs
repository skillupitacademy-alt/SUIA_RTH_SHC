/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  ...(process.env.PROJECT_LLM_EXECUTION_MODE === 'isolated_worker'
    ? { experimental: { cpus: 1 } }
    : {}),
  output: process.env.CLOUD_RUN_BUILD === 'true' ? 'standalone' : undefined,
  transpilePackages: ['@quiz/auth', '@quiz/types', '@quiz/validation', '@quiz/db-tutorial', '@quiz/observability', '@quiz/ui', '@quiz/api-client', '@quiz/marketing-site'],
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
