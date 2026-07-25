/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const OverviewWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'overview') return null;

  return (
    <div 
      id="wireframe-overview"
      data-visual-guide-section="overview"
      onClick={() => handleSectionChange('overview')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'overview' 
          ? 'border-pink-500 bg-white ring-4 ring-pink-500/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'overview' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-pink-50 border border-pink-100 text-pink-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        1. OVERVIEW
      </div>
      
      {/* Header Wireframe */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="h-6 w-48 rounded bg-slate-200"></div>
        <div className="h-3 w-72 rounded bg-slate-100"></div>
      </div>

      {/* Grid 1: Hero and Outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* hero */}
        <div data-visual-guide-subsection="hero" className="md:col-span-8 p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative overflow-hidden">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'overview' && selectedSubsectionId === 'hero' 
              ? 'border-pink-500 bg-pink-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-4 w-32 rounded bg-slate-200"></div>
          <div className="h-3 w-56 rounded bg-slate-100"></div>
          <div className="h-2 w-48 rounded bg-slate-100"></div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Hero Block (hero)</span>
        </div>
        
        {/* learningOutcomes */}
        <div data-visual-guide-subsection="learningOutcomes" className="md:col-span-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'overview' && selectedSubsectionId === 'learningOutcomes' 
              ? 'border-pink-500 bg-pink-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3 w-24 rounded bg-slate-200"></div>
          <div className="flex flex-col gap-1 mt-1">
            <div className="h-2 w-full rounded bg-slate-100"></div>
            <div className="h-2 w-[90%] rounded bg-slate-100"></div>
            <div className="h-2 w-[80%] rounded bg-slate-100"></div>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Learning Outcomes (learningOutcomes)</span>
        </div>
      </div>

      {/* Grid 2: Progress and Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* progressSummary */}
        <div data-visual-guide-subsection="progressSummary" className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'overview' && selectedSubsectionId === 'progressSummary' 
              ? 'border-pink-500 bg-pink-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="flex justify-between items-center">
            <div className="h-3 w-28 rounded bg-slate-200"></div>
            <div className="h-4 w-8 rounded bg-pink-100"></div>
          </div>
          <div className="h-2 w-full rounded bg-slate-200 overflow-hidden">
            <div className="h-full w-[45%] bg-pink-500 rounded"></div>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Progress Block (progressSummary)</span>
        </div>

        {/* learningRoadmap */}
        <div data-visual-guide-subsection="learningRoadmap" className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'overview' && selectedSubsectionId === 'learningRoadmap' 
              ? 'border-pink-500 bg-pink-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3 w-28 rounded bg-slate-200"></div>
          <div className="flex gap-2 items-center mt-1">
            <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0"></div>
            <div className="h-[2px] w-8 bg-slate-200"></div>
            <div className="w-5 h-5 rounded-full bg-pink-500 shrink-0"></div>
            <div className="h-[2px] w-8 bg-slate-200"></div>
            <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0"></div>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Roadmap Block (learningRoadmap)</span>
        </div>
      </div>

      {/* Grid 3: Recommended Flow and Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* recommendedFlow */}
        <div data-visual-guide-subsection="recommendedFlow" className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'overview' && selectedSubsectionId === 'recommendedFlow' 
              ? 'border-pink-500 bg-pink-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-36 rounded bg-slate-200 mb-1"></div>
          <div className="flex flex-col gap-1.5">
            <div className="h-6 w-full rounded-lg bg-pink-50 border border-pink-100 flex items-center px-2 text-[10px] font-bold text-pink-600">
              👉 1. Overview → 2. Notes → 3. Layman Explanation
            </div>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Recommended Flow (recommendedFlow)</span>
        </div>

        {/* readinessContext */}
        <div data-visual-guide-subsection="readinessContext" className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex gap-2 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'overview' && selectedSubsectionId === 'readinessContext' 
              ? 'border-pink-500 bg-pink-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="p-1 rounded bg-amber-100 text-amber-600 shrink-0"><AlertTriangle size={14} /></div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-3 w-28 rounded bg-amber-200"></div>
            <div className="h-2 w-full rounded bg-amber-100"></div>
          </div>
          <span className="text-[9px] font-black text-slate-400 absolute right-3 bottom-1">Readiness Context (readinessContext)</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div data-visual-guide-subsection="navigation" className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'overview' && selectedSubsectionId === 'navigation' 
            ? 'border-pink-500 bg-pink-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-32 rounded bg-slate-200 mb-2"></div>
        <div className="flex gap-2">
          <span className="bg-white border border-slate-200 text-slate-500 text-[9px] font-bold px-2 py-1 rounded">← Previous Subtopic</span>
          <span className="bg-white border border-slate-200 text-slate-500 text-[9px] font-bold px-2 py-1 rounded">Next Subtopic →</span>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Navigation Links (navigation)</span>
      </div>
    </div>
  );
};
