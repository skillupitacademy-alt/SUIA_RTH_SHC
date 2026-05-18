/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

export const NotesWireframe: React.FC<WireframeProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
}) => {
  if (selectedSectionId !== 'notes') return null;

  return (
    <div 
      id="wireframe-notes"
      onClick={() => handleSectionChange('notes')}
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        selectedSectionId === 'notes' 
          ? 'border-orange-500 bg-white ring-4 ring-orange-500/10 scale-[1.01]' 
          : 'border-slate-200/80 bg-white'
      } ${highlightedElement === 'notes' ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-3 right-3 bg-orange-50 border border-orange-100 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
        2. NOTES
      </div>

      {/* Simple Words intro */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'simpleWords' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3 w-full rounded bg-slate-200"></div>
        <div className="h-3 w-[92%] rounded bg-slate-100 mt-1.5"></div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Simple Words (simpleWords)</span>
      </div>

      {/* Definition Block Wireframe (Full Width) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative mb-4">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'definitionBlock' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="flex gap-2">
          <span className="bg-pink-100 text-pink-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase leading-none">DEFINITION</span>
        </div>
        <div className="h-4 w-32 rounded bg-slate-300"></div>
        <div className="h-3 w-full rounded bg-slate-200"></div>
        <div className="h-3 w-[85%] rounded bg-slate-100"></div>
        <div className="h-5 w-full rounded border border-pink-200 bg-pink-50/50 mt-1"></div>
        <span className="text-[9px] font-black text-slate-400 mt-1">Definition Card (definitionBlock)</span>
      </div>

      {/* Syntax block with diagram */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'syntaxBlock' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 w-36 rounded bg-slate-300"></div>
          <span className="bg-slate-200 text-[8px] font-mono px-2 py-0.5 rounded uppercase">Basic Syntax</span>
        </div>
        <div className="h-20 rounded bg-slate-900 p-3 font-mono text-xs text-emerald-400 flex flex-col gap-1">
          <div><span className="text-pink-400">if</span> condition:</div>
          <div className="pl-4 text-slate-300">print(<span className="text-amber-300">{"'Success!'"}</span>)</div>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Syntax Block (syntaxBlock)</span>
      </div>

      {/* Component Grid */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'componentGrid' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-40 rounded bg-slate-350 mb-3"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-12 bg-white rounded border border-slate-200 p-2"><div className="h-2.5 w-12 bg-slate-200 rounded"></div></div>
          <div className="h-12 bg-white rounded border border-slate-200 p-2"><div className="h-2.5 w-12 bg-slate-200 rounded"></div></div>
          <div className="h-12 bg-white rounded border border-slate-200 p-2"><div className="h-2.5 w-12 bg-slate-200 rounded"></div></div>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Component Grid (componentGrid)</span>
      </div>

      {/* Example Panel & Practice Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* examplePanel */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'notes' && selectedSubsectionId === 'examplePanel' 
              ? 'border-orange-500 bg-orange-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-28 rounded bg-slate-300"></div>
          <div className="h-16 rounded bg-slate-100 border border-slate-200 p-2 flex flex-col gap-1.5">
            <div className="h-2 w-full bg-slate-250 rounded"></div>
            <div className="h-2 w-[70%] bg-slate-200 rounded"></div>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Example Panel (examplePanel)</span>
        </div>

        {/* practiceCard */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'notes' && selectedSubsectionId === 'practiceCard' 
              ? 'border-orange-500 bg-orange-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-28 rounded bg-slate-350"></div>
          <div className="h-16 rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">
            Interactive Recall Prompt
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Practice Card (practiceCard)</span>
        </div>
      </div>

      {/* Warning gotchas list */}
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex gap-3 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'warningFaq' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <AlertTriangle size={18} className="text-amber-600 shrink-0" />
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-3 w-28 rounded bg-amber-200"></div>
          <div className="h-2.5 w-[90%] rounded bg-amber-100"></div>
        </div>
        <span className="text-[9px] font-black text-slate-400 absolute right-3 bottom-1">Warning (warningFaq)</span>
      </div>

      {/* Summary Card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'summaryCard' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-32 rounded bg-slate-300 mb-2"></div>
        <div className="h-14 rounded bg-slate-200 border border-dashed border-slate-300 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-400">Summary Infographic SVG (summaryCard.image)</span>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Summary Card (summaryCard)</span>
      </div>

      {/* Footer Block */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mb-6 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'footerBlock' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-40 rounded bg-slate-700 mb-2"></div>
        <div className="h-10 rounded bg-slate-800 border border-dashed border-slate-700 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-550">Footer Illustration SVG (footerBlock.image)</span>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Footer Block (footerBlock)</span>
      </div>

      {/* Premium Visual Reinforcement Divider */}
      <div className="my-6 border-t-2 border-dashed border-slate-200 pt-4 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Reinforcement Layer</span>
        <span className="h-1 flex-1 mx-4 bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded"></span>
      </div>

      {/* 1. Summary Hero SVG */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'summaryHeroSvg' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-36 rounded bg-slate-300 mb-2"></div>
        <div className="h-20 rounded border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
          ✨ Summary Hero Infographic SVG (notes-hero)
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Summary Hero SVG (summaryHeroSvg)</span>
      </div>

      {/* 2. Concept Memory Map SVG */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'conceptMemoryMapSvg' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-20 rounded border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
          🗺️ Concept Relationship Node Diagram SVG (notes-memory-map)
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Concept Memory Map SVG (conceptMemoryMapSvg)</span>
      </div>

      {/* 3. Cheat Sheet SVG */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'cheatSheetSVG' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-32 rounded bg-slate-300 mb-2"></div>
        <div className="h-20 rounded border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
          📋 Quick-Reference Cheat Sheet SVG (notes-cheatsheet)
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Cheat Sheet SVG (cheatSheetSVG)</span>
      </div>

      {/* 4. Flashcard Visual System */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'flashcardVisualSystem' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-40 rounded bg-slate-350 mb-2"></div>
        <div className="h-16 rounded border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
          ⚡ Flashcard SVG Visual System (flashcardVisualSystem.image)
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Flashcard Visual System (flashcardVisualSystem)</span>
      </div>

      {/* 5. Comparison Summary Chart */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'comparisonSummaryChart' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-44 rounded bg-slate-350 mb-2"></div>
        <div className="h-16 rounded border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
          📊 Comparison Chart SVG (comparisonSummaryChart.image)
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Comparison Summary Chart (comparisonSummaryChart)</span>
      </div>

      {/* 6. Mnemonic Retention Graphic */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
          selectedSectionId === 'notes' && selectedSubsectionId === 'mnemonicRetentionGraphic' 
            ? 'border-orange-500 bg-orange-500/5 scale-100' 
            : 'border-transparent'
        }`} />
        <div className="h-3.5 w-48 rounded bg-slate-350 mb-2"></div>
        <div className="h-16 rounded border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
          🧠 Mnemonic Graphic SVG (mnemonicRetentionGraphic.image)
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Mnemonic Retention Graphic (mnemonicRetentionGraphic)</span>
      </div>
    </div>
  );
};
