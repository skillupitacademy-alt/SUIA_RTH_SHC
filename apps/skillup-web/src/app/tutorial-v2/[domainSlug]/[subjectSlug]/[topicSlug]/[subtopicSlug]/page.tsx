import { notFound } from 'next/navigation';

import { TutorialPageShell } from '@/share-branding/LearningExperience/components/TutorialPageShell';
import { getPublishedTutorialPagePayload } from '@/share-branding/LearningExperience/tutorialSidebarDelivery';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    domainSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
  }>;
}

export default async function TutorialV2SubtopicPage({ params }: PageProps) {
  const resolved = await params;
  const payload = await getPublishedTutorialPagePayload({
    brandId: 'skillup',
    ...resolved,
  });

  if (!payload) {
    notFound();
  }

  return <TutorialPageShell payload={payload} />;
}
