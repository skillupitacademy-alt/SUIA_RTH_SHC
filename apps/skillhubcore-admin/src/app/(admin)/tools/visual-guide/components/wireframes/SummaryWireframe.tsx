/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const SummaryWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'summary') return null;

  return (
    <div 
      id="wireframe-summary"
      onClick={() => handleSectionChange('summary')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'summary' 
          ? 'border-teal-600 bg-white ring-4 ring-teal-600/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'summary' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-teal-50 border border-teal-100 text-teal-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        13. SUMMARY
      </div>

      {/* Title & Description Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* title */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'summary' && selectedSubsectionId === 'title' 
              ? 'border-teal-600 bg-teal-600/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-4.5 w-40 rounded bg-slate-350"></div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Summary Header (title)</span>
        </div>

        {/* description */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'summary' && selectedSubsectionId === 'description' 
              ? 'border-teal-600 bg-teal-600/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Rapid revision objectives overview</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Description (description)</span>
        </div>
      </div>

      {/* masteryRecapCard */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'summary' && selectedSubsectionId === 'masteryRecapCard' 
            ? 'border-teal-600 bg-teal-600/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-20 rounded border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[10px] font-extrabold text-slate-550">
          ✨ Mastery Recap Infographic SVG (summary-hero)
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Mastery Recap Card (masteryRecapCard)</span>
      </div>

      {/* keyTakeawayGrid */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'summary' && selectedSubsectionId === 'keyTakeawayGrid' 
            ? 'border-teal-600 bg-teal-600/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-40 rounded bg-slate-350 mb-3"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-12 bg-white rounded border border-slate-200 p-2"><div className="h-2.5 w-12 bg-slate-200 rounded"></div></div>
          <div className="h-12 bg-white rounded border border-slate-200 p-2"><div className="h-2.5 w-12 bg-slate-200 rounded"></div></div>
          <div className="h-12 bg-white rounded border border-slate-200 p-2"><div className="h-2.5 w-12 bg-slate-200 rounded"></div></div>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Key Takeaway Grid (keyTakeawayGrid)</span>
      </div>

      {/* revisionChecklist & nextStepPanel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* revisionChecklist */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'summary' && selectedSubsectionId === 'revisionChecklist' 
              ? 'border-teal-600 bg-teal-600/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550 font-sans">Target milestone checklist items</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Revision Checklist (revisionChecklist)</span>
        </div>

        {/* nextStepPanel */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'summary' && selectedSubsectionId === 'nextStepPanel' 
              ? 'border-teal-600 bg-teal-600/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550 font-sans">Next lessons recommendations buttons</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Next Step Panel (nextStepPanel)</span>
        </div>
      </div>
    </div>
  );
};
