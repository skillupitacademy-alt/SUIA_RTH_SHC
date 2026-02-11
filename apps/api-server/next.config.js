/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@quiz/api-client', '@quiz/db', '@quiz/ui', 'lucide-react'],
};

module.exports = nextConfig;
