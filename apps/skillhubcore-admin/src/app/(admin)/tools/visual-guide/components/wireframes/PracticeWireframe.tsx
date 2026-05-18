/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const PracticeWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'practice') return null;

  return (
    <div 
      id="wireframe-practice"
      onClick={() => handleSectionChange('practice')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'practice' 
          ? 'border-violet-500 bg-white ring-4 ring-violet-500/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'practice' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-violet-50 border border-violet-100 text-violet-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        8. PRACTICE
      </div>

      {/* assessmentIntro */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'practice' && selectedSubsectionId === 'assessmentIntro' 
            ? 'border-violet-500 bg-violet-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Practice motivation title dashboard</div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Assessment Intro (assessmentIntro)</span>
      </div>

      {/* Concept recall questions */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'practice' && selectedSubsectionId === 'conceptRecallQuestions' 
            ? 'border-violet-500 bg-violet-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3 w-56 rounded bg-slate-350 mb-3"></div>
        <div className="space-y-2">
          <div className="h-8 w-full rounded border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-500 hover:border-violet-300 cursor-pointer flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div> Option A
          </div>
          <div className="h-8 w-full rounded border border-violet-200 bg-violet-50/50 p-2.5 text-xs font-bold text-violet-600 flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border border-violet-400 bg-violet-400 flex items-center justify-center"><CheckCircle2 size={10} className="text-white" /></div> Correct Option B
          </div>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Recall Questions (conceptRecallQuestions)</span>
      </div>

      {/* scenarioBasedQuestions & instantFeedback Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* scenarioBasedQuestions */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'practice' && selectedSubsectionId === 'scenarioBasedQuestions' 
              ? 'border-violet-500 bg-violet-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Developer scenario-based questions</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Scenario Questions (scenarioBasedQuestions)</span>
        </div>

        {/* instantFeedback */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'practice' && selectedSubsectionId === 'instantFeedback' 
              ? 'border-violet-500 bg-violet-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550 font-sans">Readiness advice recommendation dashboard SVG</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Feedback Config (instantFeedback)</span>
        </div>
      </div>

      {/* Difficulty Progression & Common Mistake Detection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative mt-4">
        {/* difficultyProgression */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'practice' && selectedSubsectionId === 'difficultyProgression' 
              ? 'border-violet-500 bg-violet-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Visual easy, medium, hard paths slider</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Difficulty Path (difficultyProgression)</span>
        </div>

        {/* commonMistakeDetection */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'practice' && selectedSubsectionId === 'commonMistakeDetection' 
              ? 'border-violet-500 bg-violet-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-555">Typical student misunderstandings helper</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Mistake Detection (commonMistakeDetection)</span>
        </div>
      </div>

      {/* Performance Analytics & Smart Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative mt-4">
        {/* performanceAnalytics */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'practice' && selectedSubsectionId === 'performanceAnalytics' 
              ? 'border-violet-500 bg-violet-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Radar or bar strength analytics chart</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Analytics Chart (performanceAnalytics)</span>
        </div>

        {/* revisionRecommendations */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'practice' && selectedSubsectionId === 'revisionRecommendations' 
              ? 'border-violet-500 bg-violet-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550 font-sans">Smart recommended revision links</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Revision Recommendations (revisionRecommendations)</span>
        </div>
      </div>
    </div>
  );
};
