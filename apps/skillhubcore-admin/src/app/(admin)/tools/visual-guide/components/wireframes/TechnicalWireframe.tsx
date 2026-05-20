/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const TechnicalWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'technical') return null;

  return (
    <div 
      id="wireframe-technical"
      onClick={() => handleSectionChange('technical')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'technical' 
          ? 'border-purple-500 bg-white ring-4 ring-purple-500/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'technical' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-purple-50 border border-purple-100 text-purple-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        5. TECHNICAL
      </div>

      {/* Title & Badge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* title */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'technical' && selectedSubsectionId === 'title' 
              ? 'border-purple-500 bg-purple-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-4.5 w-40 rounded bg-slate-350"></div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Technical Title (title)</span>
        </div>

        {/* badge */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'technical' && selectedSubsectionId === 'badge' 
              ? 'border-purple-500 bg-purple-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="flex gap-2">
            <span className="bg-purple-100 text-purple-600 text-[9px] font-bold px-2 py-1 rounded">ADVANCED LEVEL</span>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Concept Badge (badge)</span>
        </div>
      </div>

      {/* intro */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'technical' && selectedSubsectionId === 'intro' 
            ? 'border-purple-500 bg-purple-500/5 scale-100' 
            : 'border-transparent'
          }`} />
        <div className="h-3 w-full bg-slate-250 rounded"></div>
        <div className="h-3 w-[90%] bg-slate-200 rounded mt-1.5"></div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Introduction Brief (intro)</span>
      </div>

      {/* Architecture sequence block */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'technical' && selectedSubsectionId === 'sections' 
            ? 'border-purple-500 bg-purple-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-350 mb-3"></div>
        <div className="h-28 rounded bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-550">System Architecture SVG (diagramAsset)</span>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Technical Sections & Diagrams (sections)</span>
      </div>
    </div>
  );
};
