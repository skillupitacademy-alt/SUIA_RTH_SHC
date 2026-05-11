'use client';

import React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { VisualHero } from './VisualHero';
import { MainDiagram } from './MainDiagram';
import { InteractiveHotspots } from './InteractiveHotspots';
import { StateTransitionPanel } from './StateTransitionPanel';
import { ComparisonSlider } from './ComparisonSlider';
import { VisualGlossary } from './VisualGlossary';
import { DownloadResources } from './DownloadResources';
import { VisualTakeaways } from './VisualTakeaways';

interface VisualModularRendererProps {
  data: any;
  themeColor: string;
}

export function VisualModularRenderer({ data, themeColor }: VisualModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  // Map Schema Keys to Component Props
  const heroData = data.visual_intro_card || data.visualOverview || data.conceptVisualIntro;
  const diagramData = data.diagram_panel || data.conceptDiagram || data.diagrammaticBreakdown || data.architectureDiagram;
  const flowData = data.flow_sequence_panel || data.flowchartExplanation || data.stepByStepVisualFlow || data.timelineVisualization;
  const comparisonData = data.comparison_diagram || data.comparisonChart || data.comparativeVisualization;
  const canvasData = data.mental_model_canvas || data.mentalModelVisualization || data.mindMap;
  const realWorldData = data.real_world_visual_block || data.realWorldVisualMapping;
  const confusionData = data.confusion_resolution_diagram || data.commonConfusionVisualization;
  const summaryData = data.summary_infographic || data.visualSummary;

    // Dynamic Layout Support
  const layoutStyle = data.layout || {};
  const spacing = data.spacing || "2rem";

return (
    <div className="flex flex-col" style={{ gap: spacing, padding: layoutStyle.padding, margin: layoutStyle.margin, ...layoutStyle.customStyles }}>
      {heroData && <VisualHero data={heroData} themeColor={themeColor} />}
      
      <div className="flex flex-col gap-6">
        {diagramData && <MainDiagram data={diagramData} themeColor={themeColor} />}
        {flowData && <InteractiveHotspots data={flowData} themeColor={themeColor} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {comparisonData && <ComparisonSlider data={comparisonData} themeColor={themeColor} />}
        {canvasData && <StateTransitionPanel data={canvasData} themeColor={themeColor} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {realWorldData && <VisualGlossary data={realWorldData} themeColor={themeColor} />}
        </div>
        <div className="flex flex-col gap-6">
          {confusionData && <VisualTakeaways data={confusionData} themeColor={themeColor} />}
          {summaryData && <DownloadResources data={summaryData} themeColor={themeColor} />}
        </div>
      </div>
    </div>
  );
}
