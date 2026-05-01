'use client';

import React, { useEffect, useState } from 'react';
import { SubtopicNotesPage } from '@/share-branding/SubtopicNotesPage';
import { loadSubtopicNotesData, SubtopicNotesViewData } from '@/share-branding/subtopicNotesData';
import { useBrand, BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { skillUpConfig } from '@/share-branding/brandConfig';

function SubtopicNotesPageContent() {
  const brand = useBrand();
  const [data, setData] = useState<SubtopicNotesViewData | null>(null);

  useEffect(() => {
    async function fetchData() {
      const result = await loadSubtopicNotesData(brand);
      setData(result);
    }
    fetchData();
  }, [brand]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200" style={{ borderTopColor: brand.primaryColor }}></div>
      </div>
    );
  }

  return <SubtopicNotesPage data={data} />;
}

export default function SubtopicNotesDemoPage() {
  return (
    <BrandProvider brand={skillUpConfig}>
      <SubtopicNotesPageContent />
    </BrandProvider>
  );
}
