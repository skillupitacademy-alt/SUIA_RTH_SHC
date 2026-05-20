/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';
import { Terminal } from 'lucide-react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const CodeWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'code') return null;

  return (
    <div 
      id="wireframe-code"
      onClick={() => handleSectionChange('code')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'code' 
          ? 'border-emerald-500 bg-white ring-4 ring-emerald-500/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'code' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        6. CODE
      </div>

      {/* problemContext */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'code' && selectedSubsectionId === 'problemContext' 
            ? 'border-emerald-500 bg-emerald-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Problem statement and code design constraints</div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Problem Context (problemContext)</span>
      </div>

      {/* Editor mockup */}
      <div className="rounded-xl border border-slate-300 bg-slate-50 overflow-hidden mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all z-20 ${
          selectedSectionId === 'code' && selectedSubsectionId === 'basicCodeExample' 
            ? 'border-emerald-500 bg-emerald-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="bg-slate-200 border-b border-slate-350 p-2 flex gap-1.5 items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
          <span className="bg-slate-100 text-[8px] font-bold px-2 py-0.5 rounded border border-slate-300">index.py</span>
        </div>
        <div className="h-24 bg-slate-955 p-4 font-mono text-xs text-slate-300 flex flex-col gap-1">
          <div><span className="text-pink-400">def</span> <span className="text-emerald-400">calculate_sum</span>(a, b):</div>
          <div className="pl-4"><span className="text-pink-400">return</span> a + b</div>
        </div>
        <span className="text-[9px] font-black text-slate-400 absolute right-3 bottom-1">Code block (basicCodeExample)</span>
      </div>

      {/* lineByLineExplanation */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'code' && selectedSubsectionId === 'lineByLineExplanation' 
            ? 'border-emerald-500 bg-emerald-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-48 rounded bg-slate-350 mb-2"></div>
        <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Line breakdown table showing key execution flows</div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Line Breakdown (lineByLineExplanation)</span>
      </div>

      {/* Output Preview */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all z-20 ${
          selectedSectionId === 'code' && selectedSubsectionId === 'outputDemonstration' 
            ? 'border-emerald-500 bg-emerald-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="flex gap-1.5 items-center mb-2">
          <Terminal size={14} className="text-slate-400" />
          <span className="text-[9px] font-mono text-slate-400 font-sans">Terminal Output</span>
        </div>
        <div className="h-10 bg-slate-955 rounded p-2 font-mono text-xs text-slate-405 text-slate-400">
          &gt; 5
        </div>
        <span className="text-[9px] font-black text-slate-400 absolute right-3 bottom-1">Console (outputDemonstration)</span>
      </div>

      {/* bestPracticeVersion & commonMistakes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* bestPracticeVersion */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'code' && selectedSubsectionId === 'bestPracticeVersion' 
              ? 'border-emerald-500 bg-emerald-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-emerald-50 border border-emerald-200 rounded flex items-center px-2 text-[10px] font-bold text-emerald-700">Clean caching/DRY pattern</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Best Practices (bestPracticeVersion)</span>
        </div>

        {/* commonMistakes */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'code' && selectedSubsectionId === 'commonMistakes' 
              ? 'border-emerald-500 bg-emerald-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-rose-50 border border-rose-200 rounded flex items-center px-2 text-[10px] font-bold text-rose-700">Buggy vs Corrected comparison</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Common Mistakes (commonMistakes)</span>
        </div>
      </div>

      {/* realWorldImplementation & codeSummary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* realWorldImplementation */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'code' && selectedSubsectionId === 'realWorldImplementation' 
              ? 'border-emerald-500 bg-emerald-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500 font-sans">Production config files</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Real World Block (realWorldImplementation)</span>
        </div>

        {/* codeSummary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'code' && selectedSubsectionId === 'codeSummary' 
              ? 'border-emerald-500 bg-emerald-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500 font-sans">Code Checklist summary</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Code Summary (codeSummary)</span>
        </div>
      </div>
    </div>
  );
};
