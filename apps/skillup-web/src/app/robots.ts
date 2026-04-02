export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/student/'],
      },
    ],
    sitemap: 'https://user.skillupitacademy.com/sitemap.xml',
  };
}
