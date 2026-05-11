'use client';

import React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { RealWorldHero } from './RealWorldHero';
import { IndustryStandardPanel } from './IndustryStandardPanel';
import { CaseStudyCard } from './CaseStudyCard';
import { ExpertInsight } from './ExpertInsight';
import { ComparisonTable } from './ComparisonTable';
import { ProTipsPanel } from './ProTipsPanel';
import { FutureTrends } from './FutureTrends';
import { RealLifeSummary } from './RealLifeSummary';

interface RealLifeModularRendererProps {
  data: any;
  themeColor: string;
}

export function RealLifeModularRenderer({ data, themeColor }: RealLifeModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  // Map Schema Keys
  const heroData = data.context_intro_card || data.industry_scenario;
  const industryData = data.industry_example_card || data.concept_mapping || data.conceptMapping || data.industryUseCase;
  const caseStudyData = data.career_use_case_grid || data.interactive_case_study || data.domain_scenarios || data.domainScenarios;
  const insightData = data.problem_solution_panel || data.ExpertInsight || data.problemSolutionContext;
  const comparisonData = data.workflow_renderer || data.ComparisonTable || data.businessApplication;
  const tipsData = data.decision_framework_card || data.pro_execution_tips || data.proTipsPanel;
  const trendsData = data.mistake_prevention_block || data.career_relevance || data.careerRelevance;
  const summaryData = data.practical_summary_card || data.real_life_summary || data.practical_recap || data.practicalRecap;

    // Dynamic Layout Support
  const layoutStyle = data.layout || {};
  const spacing = data.spacing || "2rem";

return (
    <div className="flex flex-col" style={{ gap: spacing, padding: layoutStyle.padding, margin: layoutStyle.margin, ...layoutStyle.customStyles }}>
      {heroData && <RealWorldHero data={heroData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {industryData && <IndustryStandardPanel data={industryData} themeColor={themeColor} />}
        {caseStudyData && <CaseStudyCard data={caseStudyData} themeColor={themeColor} />}
      </div>

      {comparisonData && <ComparisonTable data={comparisonData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {insightData && <ExpertInsight data={insightData} themeColor={themeColor} />}
        </div>
        <div className="flex flex-col gap-6">
          {tipsData && <ProTipsPanel data={tipsData} themeColor={themeColor} />}
          {trendsData && <FutureTrends data={trendsData} themeColor={themeColor} />}
        </div>
      </div>

      {summaryData && <RealLifeSummary data={summaryData} themeColor={themeColor} />}
    </div>
  );
}
