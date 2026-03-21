import { notFound } from 'next/navigation';

import type { ContentBlockType } from '@quiz/types';

import { getDomainTheme } from '@/lib/domain-themes';
import { getSeededTutorialContent } from '@/lib/tutorial-content';

import { TutorialExperience } from '@/components/content/TutorialExperience';

interface PageProps {
  params: Promise<{
    domainSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
    blockType: string;
  }>;
}

const validBlockTypes: ContentBlockType[] = ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'];

export default async function TutorialBlockPage({ params }: PageProps) {
  const resolved = await params;
  if (!validBlockTypes.includes(resolved.blockType as ContentBlockType)) {
    notFound();
  }

  const content = await getSeededTutorialContent();
  const theme = getDomainTheme(resolved.domainSlug);

  return (
    <TutorialExperience
      params={resolved}
      content={content}
      theme={theme}
      mode="detail"
      blockType={resolved.blockType as ContentBlockType}
    />
  );
}

