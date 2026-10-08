'use client';

import { type TutorialContentJSON } from '@quiz/types';
import React from 'react';

import { ProjectHero } from './ProjectHero';
import { ProjectSpecs } from './ProjectSpecs';
import { ImplementationGuide } from './ImplementationGuide';
import { PortfolioStrategy } from './PortfolioStrategy';
import { TechStackPanel } from './TechStackPanel';
import { ChallengeVariation } from './ChallengeVariation';
import { SuccessChecklist } from './SuccessChecklist';
import { InspirationGallery } from './InspirationGallery';
import { getLayoutStyle, pickSection, pickString, toRecord } from '../utils';

interface ProjectModularRendererProps {
  data: NonNullable<TutorialContentJSON['project']>;
  themeColor: string;
}

export function ProjectModularRenderer({ data }: ProjectModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  const m = toRecord(data);

  // Map Schema Keys (Sync with ProjectModularSchema)
  const heroData = pickSection(m, ['project_vision_card', 'projectOverview']);
  const objectiveData = pickSection(m, ['business_objective_panel']);
  const specsData = pickSection(m, ['architecture_master_block', 'module_breakdown_grid', 'featureRequirements']);
  const guideData = pickSection(m, ['development_workflow_panel', 'implementationGuide']);
  const strategyData = pickSection(m, ['portfolio_strategy', 'portfolioStrategy', 'deployment_scaling_panel']);
  const challengeData = pickSection(m, ['risk_management_panel', 'challenge_variation', 'challengeVariation']);
  const checklistData = pickSection(m, ['success_checklist', 'successChecklist']);
  const summaryData = pickSection(m, ['project_summary_card', 'projectSummaryCard']);

    // Dynamic Layout Support
  const layoutStyle = getLayoutStyle(m);
  const spacing = pickString(m, 'spacing', '2rem');

return (
    <div className="flex flex-col" style={{ gap: spacing, ...layoutStyle }}>
      {heroData && <ProjectHero data={heroData} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {specsData && <ProjectSpecs data={specsData} />}
        {objectiveData && <TechStackPanel data={objectiveData} />}
      </div>

      {guideData && <ImplementationGuide data={guideData} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strategyData && <PortfolioStrategy data={strategyData} />}
        {challengeData && <ChallengeVariation data={challengeData} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {checklistData && <SuccessChecklist data={checklistData} />}
        </div>
        <div className="flex flex-col gap-6">
          {summaryData && <InspirationGallery data={summaryData} />}
        </div>
      </div>
    </div>
  );
}
