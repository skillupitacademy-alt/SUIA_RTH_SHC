import React from 'react';
import { OverviewWireframe } from './wireframes/OverviewWireframe';
import { NotesWireframe } from './wireframes/NotesWireframe';
import { LaymanWireframe } from './wireframes/LaymanWireframe';
import { RealLifeWireframe } from './wireframes/RealLifeWireframe';
import { TechnicalWireframe } from './wireframes/TechnicalWireframe';
import { CodeWireframe } from './wireframes/CodeWireframe';
import { VisualWireframe } from './wireframes/VisualWireframe';
import { PracticeWireframe } from './wireframes/PracticeWireframe';
import { AssignmentWireframe } from './wireframes/AssignmentWireframe';
import { ProjectWireframe } from './wireframes/ProjectWireframe';
import { InterviewWireframe } from './wireframes/InterviewWireframe';
import { QuizWireframe } from './wireframes/QuizWireframe';
import { SummaryWireframe } from './wireframes/SummaryWireframe';
import { AiTutorWireframe } from './wireframes/AiTutorWireframe';

interface WireframeRendererProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
  wireframeCanvasRef: React.RefObject<HTMLDivElement | null>;
}

export const WireframeRenderer: React.FC<WireframeRendererProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
  wireframeCanvasRef
}) => {
  return (
    <div 
      ref={wireframeCanvasRef}
      className="flex-1 overflow-y-auto p-6 bg-slate-100/50 space-y-8 custom-scrollbar scroll-smooth"
    >
      <OverviewWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <NotesWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <LaymanWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <RealLifeWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <TechnicalWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <CodeWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <VisualWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <PracticeWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <AssignmentWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <ProjectWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <InterviewWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <QuizWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <SummaryWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
      <AiTutorWireframe
        selectedSectionId={selectedSectionId}
        selectedSubsectionId={selectedSubsectionId}
        highlightedElement={highlightedElement}
        handleSectionChange={handleSectionChange}
      />
    </div>
  );
};
