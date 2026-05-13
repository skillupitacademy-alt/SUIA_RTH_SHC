import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';

import { ProjectRepository } from '@quiz/db-tutorial';

import { getDomainTheme } from '@/lib/domain-themes';

import { TutorialExperience } from '@/components/content/TutorialExperience';
import type { ProjectCard } from '@/components/content/ProjectSubmissionPanel';
import {
  buildTutorialContentFromValidatedSections,
  getPublishedTutorialPathsForDelivery,
  getSectionValidationErrorMessage,
  getTutorialHierarchyForDelivery,
  getValidatedTutorialSectionsForDelivery,
} from '@/server/tutorial-delivery';

export const revalidate = 1800;
export const dynamicParams = true;

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

function titleCaseFromSlug(value: string) {
  return value
    .split('-')
    .filter((part) => part.trim().length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getBaseUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || process.env.NEXT_PUBLIC_WEB_APP_URL?.trim()
    || 'https://user.realtutorialhub.com';
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function deriveDescription(sections: Partial<Record<string, unknown>>, fallback: string): string {
  const overview = sections.overview as { hero?: { description?: string } } | undefined;
  const notes = sections.notes as { definitionBlock?: { definitionText?: string } } | undefined;
  const layman = sections.layman as { simpleOverview?: { simpleDefinition?: string } } | undefined;

  return overview?.hero?.description
    ?? notes?.definitionBlock?.definitionText
    ?? layman?.simpleOverview?.simpleDefinition
    ?? fallback;
}

export async function generateStaticParams() {
  const paths = await getPublishedTutorialPathsForDelivery();
  return paths.map((path) => ({
    domainSlug: path.domainSlug,
    subjectSlug: path.subjectSlug,
    topicSlug: path.topicSlug,
    subtopicSlug: path.subtopicSlug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const hierarchy = await getTutorialHierarchyForDelivery(resolved);
  const sectionsPayload = await getValidatedTutorialSectionsForDelivery(resolved.subtopicSlug);

  const subtopicName = hierarchy?.subtopic.name ?? titleCaseFromSlug(resolved.subtopicSlug);
  const topicName = hierarchy?.topic.name ?? titleCaseFromSlug(resolved.topicSlug);
  const description = deriveDescription(
    sectionsPayload?.sections ?? {},
    `Learn ${subtopicName} with structured notes, examples, practice, and assessment.`
  );
  const canonical = `${getBaseUrl()}/learn/${resolved.domainSlug}/${resolved.subjectSlug}/${resolved.topicSlug}/${resolved.subtopicSlug}`;

  return {
    title: `${subtopicName} - ${topicName} | RealTutorialHub`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${subtopicName} - ${topicName} | RealTutorialHub`,
      description,
      url: canonical,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${subtopicName} - ${topicName} | RealTutorialHub`,
      description,
    },
  };
}

export default async function TutorialSubtopicPage({ params, searchParams }: PageProps) {
  const resolved = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const hierarchy = await getTutorialHierarchyForDelivery(resolved);
  if (hierarchy === null) {
    notFound();
  }

  const sectionsPayload = await getValidatedTutorialSectionsForDelivery(resolved.subtopicSlug);
  if (sectionsPayload === null) {
    notFound();
  }

  const notesValidationError = sectionsPayload.invalidSections.find((section) => section.sectionType === 'notes');
  if (notesValidationError) {
    throw new Error(getSectionValidationErrorMessage(notesValidationError));
  }

  if (sectionsPayload.sections.notes === undefined) {
    throw new Error('This tutorial section failed schema validation and must be regenerated. Section: notes. Missing required DB section.');
  }

  const theme = getDomainTheme(resolved.domainSlug);
  const content = buildTutorialContentFromValidatedSections(sectionsPayload.sections);
  const projectRepository = new ProjectRepository();

  const projects: ProjectCard[] = (
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

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: hierarchy.subtopic.name,
    description: deriveDescription(sectionsPayload.sections, `Learn ${hierarchy.subtopic.name}.`),
    author: {
      '@type': 'Organization',
      name: 'RealTutorialHub',
    },
    about: [
      hierarchy.domain.name,
      hierarchy.subject.name,
      hierarchy.topic.name,
      hierarchy.subtopic.name,
    ],
    mainEntityOfPage: `${getBaseUrl()}/learn/${resolved.domainSlug}/${resolved.subjectSlug}/${resolved.topicSlug}/${resolved.subtopicSlug}`,
  };

  return (
    <>
      <Script id="tutorial-article-jsonld" type="application/ld+json">
        {JSON.stringify(structuredData)}
      </Script>
      <TutorialExperience
        params={resolved}
        subtopicId={sectionsPayload.subtopicId}
        content={content}
        theme={theme}
        mode="learn"
        projects={projects}
        simulateSlowLoad={resolvedSearchParams.slow === 'true'}
        simulateError={resolvedSearchParams.error === 'true'}
      />
    </>
  );
}
