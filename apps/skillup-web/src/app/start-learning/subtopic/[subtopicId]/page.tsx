'use client';

import React, { useEffect, useState, use } from 'react';
import { SubtopicNotesPageWrapper } from '@/share-branding/SubtopicNotesPageWrapper';
import { loadTutorialData, SubtopicViewData } from '@/share-branding/subtopicPageData';
import { useBrand, BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { skillUpConfig } from '@/share-branding/brandConfig';

interface SubtopicPageContentProps {
  subtopicId: string;
}

function SubtopicPageContent({ subtopicId }: SubtopicPageContentProps) {
  const brand = useBrand();
  const [overviewData, setOverviewData] = useState<SubtopicViewData | null>(null);

  useEffect(() => {
    if (subtopicId) {
      const fetchData = async () => {
        const overview = await loadTutorialData(brand, subtopicId);
        setOverviewData(overview);
      };
      fetchData();
    }
  }, [brand, subtopicId]);

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
    <BrandProvider brand={skillUpConfig}>
      <SubtopicPageContent subtopicId={resolvedParams.subtopicId} />
    </BrandProvider>
  );
}
