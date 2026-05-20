/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const InterviewWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'interview') return null;

  return (
    <div 
      id="wireframe-interview"
      onClick={() => handleSectionChange('interview')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'interview' 
          ? 'border-pink-650 bg-white ring-4 ring-pink-650/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'interview' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-pink-50 border border-pink-100 text-pink-650 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        11. INTERVIEW PREP
      </div>

      {/* Title & Description Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* title */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'interview' && selectedSubsectionId === 'title' 
              ? 'border-pink-650 bg-pink-650/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-4.5 w-40 rounded bg-slate-350"></div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Interview Prep Hero (title)</span>
        </div>

        {/* description */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'interview' && selectedSubsectionId === 'description' 
              ? 'border-pink-650 bg-pink-650/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550">Job seeker targeting context</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Description (description)</span>
        </div>
      </div>

      {/* interviewIntroCard */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'interview' && selectedSubsectionId === 'interviewIntroCard' 
            ? 'border-pink-650 bg-pink-650/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-10 bg-slate-250 border border-slate-200 rounded flex items-center px-2 text-[10px] font-bold text-slate-500 font-sans">Common questions types and tips</div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Interview Intro (interviewIntroCard)</span>
      </div>

      {/* Question Bank */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'interview' && selectedSubsectionId === 'questionBankPanel' 
            ? 'border-pink-650 bg-pink-650/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-44 rounded bg-slate-350 mb-3"></div>
        <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 flex justify-between items-center">
          <span>How does this concept solve scaling issues?</span>
          <span className="text-[10px] text-pink-650 hover:underline cursor-pointer">Show Answer</span>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Q&A Bank (questionBankPanel)</span>
      </div>

      {/* answerFrameworkCard & mockInterviewFlow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* answerFrameworkCard */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'interview' && selectedSubsectionId === 'answerFrameworkCard' 
              ? 'border-pink-650 bg-pink-655 bg-pink-650/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550">Perfect STAR answer structure</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Answer Framework (answerFrameworkCard)</span>
        </div>

        {/* mockInterviewFlow */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'interview' && selectedSubsectionId === 'mockInterviewFlow' 
              ? 'border-pink-650 bg-pink-650/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550 font-sans">Dialogue conversation bubbles</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Mock Interview Flow (mockInterviewFlow)</span>
        </div>
      </div>
    </div>
  );
};
