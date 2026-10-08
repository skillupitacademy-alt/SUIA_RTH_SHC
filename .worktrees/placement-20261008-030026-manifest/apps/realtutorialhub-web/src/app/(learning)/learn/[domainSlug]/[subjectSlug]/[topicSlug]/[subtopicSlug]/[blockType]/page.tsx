import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { ContentBlockType } from '@quiz/types';

import { getDomainTheme } from '@/lib/domain-themes';

import { TutorialExperience } from '@/components/content/TutorialExperience';
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
    blockType: string;
  }>;
  searchParams?: Promise<{
    slow?: string;
    error?: string;
  }>;
}

const validBlockTypes: ContentBlockType[] = [
  'notes',
  'layman',
  'real_life',
  'technical',
  'visual',
  'code',
  'quiz',
  'practice',
  'assignment',
  'project',
  'summary',
  'interview',
  'ai_tutor',
];

const blockTitles: Partial<Record<ContentBlockType, string>> = {
  notes: 'Notes',
  layman: 'Layman Explanation',
  real_life: 'Real Life Examples',
  technical: 'Technical Deep Dive',
  visual: 'Visual Explanation',
  code: 'Code Example',
  quiz: 'Quiz',
  practice: 'Practice Test',
  assignment: 'Assignment',
  project: 'Project',
  summary: 'Summary',
  interview: 'Interview Preparation',
  ai_tutor: 'AI Tutor',
};

function getBaseUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || process.env.NEXT_PUBLIC_WEB_APP_URL?.trim()
    || 'https://user.realtutorialhub.com';
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export async function generateStaticParams() {
  const paths = await getPublishedTutorialPathsForDelivery();
  return paths.flatMap((path) =>
    validBlockTypes.map((blockType) => ({
      domainSlug: path.domainSlug,
      subjectSlug: path.subjectSlug,
      topicSlug: path.topicSlug,
      subtopicSlug: path.subtopicSlug,
      blockType,
    }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  if (!validBlockTypes.includes(resolved.blockType as ContentBlockType)) {
    return {};
  }

  const hierarchy = await getTutorialHierarchyForDelivery(resolved);
  const sectionsPayload = await getValidatedTutorialSectionsForDelivery(resolved.subtopicSlug);
  const subtopicName = hierarchy?.subtopic.name ?? resolved.subtopicSlug.replace(/-/g, ' ');
  const blockTitle = blockTitles[resolved.blockType as ContentBlockType] ?? 'Tutorial Section';
  const canonical = `${getBaseUrl()}/learn/${resolved.domainSlug}/${resolved.subjectSlug}/${resolved.topicSlug}/${resolved.subtopicSlug}/${resolved.blockType}`;
  const description = `Study ${blockTitle.toLowerCase()} for ${subtopicName} on RealTutorialHub.`;

  return {
    title: `${subtopicName} ${blockTitle} | RealTutorialHub`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${subtopicName} ${blockTitle} | RealTutorialHub`,
      description,
      url: canonical,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${subtopicName} ${blockTitle} | RealTutorialHub`,
      description,
    },
    robots: sectionsPayload?.sections?.[resolved.blockType as ContentBlockType] ? undefined : { index: false, follow: false },
  };
}

export default async function TutorialBlockPage({ params, searchParams }: PageProps) {
  const resolved = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const blockType = resolved.blockType as ContentBlockType;

  if (!validBlockTypes.includes(blockType)) {
    notFound();
  }

  const hierarchy = await getTutorialHierarchyForDelivery(resolved);
  if (hierarchy === null) {
    notFound();
  }

  const sectionsPayload = await getValidatedTutorialSectionsForDelivery(resolved.subtopicSlug);
  if (sectionsPayload === null) {
    notFound();
  }

  const invalidSection = sectionsPayload.invalidSections.find((section) => section.sectionType === blockType);
  if (invalidSection) {
    throw new Error(getSectionValidationErrorMessage(invalidSection));
  }

  const targetSection = sectionsPayload.sections[blockType];
  if (targetSection === undefined) {
    throw new Error(`This tutorial section failed schema validation and must be regenerated. Section: ${blockType}. Missing required DB section.`);
  }

  const content = buildTutorialContentFromValidatedSections({
    [blockType]: targetSection,
    ...(sectionsPayload.sections.ai_tutor !== undefined ? { ai_tutor: sectionsPayload.sections.ai_tutor } : {}),
  });
  const theme = getDomainTheme(resolved.domainSlug);

  return (
    <TutorialExperience
      params={resolved}
      subtopicId={sectionsPayload.subtopicId}
      content={content}
      theme={theme}
      mode="detail"
      blockType={blockType}
      simulateSlowLoad={resolvedSearchParams.slow === 'true'}
      simulateError={resolvedSearchParams.error === 'true'}
    />
  );
}
