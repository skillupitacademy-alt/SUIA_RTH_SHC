import type { Metadata } from 'next';

import { ProjectRepository } from '@quiz/db-tutorial';

import { getDomainTheme } from '@/lib/domain-themes';
import { SEED_SUBTOPIC_ID, getSeededTutorialContent } from '@/lib/tutorial-content';
import { getHierarchyBySlugs, getPublishedTutorialContent, slugifySegment } from '@/lib/tutorial-hierarchy';

import { TutorialExperience } from '@/components/content/TutorialExperience';
import type { ProjectCard } from '@/components/content/ProjectSubmissionPanel';

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
  const hierarchy = await getHierarchyBySlugs(resolved);
  const publishedContent = hierarchy != null ? await getPublishedTutorialContent(hierarchy.subtopic.id) : null;
  const content = publishedContent?.content ?? (await getSeededTutorialContent());
  const theme = getDomainTheme(resolved.domainSlug);
  const subtopicId = hierarchy?.subtopic.id ?? SEED_SUBTOPIC_ID;
  const projectRepository = new ProjectRepository();

  const projects: ProjectCard[] = hierarchy == null
    ? []
    : (
      await Promise.all([
        projectRepository.getProjectsByScope('topic', hierarchy.topic.id),
        projectRepository.getProjectsByScope('subject', hierarchy.subject.id),
        projectRepository.getProjectsByScope('domain', hierarchy.domain.id),
      ])
    )
      .flat()
      .filter((project) => project.isPublished)
      .map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        deliverableType: project.deliverableType,
        level: project.level,
        scope: project.scope,
      }));

  return (
    <TutorialExperience
      params={resolved}
      subtopicId={subtopicId}
      content={content}
      theme={theme}
      mode="learn"
      projects={projects}
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
