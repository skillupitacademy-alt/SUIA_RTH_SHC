/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const VisualWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'visual') return null;

  return (
    <div 
      id="wireframe-visual"
      onClick={() => handleSectionChange('visual')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'visual' 
          ? 'border-teal-500 bg-white ring-4 ring-teal-500/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'visual' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-teal-50 border border-teal-100 text-teal-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        7. SYSTEM DIAGRAM
      </div>

      {/* conceptVisualIntro */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'visual' && selectedSubsectionId === 'conceptVisualIntro' 
            ? 'border-teal-500 bg-teal-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-2 bg-slate-200 w-full rounded"></div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Visual Intro (conceptVisualIntro)</span>
      </div>

      {/* Diagrammatic breakdown */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'visual' && selectedSubsectionId === 'diagrammaticBreakdown' 
            ? 'border-teal-500 bg-teal-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-48 rounded bg-slate-350 mb-3"></div>
        <div className="h-28 rounded bg-slate-200 border border-slate-300 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-400">Full Concept Visualization SVG (image)</span>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Ecosystem Diagram (diagrammaticBreakdown)</span>
      </div>

      {/* stepByStepVisualFlow & comparativeVisualization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* stepByStepVisualFlow */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'visual' && selectedSubsectionId === 'stepByStepVisualFlow' 
              ? 'border-teal-500 bg-teal-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-550 font-bold">Step Flowchart SVG</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Process Flow (stepByStepVisualFlow)</span>
        </div>

        {/* comparativeVisualization */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'visual' && selectedSubsectionId === 'comparativeVisualization' 
              ? 'border-teal-500 bg-teal-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-550 font-bold">Comparison Matrix SVG</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Comparison Matrix (comparativeVisualization)</span>
        </div>
      </div>

      {/* mentalModelVisualization & realWorldVisualMapping Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* mentalModelVisualization */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'visual' && selectedSubsectionId === 'mentalModelVisualization' 
              ? 'border-teal-500 bg-teal-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-550 font-bold">Layman translation graph SVG</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Mental Model (mentalModelVisualization)</span>
        </div>

        {/* realWorldVisualMapping */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'visual' && selectedSubsectionId === 'realWorldVisualMapping' 
              ? 'border-teal-500 bg-teal-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-550 font-bold">Pipeline deployment SVG</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Deployment Map (realWorldVisualMapping)</span>
        </div>
      </div>

      {/* commonConfusionVisualization & visualSummary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* commonConfusionVisualization */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'visual' && selectedSubsectionId === 'commonConfusionVisualization' 
              ? 'border-teal-500 bg-teal-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-550 font-bold">State lifecycle graph SVG</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Confusion Graph (commonConfusionVisualization)</span>
        </div>

        {/* visualSummary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'visual' && selectedSubsectionId === 'visualSummary' 
              ? 'border-teal-500 bg-teal-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-550 font-bold">Infographic summary graph SVG</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Visual Summary (visualSummary)</span>
        </div>
      </div>
    </div>
  );
};
