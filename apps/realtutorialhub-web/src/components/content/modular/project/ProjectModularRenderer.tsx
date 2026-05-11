'use client';

import React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { ProjectHero } from './ProjectHero';
import { ProjectSpecs } from './ProjectSpecs';
import { ImplementationGuide } from './ImplementationGuide';
import { PortfolioStrategy } from './PortfolioStrategy';
import { TechStackPanel } from './TechStackPanel';
import { ChallengeVariation } from './ChallengeVariation';
import { SuccessChecklist } from './SuccessChecklist';
import { InspirationGallery } from './InspirationGallery';

interface ProjectModularRendererProps {
  data: any;
  themeColor: string;
}

export function ProjectModularRenderer({ data, themeColor }: ProjectModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  // Map Schema Keys (Sync with ProjectModularSchema)
  const heroData = data.project_vision_card || data.projectOverview;
  const objectiveData = data.business_objective_panel;
  const specsData = data.architecture_master_block || data.module_breakdown_grid || data.featureRequirements;
  const guideData = data.development_workflow_panel || data.implementationGuide;
  const strategyData = data.portfolio_strategy || data.portfolioStrategy || data.deployment_scaling_panel;
  const challengeData = data.risk_management_panel || data.challenge_variation || data.challengeVariation;
  const checklistData = data.success_checklist || data.successChecklist;
  const summaryData = data.project_summary_card || data.projectSummaryCard;

    // Dynamic Layout Support
  const layoutStyle = data.layout || {};
  const spacing = data.spacing || "2rem";

return (
    <div className="flex flex-col" style={{ gap: spacing, padding: layoutStyle.padding, margin: layoutStyle.margin, ...layoutStyle.customStyles }}>
      {heroData && <ProjectHero data={heroData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {specsData && <ProjectSpecs data={specsData} themeColor={themeColor} />}
        {objectiveData && <TechStackPanel data={objectiveData} themeColor={themeColor} />}
      </div>

      {guideData && <ImplementationGuide data={guideData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strategyData && <PortfolioStrategy data={strategyData} themeColor={themeColor} />}
        {challengeData && <ChallengeVariation data={challengeData} themeColor={themeColor} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {checklistData && <SuccessChecklist data={checklistData} themeColor={themeColor} />}
        </div>
        <div className="flex flex-col gap-6">
          {summaryData && <InspirationGallery data={summaryData} themeColor={themeColor} />}
        </div>
      </div>
    </div>
  );
}
