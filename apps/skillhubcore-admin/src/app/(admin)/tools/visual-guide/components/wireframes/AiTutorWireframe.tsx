/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const AiTutorWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'ai_tutor') return null;

  return (
    <div 
      id="wireframe-ai_tutor"
      onClick={() => handleSectionChange('ai_tutor')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'ai_tutor' 
          ? 'border-fuchsia-600 bg-white ring-4 ring-fuchsia-600/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'ai_tutor' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-fuchsia-50 border border-fuchsia-100 text-fuchsia-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        14. AI TUTOR
      </div>

      {/* greeting */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'ai_tutor' && selectedSubsectionId === 'greeting' 
            ? 'border-fuchsia-600 bg-fuchsia-600/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-10 bg-slate-250 border border-slate-200 rounded flex items-center px-2 text-[10px] font-bold text-slate-550">Personalized greeting and tutor persona setup</div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Greeting (greeting)</span>
      </div>

      {/* qaPairs & tutorPromptCard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* qaPairs */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'ai_tutor' && selectedSubsectionId === 'qaPairs' 
              ? 'border-fuchsia-600 bg-fuchsia-600/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550">Interactive dialogue FAQ chat bubble pool</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Q&A Pairs (qaPairs)</span>
        </div>

        {/* tutorPromptCard */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'ai_tutor' && selectedSubsectionId === 'tutorPromptCard' 
              ? 'border-fuchsia-600 bg-fuchsia-600/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550 font-sans">System prompt blueprint configurations</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Tutor Prompt (tutorPromptCard)</span>
        </div>
      </div>

      {/* misconceptionDetector */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'ai_tutor' && selectedSubsectionId === 'misconceptionDetector' 
            ? 'border-fuchsia-600 bg-fuchsia-600/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-20 rounded border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
          💬 Student Misconception Scan SVG (tutor-conversation)
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Misconception Detector (misconceptionDetector)</span>
      </div>

      {/* adaptiveHintPanel */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'ai_tutor' && selectedSubsectionId === 'adaptiveHintPanel' 
            ? 'border-fuchsia-600 bg-fuchsia-600/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-10 bg-slate-250 border border-slate-200 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Step-by-step progressive hints panel</div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Adaptive Hint Panel (adaptiveHintPanel)</span>
      </div>
    </div>
  );
};
