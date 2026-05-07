'use client';

import React, { useEffect, useState, use } from 'react';
import { SubtopicNotesPage } from '@/share-branding/SubtopicNotesPage';
import { SubtopicViewPage } from '@/share-branding/SubtopicViewPage';
import { loadSubtopicNotesData, SubtopicNotesViewData } from '@/share-branding/subtopicNotesData';
import { loadTutorialData, SubtopicViewData } from '@/share-branding/subtopicPageData';
import { useBrand, BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { rthConfig } from '@/share-branding/brandConfig';

interface SubtopicPageContentProps {
  subtopicId: string;
}

function SubtopicPageContent({ subtopicId }: SubtopicPageContentProps) {
  const brand = useBrand();
  const [notesData, setNotesData] = useState<SubtopicNotesViewData | null>(null);
  const [overviewData, setOverviewData] = useState<SubtopicViewData | null>(null);

  useEffect(() => {
    if (subtopicId) {
      async function fetchData() {
        const notes = await loadSubtopicNotesData(brand, subtopicId);
        const overview = await loadTutorialData(brand, subtopicId);
        setNotesData(notes);
        setOverviewData(overview);
      }
      fetchData();
    }
  }, [brand, subtopicId]);

  if (!notesData || !overviewData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200" style={{ borderTopColor: brand.primaryColor }}></div>
      </div>
    );
  }

  return <SubtopicNotesPage notesData={notesData} overviewData={overviewData} subtopicId={subtopicId} />;
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
