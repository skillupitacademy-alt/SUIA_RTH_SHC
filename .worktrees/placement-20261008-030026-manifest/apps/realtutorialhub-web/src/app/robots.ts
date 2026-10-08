import type { MetadataRoute } from 'next';

const getBaseUrl = () => {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || process.env.NEXT_PUBLIC_WEB_APP_URL?.trim()
    || 'https://user.realtutorialhub.com';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: '*',
      allow: ['/learn/', '/start-learning/', '/tutorial/'],
      disallow: ['/api/', '/dashboard/', '/login', '/signup'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
