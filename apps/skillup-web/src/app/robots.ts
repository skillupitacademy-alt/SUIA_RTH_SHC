export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/student/', '/login', '/register'],
      },
    ],
    sitemap: 'https://skillupitacademy.com/sitemap.xml',
  };
}
