/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@quiz/api-client', '@quiz/db', 'react-markdown', 'remark-gfm', 'lucide-react'],
};

module.exports = nextConfig;
