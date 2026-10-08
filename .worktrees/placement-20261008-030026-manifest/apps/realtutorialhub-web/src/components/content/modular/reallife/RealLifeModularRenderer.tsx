'use client';

import { type TutorialContentJSON } from '@quiz/types';
import React from 'react';

import { RealWorldHero } from './RealWorldHero';
import { IndustryStandardPanel } from './IndustryStandardPanel';
import { CaseStudyCard } from './CaseStudyCard';
import { ExpertInsight } from './ExpertInsight';
import { ComparisonTable } from './ComparisonTable';
import { ProTipsPanel } from './ProTipsPanel';
import { FutureTrends } from './FutureTrends';
import { RealLifeSummary } from './RealLifeSummary';
import { getLayoutStyle, pickSection, pickString, toRecord } from '../utils';

interface RealLifeModularRendererProps {
  data: NonNullable<TutorialContentJSON['real_life']>;
  themeColor: string;
}

export function RealLifeModularRenderer({ data, themeColor }: RealLifeModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  const m = toRecord(data);

  // Map Schema Keys
  const heroData = pickSection(m, ['context_intro_card', 'industry_scenario']);
  const industryData = pickSection(m, ['industry_example_card', 'concept_mapping', 'conceptMapping', 'industryUseCase']);
  const caseStudyData = pickSection(m, ['career_use_case_grid', 'interactive_case_study', 'domain_scenarios', 'domainScenarios']);
  const insightData = pickSection(m, ['problem_solution_panel', 'ExpertInsight', 'problemSolutionContext']);
  const comparisonData = pickSection(m, ['workflow_renderer', 'ComparisonTable', 'businessApplication']);
  const tipsData = pickSection(m, ['decision_framework_card', 'pro_execution_tips', 'proTipsPanel']);
  const trendsData = pickSection(m, ['mistake_prevention_block', 'career_relevance', 'careerRelevance']);
  const summaryData = pickSection(m, ['practical_summary_card', 'real_life_summary', 'practical_recap', 'practicalRecap']);

    // Dynamic Layout Support
  const layoutStyle = getLayoutStyle(m);
  const spacing = pickString(m, 'spacing', '2rem');

return (
    <div className="flex flex-col" style={{ gap: spacing, ...layoutStyle }}>
      {heroData && <RealWorldHero data={heroData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {industryData && <IndustryStandardPanel data={industryData} themeColor={themeColor} />}
        {caseStudyData && <CaseStudyCard data={caseStudyData} themeColor={themeColor} />}
      </div>

      {comparisonData && <ComparisonTable data={comparisonData} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {insightData && <ExpertInsight data={insightData} />}
        </div>
        <div className="flex flex-col gap-6">
          {tipsData && <ProTipsPanel data={tipsData} />}
          {trendsData && <FutureTrends data={trendsData} />}
        </div>
      </div>

      {summaryData && <RealLifeSummary data={summaryData} />}
    </div>
  );
}
