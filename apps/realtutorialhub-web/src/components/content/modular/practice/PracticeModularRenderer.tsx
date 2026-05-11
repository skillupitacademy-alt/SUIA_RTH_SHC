'use client';

import React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { PracticeHero } from './PracticeHero';
import { PracticeTasks } from './PracticeTasks';
import { InteractiveExercises } from './InteractiveExercises';
import { CodeSandboxPanel } from './CodeSandboxPanel';
import { KnowledgeCheck } from './KnowledgeCheck';
import { TroubleshootingGuide } from './TroubleshootingGuide';
import { RewardBadge } from './RewardBadge';
import { HelpfulTips } from './HelpfulTips';

interface PracticeModularRendererProps {
  data: any;
  themeColor: string;
}

export function PracticeModularRenderer({ data, themeColor }: PracticeModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  // Map Schema Keys
  const heroData = data.assessment_intro_card || data.testOverview;
  const taskData = data.mcq_block || data.theoryQuestions;
  const exerciseData = data.scenario_test_panel || data.practicalQuestions;
  const flowData = data.adaptive_test_flow;
  const feedbackData = data.feedback_explanation_card;
  const analysisData = data.mistake_analysis_panel;
  const scoreData = data.score_dashboard || data.testResults;
  const pathData = data.remediation_path_panel;

    // Dynamic Layout Support
  const layoutStyle = data.layout || {};
  const spacing = data.spacing || "2rem";

return (
    <div className="flex flex-col" style={{ gap: spacing, padding: layoutStyle.padding, margin: layoutStyle.margin, ...layoutStyle.customStyles }}>
      {heroData && <PracticeHero data={heroData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {taskData && <PracticeTasks data={taskData} themeColor={themeColor} />}
        <div className="flex flex-col gap-6">
          {exerciseData && <InteractiveExercises data={exerciseData} themeColor={themeColor} />}
          {flowData && <CodeSandboxPanel data={flowData} themeColor={themeColor} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {feedbackData && <KnowledgeCheck data={feedbackData} themeColor={themeColor} />}
        </div>
        <div className="flex flex-col gap-6">
          {analysisData && <TroubleshootingGuide data={analysisData} themeColor={themeColor} />}
          {pathData && <HelpfulTips data={pathData} themeColor={themeColor} />}
        </div>
      </div>

      {scoreData && <RewardBadge data={scoreData} themeColor={themeColor} />}
    </div>
  );
}
