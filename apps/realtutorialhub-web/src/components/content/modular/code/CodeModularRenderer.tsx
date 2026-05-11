'use client';

import React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { CodeWorkspace } from './CodeWorkspace';
import { StepByStepWalkthrough } from './StepByStepWalkthrough';
import { CommonMistakes } from './CommonMistakes';
import { BestPractices } from './BestPractices';
import { OutputPreview } from './OutputPreview';
import { CodeProblemIntro } from './CodeProblemIntro';
import { HintPanel } from './HintPanel';
import { SolutionPanel } from './SolutionPanel';

interface CodeModularRendererProps {
  data: any;
  themeColor: string;
}

export function CodeModularRenderer({ data, themeColor }: CodeModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  // Map Schema Keys
  const introData = data.problem_context_card || data.problem_intro_workspace || data.problemContextCard || data.problemIntroWorkspace || data.problemContext;
  const workspaceData = data.code_block || data.primary_code_workspace || data.codeBlock || data.primaryCodeWorkspace || data.basicCodeExample;
  const walkthroughData = data.annotated_code_panel || data.guided_code_breakdown || data.annotatedCodePanel || data.guidedCodeBreakdown || data.lineByLineExplanation;
  const outputData = data.output_preview || data.live_execution_preview || data.outputPreview || data.liveExecutionPreview || data.outputDemonstration;
  const bestPracticeData = data.optimized_code_block || data.best_practice_code_workspace || data.optimizedCodeBlock || data.bestPracticeCodeWorkspace || data.realWorldImplementation;
  const mistakeData = data.error_prevention_block || data.mistake_prevention_dashboard || data.errorPreventionBlock || data.mistakePreventionDashboard || data.commonMistakes;
  const usageData = data.project_usage_panel || data.projectUsagePanel;
  const summaryData = data.code_summary_card || data.final_implementation_summary || data.codeSummaryCard || data.finalImplementationSummary || data.codeSummary || data.developer_revision_summary;

    // Dynamic Layout Support
  const layoutStyle = data.layout || {};
  const spacing = data.spacing || "2rem";

return (
    <div className="flex flex-col" style={{ gap: spacing, padding: layoutStyle.padding, margin: layoutStyle.margin, ...layoutStyle.customStyles }}>
      {introData && <CodeProblemIntro data={introData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workspaceData && <CodeWorkspace data={workspaceData} themeColor={themeColor} />}
        {outputData && <OutputPreview data={outputData} themeColor={themeColor} />}
      </div>

      {walkthroughData && <StepByStepWalkthrough data={walkthroughData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bestPracticeData && <BestPractices data={bestPracticeData} themeColor={themeColor} />}
        {mistakeData && <CommonMistakes data={mistakeData} themeColor={themeColor} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {usageData && <HintPanel data={usageData} themeColor={themeColor} />}
        {summaryData && <SolutionPanel data={summaryData} themeColor={themeColor} />}
      </div>
    </div>
  );
}
