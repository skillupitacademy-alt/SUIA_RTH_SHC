import { notFound } from 'next/navigation';

import type { ContentBlockType } from '@quiz/types';

import { getDomainTheme } from '@/lib/domain-themes';
import { SEED_SUBTOPIC_ID, getSeededTutorialContent } from '@/lib/tutorial-content';
import { getHierarchyBySlugs, getPublishedTutorialContent } from '@/lib/tutorial-hierarchy';

import { TutorialExperience } from '@/components/content/TutorialExperience';

interface PageProps {
  params: Promise<{
    domainSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
    blockType: string;
  }>;
  searchParams?: Promise<{
    slow?: string;
    error?: string;
  }>;
}

const validBlockTypes: ContentBlockType[] = ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'];

export default async function TutorialBlockPage({ params, searchParams }: PageProps) {
  const resolved = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  if (!validBlockTypes.includes(resolved.blockType as ContentBlockType)) {
    notFound();
  }

  const hierarchy = await getHierarchyBySlugs(resolved);
  const publishedContent = hierarchy != null ? await getPublishedTutorialContent(hierarchy.subtopic.id) : null;
  const content = publishedContent?.content ?? (await getSeededTutorialContent());
  const theme = getDomainTheme(resolved.domainSlug);
  const subtopicId = hierarchy?.subtopic.id ?? SEED_SUBTOPIC_ID;

  return (
    <TutorialExperience
      params={resolved}
      subtopicId={subtopicId}
      content={content}
      theme={theme}
      mode="detail"
      blockType={resolved.blockType as ContentBlockType}
      simulateSlowLoad={resolvedSearchParams.slow === 'true'}
      simulateError={resolvedSearchParams.error === 'true'}
    />
  );
}
