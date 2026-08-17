import { notFound } from 'next/navigation';

import { TutorialLeftSidebar } from '@/share-branding/LearningExperience/components/TutorialLeftSidebar';
import { getPublishedTutorialSidebar } from '@/share-branding/LearningExperience/tutorialSidebarDelivery';

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
  const payload = await getPublishedTutorialSidebar({
    brandId: 'realtutorialhub',
    ...resolved,
  });

  if (!payload) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f4f7fa]">
      <TutorialLeftSidebar tree={payload.tree} activeUrl={payload.activeUrl} />
    </main>
  );
}
