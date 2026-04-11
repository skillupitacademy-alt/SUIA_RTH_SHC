'use client';

import { BrandConfig } from './brandConfig';
import { BrandProvider } from './PostLandingPage/app/context/BrandContext';
import { LaunchEvaluation } from './ExamLaunch/components/LaunchEvaluation';
import { LaunchDataProvider } from './ExamLaunch/components/LaunchDataContext';
import { LaunchViewData } from './launchExamPageData';

export default function ExamLaunchConfigurationPage({ config, data }: { config: BrandConfig; data: LaunchViewData }) {
  return (
    <BrandProvider brand={config}>
      <LaunchDataProvider value={data}>
        <LaunchEvaluation />
      </LaunchDataProvider>
    </BrandProvider>
  );
}
