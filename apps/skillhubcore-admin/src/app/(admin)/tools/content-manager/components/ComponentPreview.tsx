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

// Visual Components
import { VisualExplanationContent } from '@/share-branding/TutorialEngine/components/notes/VisualExplanationContent';

import { SectionType } from './types';

interface ComponentPreviewProps {
  section: SectionType;
  subsection: string;
  data: any;
}

export function ComponentPreview({ section, subsection, data }: ComponentPreviewProps) {
  if (!data) return <div className="p-4 text-center text-slate-500">No data available for preview. Please parse valid JSON first.</div>;

  // We map the section and subsection to the corresponding UI components
  // This replicates what happens in realtutorialhub-web's mapping logic.
  
  if (section === 'notes') {
    switch (subsection) {
      case 'summaryCard':
        return <NotesSummaryCard {...data} />;
      case 'practiceCard':
        return <NotesPracticeCard {...data} />;
      case 'warningFaq':
        return <NotesWarningFaq {...data} />;
      case 'definitionBlock':
        return <NotesDefinitionBlock {...data} />;
      case 'cheatSheetSVG':
      case 'diagrammaticBreakdown':
        return <NotesCheatSheet {...data} />;
      case 'syntaxBlock':
      case 'lineByLineExplanation':
        return <NotesSyntaxBlock {...data} />;
      case 'examplePanel':
        return <NotesExamplePanel {...data} />;
      case 'conceptMemoryMap':
      case 'mentalModelVisualization':
        return <NotesConceptMemoryMap {...data} />;
      case 'summaryHeroInfographic':
      case 'summaryHeroSvg':
        return <NotesHeroInfographic {...data} />;
      default:
        // If it's a full section block, or we don't have a specific mapped component preview here:
        return (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-500">Preview for {subsection || 'Whole Section'} not explicitly mapped yet. Verify the JSON visually.</p>
            <pre className="text-xs mt-2 overflow-auto max-h-[500px]">{JSON.stringify(data, null, 2)}</pre>
          </div>
        );
    }
  }

  if (section === 'visual') {
    return (
       <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Previewing Visual Section</p>
          <pre className="text-xs mt-2 overflow-auto max-h-[500px]">{JSON.stringify(data, null, 2)}</pre>
       </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <p className="text-sm text-slate-500">Live preview not currently available for this section ({section}).</p>
    </div>
  );
}
