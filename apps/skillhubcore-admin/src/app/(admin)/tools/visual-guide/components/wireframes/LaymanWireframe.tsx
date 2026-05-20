/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const LaymanWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'layman') return null;

  return (
    <div 
      id="wireframe-layman"
      onClick={() => handleSectionChange('layman')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'layman' 
          ? 'border-amber-500 bg-white ring-4 ring-amber-500/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'layman' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-amber-50 border border-amber-100 text-amber-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        3. LAYMAN
      </div>

      {/* simpleOverview */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'layman' && selectedSubsectionId === 'simpleOverview' 
            ? 'border-amber-500 bg-amber-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-40 rounded bg-slate-350 mb-2"></div>
        <div className="h-12 bg-white rounded border border-slate-200/65 border-dashed flex items-center justify-center text-[10px] font-bold text-slate-400">
          Layman Intro Illustration SVG
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Simple Overview (simpleOverview)</span>
      </div>

      {/* everydayAnalogy */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'layman' && selectedSubsectionId === 'everydayAnalogy' 
            ? 'border-amber-500 bg-amber-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-44 rounded bg-slate-300 mb-2"></div>
        <div className="h-14 rounded bg-slate-100 border border-slate-200 p-2 flex flex-col gap-1.5">
          <div className="h-2 w-full bg-slate-250 rounded"></div>
          <div className="h-2 w-[85%] bg-slate-200 rounded"></div>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Everyday Analogy (everydayAnalogy)</span>
      </div>

      {/* whyItExists */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'layman' && selectedSubsectionId === 'whyItExists' 
            ? 'border-amber-500 bg-amber-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-4 w-40 rounded bg-slate-350 mb-2"></div>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div className="h-10 bg-rose-50 border border-rose-100 rounded text-rose-600 text-[10px] font-bold flex items-center justify-center">Before (Traps)</div>
          <div className="h-10 bg-emerald-50 border border-emerald-100 rounded text-emerald-600 text-[10px] font-bold flex items-center justify-center">After (Solution)</div>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Why It Exists (whyItExists)</span>
      </div>

      {/* simpleUseCases & beginnerBreakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* simpleUseCases */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'layman' && selectedSubsectionId === 'simpleUseCases' 
              ? 'border-amber-500 bg-amber-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-28 rounded bg-slate-300"></div>
          <div className="flex flex-col gap-1 mt-1">
            <div className="h-2 w-full bg-slate-200 rounded"></div>
            <div className="h-2 w-[80%] bg-slate-100 rounded"></div>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Simple Use Cases (simpleUseCases)</span>
        </div>

        {/* beginnerBreakdown */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'layman' && selectedSubsectionId === 'beginnerBreakdown' 
              ? 'border-amber-500 bg-amber-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Step-by-step breakdown accordion</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Beginner Breakdown (beginnerBreakdown)</span>
        </div>
      </div>

      {/* mentalModel & commonConfusions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* mentalModel */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'layman' && selectedSubsectionId === 'mentalModel' 
              ? 'border-amber-500 bg-amber-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-28 rounded bg-slate-300"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550">Analogy mapping visual lines</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Mental Model Framework (mentalModel)</span>
        </div>

        {/* commonConfusions */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'layman' && selectedSubsectionId === 'commonConfusions' 
              ? 'border-amber-500 bg-amber-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-350"></div>
          <div className="h-10 bg-amber-50 border border-amber-200 rounded flex items-center px-2 text-[10px] font-bold text-amber-700">Myth vs Fact cards</div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Common Confusions (commonConfusions)</span>
        </div>
      </div>

      {/* simpleRecap */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'layman' && selectedSubsectionId === 'simpleRecap' 
            ? 'border-amber-500 bg-amber-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-32 rounded bg-slate-300 mb-2"></div>
        <div className="h-10 bg-slate-250 border border-slate-200 rounded flex items-center px-2 text-[10px] font-bold text-slate-500 font-sans">Cheery memory hook closing paragraph</div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Simple Recap (simpleRecap)</span>
      </div>

      {/* heroVisualSvg */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'layman' && selectedSubsectionId === 'heroVisualSvg' 
            ? 'border-amber-500 bg-amber-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-36 rounded bg-slate-300 mb-2"></div>
        <div className="h-16 rounded border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
          🎨 Layman Overview concept image SVG (layman-overview)
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Hero Visual SVG (heroVisualSvg)</span>
      </div>

      {/* analogySvg */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'layman' && selectedSubsectionId === 'analogySvg' 
            ? 'border-amber-500 bg-amber-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-32 rounded bg-slate-300 mb-2"></div>
        <div className="h-16 rounded border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
          ⚖️ Analogy comparison graphic SVG (layman-analogy)
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Analogy Graphic SVG (analogySvg)</span>
      </div>

      {/* mentalModelSvg */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'layman' && selectedSubsectionId === 'mentalModelSvg' 
            ? 'border-amber-500 bg-amber-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-36 rounded bg-slate-300 mb-2"></div>
        <div className="h-16 rounded border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
          🧠 Mental model structure map SVG (layman-mental-model)
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Mental Model diagram SVG (mentalModelSvg)</span>
      </div>
    </div>
  );
};
