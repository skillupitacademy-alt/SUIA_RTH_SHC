'use client';

import React from 'react';
import ClientShell from '@/app/(admin)/ClientShell';
import ReviewApprovePage from '@/app/(admin)/content-intelligence/review-approve/page';

export default function UnprotectedReviewApprovePreviewPage() {
  return (
    <ClientShell>
      <ReviewApprovePage />
    </ClientShell>
  );
}
