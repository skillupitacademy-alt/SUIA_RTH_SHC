'use client';

import { type TutorialContentJSON } from '@quiz/types';
import React from 'react';

import { CodeWorkspace } from './CodeWorkspace';
import { StepByStepWalkthrough } from './StepByStepWalkthrough';
import { CommonMistakes } from './CommonMistakes';
import { BestPractices } from './BestPractices';
import { OutputPreview } from './OutputPreview';
import { CodeProblemIntro } from './CodeProblemIntro';
import { HintPanel } from './HintPanel';
import { SolutionPanel } from './SolutionPanel';
import { getLayoutStyle, pickSection, pickString, toRecord } from '../utils';

interface CodeModularRendererProps {
  data: NonNullable<TutorialContentJSON['code']>;
  themeColor: string;
}

export function CodeModularRenderer({ data }: CodeModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  const m = toRecord(data);

  // Map Schema Keys (Support both modular and legacy formats)
  const introData = pickSection(m, ['problem_context_card', 'problem_intro_workspace', 'problemContextCard', 'problemIntroWorkspace', 'problemContext']);
  const workspaceData = pickSection(m, ['code_block', 'primary_code_workspace', 'codeBlock', 'primaryCodeWorkspace', 'basicCodeExample']);
  const walkthroughData = pickSection(m, ['annotated_code_panel', 'guided_code_breakdown', 'annotatedCodePanel', 'guidedCodeBreakdown', 'lineByLineExplanation']);
  const outputData = pickSection(m, ['output_preview', 'live_execution_preview', 'outputPreview', 'liveExecutionPreview', 'outputDemonstration']);
  const bestPracticeData = pickSection(m, ['optimized_code_block', 'best_practice_code_workspace', 'optimizedCodeBlock', 'bestPracticeCodeWorkspace', 'realWorldImplementation']);
  const mistakeData = pickSection(m, ['error_prevention_block', 'mistake_prevention_dashboard', 'errorPreventionBlock', 'mistakePreventionDashboard', 'commonMistakes']);
  const usageData = pickSection(m, ['project_usage_panel', 'projectUsagePanel']);
  const summaryData = pickSection(m, ['code_summary_card', 'final_implementation_summary', 'codeSummaryCard', 'finalImplementationSummary', 'codeSummary', 'developer_revision_summary']);

  // Dynamic Layout Support
  const layoutStyle = getLayoutStyle(m);
  const spacing = pickString(m, 'spacing', '2rem');

  return (
    <div className="flex flex-col" style={{ gap: spacing, ...layoutStyle }}>
      {introData && <CodeProblemIntro data={introData} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workspaceData && <CodeWorkspace data={workspaceData} />}
        {outputData && <OutputPreview data={outputData} />}
      </div>

      {walkthroughData && <StepByStepWalkthrough data={walkthroughData} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bestPracticeData && <BestPractices data={bestPracticeData} />}
        {mistakeData && <CommonMistakes data={mistakeData} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {usageData && <HintPanel data={usageData} />}
        {summaryData && <SolutionPanel data={summaryData} />}
      </div>
    </div>
  );
}
