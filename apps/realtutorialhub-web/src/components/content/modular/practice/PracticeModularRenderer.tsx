'use client';

import { type TutorialContentJSON } from '@quiz/types';
import React from 'react';

import { PracticeHero } from './PracticeHero';
import { PracticeTasks } from './PracticeTasks';
import { InteractiveExercises } from './InteractiveExercises';
import { CodeSandboxPanel } from './CodeSandboxPanel';
import { KnowledgeCheck } from './KnowledgeCheck';
import { TroubleshootingGuide } from './TroubleshootingGuide';
import { RewardBadge } from './RewardBadge';
import { HelpfulTips } from './HelpfulTips';
import { getLayoutStyle, pickSection, pickString, toRecord } from '../utils';

interface PracticeModularRendererProps {
  data: NonNullable<TutorialContentJSON['practice']>;
  themeColor: string;
}

export function PracticeModularRenderer({ data, themeColor }: PracticeModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  const m = toRecord(data);

  // Map Schema Keys
  const heroData = pickSection(m, ['assessment_intro_card', 'testOverview']);
  const taskData = pickSection(m, ['mcq_block', 'theoryQuestions']);
  const exerciseData = pickSection(m, ['scenario_test_panel', 'practicalQuestions']);
  const flowData = pickSection(m, ['adaptive_test_flow']);
  const feedbackData = pickSection(m, ['feedback_explanation_card']);
  const analysisData = pickSection(m, ['mistake_analysis_panel']);
  const scoreData = pickSection(m, ['score_dashboard', 'testResults']);
  const pathData = pickSection(m, ['remediation_path_panel']);

    // Dynamic Layout Support
  const layoutStyle = getLayoutStyle(m);
  const spacing = pickString(m, 'spacing', '2rem');

return (
    <div className="flex flex-col" style={{ gap: spacing, ...layoutStyle }}>
      {heroData && <PracticeHero data={heroData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {taskData && <PracticeTasks data={taskData} />}
        <div className="flex flex-col gap-6">
          {exerciseData && <InteractiveExercises data={exerciseData} />}
          {flowData && <CodeSandboxPanel data={flowData} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {feedbackData && <KnowledgeCheck data={feedbackData} />}
        </div>
        <div className="flex flex-col gap-6">
          {analysisData && <TroubleshootingGuide data={analysisData} />}
          {pathData && <HelpfulTips data={pathData} />}
        </div>
      </div>

      {scoreData && <RewardBadge data={scoreData} />}
    </div>
  );
}
