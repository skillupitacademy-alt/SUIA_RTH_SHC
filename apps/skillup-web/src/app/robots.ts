export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/student/'],
      },
    ],
    sitemap: 'https://skillupitacademy.com/sitemap.xml',
  };
}
