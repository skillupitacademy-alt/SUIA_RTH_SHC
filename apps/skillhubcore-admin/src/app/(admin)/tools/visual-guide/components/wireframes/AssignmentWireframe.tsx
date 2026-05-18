/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const AssignmentWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'assignment') return null;

  return (
    <div 
      id="wireframe-assignment"
      onClick={() => handleSectionChange('assignment')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'assignment' 
          ? 'border-rose-500 bg-white ring-4 ring-rose-500/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'assignment' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        9. ASSIGNMENT
      </div>

      {/* Assignment title spec */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'assignment' && selectedSubsectionId === 'title' 
            ? 'border-rose-500 bg-rose-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="flex justify-between items-center mb-2">
          <div className="h-4.5 w-40 rounded bg-slate-300"></div>
          <span className="bg-pink-100 text-pink-600 text-[9px] font-bold px-2 py-0.5 rounded">+100 XP</span>
        </div>
        <div className="h-3 w-full rounded bg-slate-200"></div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Assignment Dashboard (title)</span>
      </div>

      {/* description & duration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* description */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'assignment' && selectedSubsectionId === 'description' 
              ? 'border-rose-500 bg-rose-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Problem context details</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Description (description)</span>
        </div>

        {/* duration */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'assignment' && selectedSubsectionId === 'duration' 
              ? 'border-rose-500 bg-rose-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550 font-sans">Estimated hours specification</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Duration Spec (duration)</span>
        </div>
      </div>

      {/* task */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'assignment' && selectedSubsectionId === 'task' 
            ? 'border-rose-500 bg-rose-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] font-bold text-slate-400">
          Task flow SVG infographic
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Task Steps (task)</span>
      </div>

      {/* objectives & starterCode Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* objectives */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'assignment' && selectedSubsectionId === 'objectives' 
              ? 'border-rose-500 bg-rose-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Milestone checklists</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Objectives (objectives)</span>
        </div>

        {/* starterCode */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'assignment' && selectedSubsectionId === 'starterCode' 
              ? 'border-rose-500 bg-rose-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550 font-sans">Template starting code block</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Starter Code (starterCode)</span>
        </div>
      </div>

      {/* submissionGuidelines */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'assignment' && selectedSubsectionId === 'submissionGuidelines' 
            ? 'border-rose-500 bg-rose-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-10 bg-slate-250 border border-slate-200 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Submission steps and test checks</div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Submission Rules (submissionGuidelines)</span>
      </div>
    </div>
  );
};
