export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/student/'],
      },
    ],
    sitemap: 'https://app.skillupitacademy.com/sitemap.xml',
  };
}
