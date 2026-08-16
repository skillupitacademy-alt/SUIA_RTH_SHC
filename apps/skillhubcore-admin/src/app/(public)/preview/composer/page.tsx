'use client';

import React from 'react';
import ClientShell from '@/app/(admin)/ClientShell';
import ComposerWorkspacePage from '@/app/(admin)/content-intelligence/composer/page';

export default function UnprotectedComposerPreviewPage() {
  return (
    <ClientShell>
      <ComposerWorkspacePage />
    </ClientShell>
  );
}
