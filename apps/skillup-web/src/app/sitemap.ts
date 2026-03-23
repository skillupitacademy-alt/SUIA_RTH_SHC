import { skillupPrograms } from '@/lib/skillup-demo-data';

export default function sitemap() {
  const baseUrl = 'https://skillupitacademy.com';

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/programs`, lastModified: new Date() },
    ...skillupPrograms.map((program) => ({ url: `${baseUrl}/programs/${program.slug}`, lastModified: new Date() })),
  ];
}
