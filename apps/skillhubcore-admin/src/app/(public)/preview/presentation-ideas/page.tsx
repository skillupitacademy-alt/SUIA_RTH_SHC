'use client';

import React from 'react';
import ClientShell from '@/app/(admin)/ClientShell';
import PresentationIdeasPage from '@/app/(admin)/content-intelligence/presentation-ideas/page';

export default function UnprotectedPresentationIdeasPreviewPage() {
  return (
    <ClientShell>
      <PresentationIdeasPage />
    </ClientShell>
  );
}
