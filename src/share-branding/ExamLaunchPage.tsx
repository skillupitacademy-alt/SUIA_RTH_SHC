'use client';

import React from 'react';
import { BrandConfig } from './brandConfig';
import { BrandProvider } from './PostLandingPage/app/context/BrandContext';
import { LaunchEvaluation } from './ExamLaunch/components/LaunchEvaluation';

export default function ExamLaunchPage({ config }: { config: BrandConfig }) {
  // Wraps the massive 7-step layout inside the BrandProvider (Pattern B constraint)
  return (
    <BrandProvider brand={config}>
      <LaunchEvaluation />
    </BrandProvider>
  );
}
