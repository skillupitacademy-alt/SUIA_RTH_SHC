'use client';

import React, { useEffect, useState } from 'react';
import { SubtopicViewPage } from '@/share-branding/SubtopicViewPage';
import { loadTutorialData, SubtopicViewData } from '@/share-branding/subtopicPageData';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';

export default function SubtopicDemoPage() {
  const brand = useBrand();
  const [data, setData] = useState<SubtopicViewData | null>(null);

  useEffect(() => {
    async function fetchData() {
      const result = await loadTutorialData(brand);
      setData(result);
    }
    fetchData();
  }, [brand]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary" style={{ borderTopColor: brand.primaryColor }}></div>
      </div>
    );
  }

  return <SubtopicViewPage data={data} />;
}
