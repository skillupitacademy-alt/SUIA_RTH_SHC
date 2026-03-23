import type { Metadata } from 'next';

import { getDomainTheme } from '@/lib/domain-themes';
import { getSeededTutorialContent } from '@/lib/tutorial-content';
import { getHierarchyBySlugs, getPublishedTutorialContent, slugifySegment } from '@/lib/tutorial-hierarchy';

import { TutorialExperience } from '@/components/content/TutorialExperience';

interface PageProps {
  params: Promise<{
    domainSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
  }>;
  searchParams?: Promise<{
    slow?: string;
    error?: string;
  }>;
}

export default async function TutorialSubtopicPage({ params, searchParams }: PageProps) {
  const resolved = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const content = await getSeededTutorialContent();
  const theme = getDomainTheme(resolved.domainSlug);

  return (
    <TutorialExperience
      params={resolved}
      content={content}
      theme={theme}
      mode="learn"
      simulateSlowLoad={resolvedSearchParams.slow === 'true'}
      simulateError={resolvedSearchParams.error === 'true'}
    />
  );
}

function titleCaseFromSlug(value: string) {
  return value
    .split('-')
    .filter((part) => part.trim().length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const hierarchy = await getHierarchyBySlugs(resolved);
  const content = hierarchy != null ? await getPublishedTutorialContent(hierarchy.subtopic.id) : null;

  const subtopicName = hierarchy?.subtopic.name ?? titleCaseFromSlug(slugifySegment(resolved.subtopicSlug));
  const topicName = hierarchy?.topic.name ?? titleCaseFromSlug(slugifySegment(resolved.topicSlug));
  const description = content?.content && typeof content.content === 'object' && content.content !== null
    ? ((content.content as { layman?: { simpleExplanation?: string } }).layman?.simpleExplanation ?? '')
        .slice(0, 160)
    : '';

  return {
    title: `${subtopicName} — ${topicName} | RealTutorialHub`,
    description,
    openGraph: {
      title: `${subtopicName} — ${topicName} | RealTutorialHub`,
      description,
      type: 'article',
    },
  };
}
