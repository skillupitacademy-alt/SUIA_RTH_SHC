import { type TutorialContentJSON } from '@quiz/types';
import { VisualHero } from './VisualHero';
import { MainDiagram } from './MainDiagram';
import { InteractiveHotspots } from './InteractiveHotspots';
import { StateTransitionPanel } from './StateTransitionPanel';
import { ComparisonSlider } from './ComparisonSlider';
import { VisualGlossary } from './VisualGlossary';
import { DownloadResources } from './DownloadResources';
import { VisualTakeaways } from './VisualTakeaways';
import { getLayoutStyle, pickSection, pickString, toRecord } from '../utils';

interface VisualModularRendererProps {
  data: NonNullable<TutorialContentJSON['visual']>;
  themeColor: string;
}

export function VisualModularRenderer({ data, themeColor }: VisualModularRendererProps) {
  if (!data) return null;

  const m = toRecord(data);

  // Map Schema Keys to Component Props (Types are derived from TutorialContentJSON['visual'])
  const heroData = pickSection(m, ['visual_intro_card', 'visualOverview', 'conceptVisualIntro']);
  const diagramData = pickSection(m, ['diagram_panel', 'conceptDiagram', 'diagrammaticBreakdown', 'architectureDiagram']);
  const flowData = pickSection(m, ['flow_sequence_panel', 'flowchartExplanation', 'stepByStepVisualFlow', 'timelineVisualization']);
  const comparisonData = pickSection(m, ['comparison_diagram', 'comparisonChart', 'comparativeVisualization']);
  const canvasData = pickSection(m, ['mental_model_canvas', 'mentalModelVisualization', 'mindMap']);
  const realWorldData = pickSection(m, ['real_world_visual_block', 'realWorldVisualMapping']);
  const confusionData = pickSection(m, ['confusion_resolution_diagram', 'commonConfusionVisualization']);
  const summaryData = pickSection(m, ['summary_infographic', 'visualSummary']);

  // Dynamic Layout Support
  const layoutStyle = getLayoutStyle(m);
  const spacing = pickString(m, 'spacing', '2rem');

return (
    <div className="flex flex-col" style={{ gap: spacing, ...layoutStyle }}>
      {heroData && <VisualHero data={heroData} themeColor={themeColor} />}
      
      <div className="flex flex-col gap-6">
        {diagramData && <MainDiagram data={diagramData} themeColor={themeColor} />}
        {flowData && <InteractiveHotspots data={flowData} themeColor={themeColor} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {comparisonData && <ComparisonSlider data={comparisonData} />}
        {canvasData && <StateTransitionPanel data={canvasData} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {realWorldData && <VisualGlossary data={realWorldData} />}
        </div>
        <div className="flex flex-col gap-6">
          {confusionData && <VisualTakeaways data={confusionData} />}
          {summaryData && <DownloadResources data={summaryData} />}
        </div>
      </div>
    </div>
  );
}
