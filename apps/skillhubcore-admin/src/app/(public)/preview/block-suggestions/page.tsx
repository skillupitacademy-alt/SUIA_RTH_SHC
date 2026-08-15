'use client';

import React from 'react';
import ClientShell from '@/app/(admin)/ClientShell';
import BlockSuggestionsPage from '@/app/(admin)/content-intelligence/block-suggestions/page';

export default function UnprotectedBlockSuggestionsPreviewPage() {
  return (
    <ClientShell>
      <BlockSuggestionsPage />
    </ClientShell>
  );
}
