import { notFound } from 'next/navigation';

import { TutorialCodeContent } from '@/share-branding/LearningExperience/components/TutorialCodeContent';
import { TutorialDefinitionContent } from '@/share-branding/LearningExperience/components/TutorialDefinitionContent';
import { TutorialLeftSidebar } from '@/share-branding/LearningExperience/components/TutorialLeftSidebar';
import { TutorialFooterNavigation, TutorialHeader } from '@/share-branding/LearningExperience/components/TutorialPageChrome';
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
    brandId: 'realtutorialhub',
    ...resolved,
  });

  if (!payload) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f4f7fa]">
      <TutorialHeader
        crumbs={[payload.hierarchy.domain.name, payload.hierarchy.subject.name, payload.hierarchy.topic.name]}
        active={payload.hierarchy.subtopic.name}
        theme={payload.theme}
      />
      <div className="flex">
        <TutorialLeftSidebar tree={payload.sidebar} activeUrl={payload.activeUrl} />
        <div className="min-w-0 flex-1 px-6 py-6">
          <div className="mx-auto max-w-[980px] space-y-6">
            {payload.content.definition && <TutorialDefinitionContent payload={payload.content.definition} theme={payload.theme} />}
            {payload.content.code && <TutorialCodeContent payload={payload.content.code} theme={payload.theme} />}
            {!payload.content.definition && !payload.content.code && (
              <section className="rounded-xl border border-[#e4eaf2] bg-white p-6 text-[#071f63] shadow-sm">
                Content is not published for this subtopic yet.
              </section>
            )}
          </div>
          <TutorialFooterNavigation previous={payload.footer.previous} next={payload.footer.next} theme={payload.theme} />
        </div>
      </div>
    </main>
  );
}
