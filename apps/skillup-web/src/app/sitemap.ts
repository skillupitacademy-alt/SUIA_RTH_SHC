import { getSkillupPrograms } from '@/lib/skillup-data';

export default async function sitemap() {
  const baseUrl = 'https://skillupitacademy.com';
  const { programs } = await getSkillupPrograms();

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/programs`, lastModified: new Date() },
    ...programs.map((program) => ({ url: `${baseUrl}/programs/${program.slug}`, lastModified: new Date() })),
  ];
}
