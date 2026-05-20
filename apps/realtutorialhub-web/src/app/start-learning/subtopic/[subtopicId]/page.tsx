import type { Metadata } from 'next';

import { buildOverviewFromSections } from '@/share-branding/subtopicPageData';
import { BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { SubtopicNotesPageWrapper } from '@/share-branding/SubtopicNotesPageWrapper';
import { buildSubtopicNotesDataFromSectionsResponse } from '@/share-branding/subtopicNotesDataAPI';
import { rthConfig } from '@/share-branding/brandConfig';

import { getTutorialSectionsForDelivery } from '@/server/tutorial-delivery';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SubtopicPageProps {
  params: Promise<{ subtopicId: string }>;
  searchParams?: Promise<{ tab?: string }>;
}

function getBaseUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || process.env.NEXT_PUBLIC_WEB_APP_URL?.trim()
    || 'https://user.realtutorialhub.com';
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export async function generateMetadata({ params }: SubtopicPageProps): Promise<Metadata> {
  const { subtopicId } = await params;
  const data = await getTutorialSectionsForDelivery(subtopicId);
  const title = data?.subtopicName ?? subtopicId.replace(/-/g, ' ');
  const overview = data?.sections?.overview as { hero?: { description?: string } } | undefined;
  const description = overview?.hero?.description ?? `Start learning ${title} with guided notes, practice, projects, and quiz sections.`;
  const canonical = `${getBaseUrl()}/start-learning/subtopic/${subtopicId}`;

  return {
    title: `${title} | RealTutorialHub`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | RealTutorialHub`,
      description,
      url: canonical,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | RealTutorialHub`,
      description,
    },
  };
}

export default async function SubtopicPage({ params, searchParams }: SubtopicPageProps) {
  const { subtopicId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialTab = typeof resolvedSearchParams?.tab === 'string' ? resolvedSearchParams.tab : 'overview';
  const sectionsResponse = await getTutorialSectionsForDelivery(subtopicId);

  if (sectionsResponse === null) {
    throw new Error(`This tutorial section failed schema validation and must be regenerated. Section set not found for subtopic "${subtopicId}".`);
  }

  const overviewData = buildOverviewFromSections(rthConfig, subtopicId, sectionsResponse);
  const initialNotesData = buildSubtopicNotesDataFromSectionsResponse(rthConfig, subtopicId, sectionsResponse);

  return (
    <BrandProvider brand={rthConfig}>
      <SubtopicNotesPageWrapper
        subtopicId={subtopicId}
        overviewData={overviewData}
        initialNotesData={initialNotesData}
        initialTab={initialTab}
        useAPI={true}
      />
    </BrandProvider>
  );
}
