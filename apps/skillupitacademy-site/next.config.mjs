import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const isStaticExport = process.env.NEXT_OUTPUT_MODE === 'export';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isStaticExport ? 'export' : 'standalone',
  transpilePackages: ['@quiz/marketing-site'],
  images: {
    unoptimized: isStaticExport,
  },
};

export default withBundleAnalyzer(nextConfig);
