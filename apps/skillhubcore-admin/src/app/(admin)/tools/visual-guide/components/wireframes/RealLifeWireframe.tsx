/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';


interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const RealLifeWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'real_life') return null;

  return (
    <div 
      id="wireframe-real_life"
      onClick={() => handleSectionChange('real_life')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'real_life' 
          ? 'border-blue-500 bg-white ring-4 ring-blue-500/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'real_life' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        4. REAL LIFE
      </div>

      {/* conceptMapping */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'real_life' && selectedSubsectionId === 'conceptMapping' 
            ? 'border-blue-500 bg-blue-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-40 rounded bg-slate-350 mb-2"></div>
        <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Connecting definitions to real software libraries</div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Concept Mapping (conceptMapping)</span>
      </div>

      {/* industryUseCase */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'real_life' && selectedSubsectionId === 'industryUseCase' 
            ? 'border-blue-500 bg-blue-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-300 mb-2"></div>
        <div className="h-20 bg-slate-250 border border-slate-200 rounded flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-400">Workflow SVG (industryWorkflow.image)</span>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Industry Use Case (industryUseCase)</span>
      </div>

      {/* dailyLifeExample */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'real_life' && selectedSubsectionId === 'dailyLifeExample' 
            ? 'border-blue-500 bg-blue-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Developer day-to-day log simulation</div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Daily Life Example (dailyLifeExample)</span>
      </div>

      {/* careerRelevance & businessApplication Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* careerRelevance */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'real_life' && selectedSubsectionId === 'careerRelevance' 
              ? 'border-blue-500 bg-blue-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-250 mb-2"></div>
          <div className="flex gap-2">
            <span className="bg-white border border-slate-200 text-slate-600 text-[9px] font-bold px-2 py-1 rounded">Backend</span>
            <span className="bg-white border border-slate-200 text-slate-600 text-[9px] font-bold px-2 py-1 rounded">DevOps</span>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Career Relevance (careerRelevance)</span>
        </div>

        {/* businessApplication */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'real_life' && selectedSubsectionId === 'businessApplication' 
              ? 'border-blue-500 bg-blue-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500 font-sans">ROI / Operations impact SVG</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Business Case (businessApplication)</span>
        </div>
      </div>

      {/* problemSolutionContext */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'real_life' && selectedSubsectionId === 'problemSolutionContext' 
            ? 'border-blue-500 bg-blue-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-10 bg-slate-250 border border-slate-200 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Operational problems statement</div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Problem & Solution (problemSolutionContext)</span>
      </div>

      {/* domainScenarios & practicalRecap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* domainScenarios */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'real_life' && selectedSubsectionId === 'domainScenarios' 
              ? 'border-blue-500 bg-blue-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Healthcare Scenarios</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Domain Scenarios (domainScenarios)</span>
        </div>

        {/* practicalRecap */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'real_life' && selectedSubsectionId === 'practicalRecap' 
              ? 'border-blue-500 bg-blue-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Practical Recap Timeline SVG</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Practical Recap (practicalRecap)</span>
        </div>
      </div>
    </div>
  );
};
