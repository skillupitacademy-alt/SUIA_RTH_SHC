/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@quiz/api-client', '@quiz/db'],
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

module.exports = nextConfig;
