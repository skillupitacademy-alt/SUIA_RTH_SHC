import React from 'react';

// Notes Components
import { NotesSummaryCard } from '@/share-branding/TutorialEngine/components/notes/NotesSummaryCard';
import { NotesSyntaxBlock } from '@/share-branding/TutorialEngine/components/notes/NotesSyntaxBlock';
import { NotesPracticeCard } from '@/share-branding/TutorialEngine/components/notes/NotesPracticeCard';
import { NotesWarningFaq } from '@/share-branding/TutorialEngine/components/notes/NotesWarningFaq';
import { NotesDefinitionBlock } from '@/share-branding/TutorialEngine/components/notes/NotesDefinitionBlock';
import { NotesCheatSheet } from '@/share-branding/TutorialEngine/components/notes/NotesCheatSheet';
import { NotesExamplePanel } from '@/share-branding/TutorialEngine/components/notes/NotesExamplePanel';
import { NotesConceptMemoryMap } from '@/share-branding/TutorialEngine/components/notes/NotesConceptMemoryMap';
import { NotesHeroInfographic } from '@/share-branding/TutorialEngine/components/notes/NotesHeroInfographic';

// Main Content Components for Full Section Preview
import { NotesMainContent } from '@/share-branding/TutorialEngine/components/notes/NotesMainContent';
import { LaymanMainContent } from '@/share-branding/TutorialEngine/components/layman/LaymanMainContent';
import { CodeExampleContent } from '@/share-branding/TutorialEngine/components/notes/CodeExampleContent';
import { TechnicalDeepDiveContent } from '@/share-branding/TutorialEngine/components/notes/TechnicalDeepDiveContent';
import { PracticeTestContent } from '@/share-branding/TutorialEngine/components/notes/PracticeTestContent';
import { VisualExplanationContent } from '@/share-branding/TutorialEngine/components/notes/VisualExplanationContent';

import { SectionType } from './types';

interface ComponentPreviewProps {
  section: SectionType;
  subsection: string;
  data: unknown;
}

export function ComponentPreview({ section, subsection, data }: ComponentPreviewProps) {
  if (!data) return <div className="p-4 text-center text-slate-500">No data available for preview. Please parse valid JSON first.</div>;

  // Safely extract the target data payload to prevent React component crash
  let targetData: unknown = data;
  if (data && section && typeof data === 'object' && section in data) {
    targetData = (data as Record<string, unknown>)[section];
  }
  
  if (subsection && targetData && typeof targetData === 'object' && subsection in targetData) {
    targetData = (targetData as Record<string, unknown>)[subsection];
  }

  // 1. Handle Full Section Previews (when subsection is empty)
  if (!subsection) {
    switch (section) {
      case 'notes':
        return <NotesMainContent data={targetData as React.ComponentProps<typeof NotesMainContent>['data']} isStandalone={false} />;
      case 'layman':
        return <LaymanMainContent data={targetData as React.ComponentProps<typeof LaymanMainContent>['data']} />;
      case 'code':
        return <CodeExampleContent data={targetData as React.ComponentProps<typeof CodeExampleContent>['data']} />;
      case 'technical':
        return <TechnicalDeepDiveContent data={targetData as React.ComponentProps<typeof TechnicalDeepDiveContent>['data']} />;
      case 'practice':
        return <PracticeTestContent data={targetData as React.ComponentProps<typeof PracticeTestContent>['data']} />;
      case 'visual':
        return <VisualExplanationContent data={targetData as React.ComponentProps<typeof VisualExplanationContent>['data']} />;
      // Fall through to default for unmapped sections
    }
  }

  // 2. Handle Specific Subsection Previews
  if (section === 'notes') {
    switch (subsection) {
      case 'summaryCard':
        return <NotesSummaryCard {...(targetData as React.ComponentProps<typeof NotesSummaryCard>)} />;
      case 'practiceCard':
        return <NotesPracticeCard {...(targetData as React.ComponentProps<typeof NotesPracticeCard>)} />;
      case 'warningFaq':
        return <NotesWarningFaq {...(targetData as React.ComponentProps<typeof NotesWarningFaq>)} />;
      case 'definitionBlock':
        return <NotesDefinitionBlock {...(targetData as React.ComponentProps<typeof NotesDefinitionBlock>)} />;
      case 'cheatSheetSVG':
      case 'diagrammaticBreakdown':
        return <NotesCheatSheet {...(targetData as React.ComponentProps<typeof NotesCheatSheet>)} />;
      case 'syntaxBlock':
      case 'lineByLineExplanation':
        return <NotesSyntaxBlock {...(targetData as React.ComponentProps<typeof NotesSyntaxBlock>)} />;
      case 'examplePanel':
        return <NotesExamplePanel {...(targetData as React.ComponentProps<typeof NotesExamplePanel>)} />;
      case 'conceptMemoryMap':
      case 'mentalModelVisualization':
        return <NotesConceptMemoryMap {...(targetData as React.ComponentProps<typeof NotesConceptMemoryMap>)} />;
      case 'summaryHeroInfographic':
      case 'summaryHeroSvg':
        return <NotesHeroInfographic {...(targetData as React.ComponentProps<typeof NotesHeroInfographic>)} />;
    }
  }

  // 3. Default fallback for unmapped components
  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <p className="text-sm text-slate-500">
        Preview for {subsection ? `subsection "${subsection}"` : `section "${section}"`} not explicitly mapped yet. Verify the JSON visually.
      </p>
      <pre className="text-xs mt-2 overflow-auto max-h-[500px]">{JSON.stringify(targetData, null, 2)}</pre>
    </div>
  );
}
