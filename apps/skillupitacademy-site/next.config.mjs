import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  transpilePackages: ['@quiz/marketing-site'],
  images: {
    unoptimized: true,
  },
};

export default withBundleAnalyzer(nextConfig);
