'use client';

import React from 'react';
import ClientShell from '@/app/(admin)/ClientShell';
import ContentAnalysisPage from '@/app/(admin)/content-intelligence/analysis/page';

export default function UnprotectedAnalysisPreviewPage() {
  return (
    <ClientShell>
      <ContentAnalysisPage />
    </ClientShell>
  );
}
