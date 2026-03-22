export default function sitemap() {
  const baseUrl = 'https://skillupitacademy.com';

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/programs`, lastModified: new Date() },
    { url: `${baseUrl}/login`, lastModified: new Date() },
    { url: `${baseUrl}/register`, lastModified: new Date() },
    { url: `${baseUrl}/student`, lastModified: new Date() },
    { url: `${baseUrl}/student/my-batch`, lastModified: new Date() },
    { url: `${baseUrl}/student/attendance`, lastModified: new Date() },
    { url: `${baseUrl}/student/payments`, lastModified: new Date() },
    { url: `${baseUrl}/student/placement`, lastModified: new Date() },
  ];
}
