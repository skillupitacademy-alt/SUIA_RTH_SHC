/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const QuizWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'quiz') return null;

  return (
    <div 
      id="wireframe-quiz"
      onClick={() => handleSectionChange('quiz')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'quiz' 
          ? 'border-indigo-600 bg-white ring-4 ring-indigo-600/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'quiz' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-indigo-50 border border-indigo-100 text-indigo-750 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        12. QUIZ
      </div>

      {/* Title & Description Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* title */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'quiz' && selectedSubsectionId === 'title' 
              ? 'border-indigo-600 bg-indigo-600/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-4.5 w-40 rounded bg-slate-350"></div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Quiz Dashboard Hero (title)</span>
        </div>

        {/* description */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'quiz' && selectedSubsectionId === 'description' 
              ? 'border-indigo-600 bg-indigo-600/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350 bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Grading rubric and assessment guidelines</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Description (description)</span>
        </div>
      </div>

      {/* totalQuestions count */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'quiz' && selectedSubsectionId === 'totalQuestions' 
            ? 'border-indigo-600 bg-indigo-600/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-355 bg-slate-350 mb-2"></div>
        <div className="h-10 bg-slate-250 border border-slate-200 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Total count metric dashboard indicator</div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Total Questions (totalQuestions)</span>
      </div>

      {/* Questions Pool */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'quiz' && selectedSubsectionId === 'questions' 
            ? 'border-indigo-600 bg-indigo-600/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-44 rounded bg-slate-350 mb-3"></div>
        <div className="h-20 rounded border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
          📝 Quiz Questions Pool SVG (quiz-hero)
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Questions Pool (questions)</span>
      </div>
    </div>
  );
};
