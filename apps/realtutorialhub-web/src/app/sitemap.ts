import type { MetadataRoute } from 'next';

import { getPublishedTutorialPathsForDelivery } from '@/server/tutorial-delivery';

export const revalidate = 3600;

const getSiteBaseUrl = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const webUrl = process.env.NEXT_PUBLIC_WEB_APP_URL;
  const fallback = 'https://realtutorialhub.com';
  const resolved = (siteUrl ?? webUrl ?? fallback).trim();
  return resolved.endsWith('/') ? resolved.slice(0, -1) : resolved;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl();
  const paths = await getPublishedTutorialPathsForDelivery();

  return paths.map((path) => ({
    url: `${baseUrl}/tutorial?domain=${encodeURIComponent(path.domainSlug)}&subject=${encodeURIComponent(path.subjectSlug)}&topic=${encodeURIComponent(path.topicSlug)}&subtopic=${encodeURIComponent(path.subtopicSlug)}`,
    lastModified: path.updatedAt ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
}
