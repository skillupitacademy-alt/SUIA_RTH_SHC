'use client';

import React from 'react';
import ClientShell from '@/app/(admin)/ClientShell';
import RawContentImportPage from '@/app/(admin)/content-intelligence/import/page';

export default function UnprotectedRawImportPreviewPage() {
  return (
    <ClientShell>
      <RawContentImportPage />
    </ClientShell>
  );
}
