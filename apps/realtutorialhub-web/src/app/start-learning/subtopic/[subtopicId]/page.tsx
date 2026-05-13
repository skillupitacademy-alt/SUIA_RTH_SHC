'use client';

import React, { useEffect, useState, use } from 'react';
import { SubtopicNotesPageWrapper } from '@/share-branding/SubtopicNotesPageWrapper';
import { loadTutorialData, SubtopicViewData } from '@/share-branding/subtopicPageData';
import { useBrand, BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { rthConfig } from '@/share-branding/brandConfig';

interface SubtopicPageContentProps {
  subtopicId: string;
}

function SubtopicPageContent({ subtopicId }: SubtopicPageContentProps) {
  const brand = useBrand();
  const [overviewData, setOverviewData] = useState<SubtopicViewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subtopicId) {
      const fetchData = async () => {
        try {
          setError(null);
          const overview = await loadTutorialData(brand, subtopicId);
          setOverviewData(overview);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to load tutorial overview');
        }
      };
      fetchData();
    }
  }, [brand, subtopicId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-xl rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="mb-3 text-xl font-semibold text-red-900">Tutorial Content Blocked</h1>
          <p className="text-sm font-medium leading-6 text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200" style={{ borderTopColor: brand.primaryColor }}></div>
      </div>
    );
  }

  return <SubtopicNotesPageWrapper subtopicId={subtopicId} overviewData={overviewData} useAPI={true} />;
}

interface SubtopicPageProps {
  params: Promise<{ subtopicId: string }>;
}

export default function SubtopicPage({ params }: SubtopicPageProps) {
  const resolvedParams = use(params);
  
  return (
    <BrandProvider brand={rthConfig}>
      <SubtopicPageContent subtopicId={resolvedParams.subtopicId} />
    </BrandProvider>
  );
}
