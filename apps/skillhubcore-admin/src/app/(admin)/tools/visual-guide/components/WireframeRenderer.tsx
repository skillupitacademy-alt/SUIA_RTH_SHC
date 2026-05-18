/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';
import { 
  AlertTriangle, CheckCircle2, Terminal 
} from 'lucide-react';

interface WireframeRendererProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
  wireframeCanvasRef: React.RefObject<HTMLDivElement | null>;
}

export const WireframeRenderer: React.FC<WireframeRendererProps> = ({
  selectedSectionId,
  selectedSubsectionId,
  highlightedElement,
  handleSectionChange,
  wireframeCanvasRef
}) => {
  return (
    <div 
      ref={wireframeCanvasRef}
      className="flex-1 overflow-y-auto p-6 bg-slate-100/50 space-y-8 custom-scrollbar scroll-smooth"
    >
      
      {/* 1. OVERVIEW WIREFRAME SECTION */}
      {selectedSectionId === 'overview' && (
      <div 
        id="wireframe-overview"
        onClick={() => handleSectionChange('overview')}
        className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
          selectedSectionId === 'overview' 
            ? 'border-pink-500 bg-white ring-4 ring-pink-500/10 scale-[1.01]' 
            : 'border-slate-200/80 bg-white'
        } ${highlightedElement === 'overview' ? 'animate-pulse' : ''}`}
      >
        <div className="absolute top-3 right-3 bg-pink-50 border border-pink-100 text-pink-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
          1. OVERVIEW
        </div>
        
        {/* Header Wireframe */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="h-6 w-48 rounded bg-slate-200"></div>
          <div className="h-3 w-72 rounded bg-slate-100"></div>
        </div>

        {/* Grid 1: Hero and Outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          {/* hero */}
          <div className="md:col-span-8 p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative overflow-hidden">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'overview' && selectedSubsectionId === 'hero' 
                ? 'border-pink-500 bg-pink-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-4 w-32 rounded bg-slate-200"></div>
            <div className="h-3 w-56 rounded bg-slate-100"></div>
            <div className="h-2 w-48 rounded bg-slate-100"></div>
            <span className="text-[9px] font-black text-slate-400 mt-2 block">Hero Block (hero)</span>
          </div>
          
          {/* learningOutcomes */}
          <div className="md:col-span-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'overview' && selectedSubsectionId === 'learningOutcomes' 
                ? 'border-pink-500 bg-pink-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3 w-24 rounded bg-slate-200"></div>
            <div className="flex flex-col gap-1 mt-1">
              <div className="h-2 w-full rounded bg-slate-100"></div>
              <div className="h-2 w-[90%] rounded bg-slate-100"></div>
              <div className="h-2 w-[80%] rounded bg-slate-100"></div>
            </div>
            <span className="text-[9px] font-black text-slate-400 mt-2 block">Learning Outcomes (learningOutcomes)</span>
          </div>
        </div>

        {/* Grid 2: Progress and Roadmap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* progressSummary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'overview' && selectedSubsectionId === 'progressSummary' 
                ? 'border-pink-500 bg-pink-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="flex justify-between items-center">
              <div className="h-3 w-28 rounded bg-slate-200"></div>
              <div className="h-4 w-8 rounded bg-pink-100"></div>
            </div>
            <div className="h-2 w-full rounded bg-slate-200 overflow-hidden">
              <div className="h-full w-[45%] bg-pink-500 rounded"></div>
            </div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Progress Block (progressSummary)</span>
          </div>

          {/* learningRoadmap */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'overview' && selectedSubsectionId === 'learningRoadmap' 
                ? 'border-pink-500 bg-pink-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3 w-28 rounded bg-slate-200"></div>
            <div className="flex gap-2 items-center mt-1">
              <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0"></div>
              <div className="h-[2px] w-8 bg-slate-200"></div>
              <div className="w-5 h-5 rounded-full bg-pink-500 shrink-0"></div>
              <div className="h-[2px] w-8 bg-slate-200"></div>
              <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0"></div>
            </div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Roadmap Block (learningRoadmap)</span>
          </div>
        </div>

        {/* Grid 3: Recommended Flow and Readiness */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* recommendedFlow */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'overview' && selectedSubsectionId === 'recommendedFlow' 
                ? 'border-pink-500 bg-pink-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-36 rounded bg-slate-200 mb-1"></div>
            <div className="flex flex-col gap-1.5">
              <div className="h-6 w-full rounded-lg bg-pink-50 border border-pink-100 flex items-center px-2 text-[10px] font-bold text-pink-600">
                👉 1. Overview → 2. Notes → 3. Layman Explanation
              </div>
            </div>
            <span className="text-[9px] font-black text-slate-400 mt-2 block">Recommended Flow (recommendedFlow)</span>
          </div>

          {/* readinessContext */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex gap-2 relative">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'overview' && selectedSubsectionId === 'readinessContext' 
                ? 'border-pink-500 bg-pink-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="p-1 rounded bg-amber-100 text-amber-600 shrink-0"><AlertTriangle size={14} /></div>
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-3 w-28 rounded bg-amber-200"></div>
              <div className="h-2 w-full rounded bg-amber-100"></div>
            </div>
            <span className="text-[9px] font-black text-slate-400 absolute right-3 bottom-1">Readiness Context (readinessContext)</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'overview' && selectedSubsectionId === 'navigation' 
              ? 'border-pink-500 bg-pink-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-200 mb-2"></div>
          <div className="flex gap-2">
            <span className="bg-white border border-slate-200 text-slate-500 text-[9px] font-bold px-2 py-1 rounded">← Previous Subtopic</span>
            <span className="bg-white border border-slate-200 text-slate-500 text-[9px] font-bold px-2 py-1 rounded">Next Subtopic →</span>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Navigation Links (navigation)</span>
        </div>

      </div>
      )}

      {/* 2. NOTES WIREFRAME SECTION */}
      {selectedSectionId === 'notes' && (
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
          <div className="h-3.5 w-40 rounded bg-slate-355 bg-slate-350 mb-3"></div>
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
            <span className="text-[10px] font-bold text-slate-500">Footer Illustration SVG (footerBlock.image)</span>
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
          <div className="h-3.5 w-44 rounded bg-slate-355 bg-slate-350 mb-2"></div>
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
      )}

      {/* 3. LAYMAN WIREFRAME SECTION */}
      {selectedSectionId === 'layman' && (
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
      )}

      {/* 4. REAL LIFE WIREFRAME SECTION */}
      {selectedSectionId === 'real_life' && (
      <div 
        id="wireframe-real_life"
        onClick={() => handleSectionChange('real_life')}
        className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
          selectedSectionId === 'real_life' 
            ? 'border-blue-500 bg-white ring-4 ring-blue-500/10 scale-[1.01]' 
            : 'border-slate-200/80 bg-white'
        } ${highlightedElement === 'real_life' ? 'animate-pulse' : ''}`}
      >
        <div className="absolute top-3 right-3 bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
          4. REAL LIFE
        </div>

        {/* conceptMapping */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'real_life' && selectedSubsectionId === 'conceptMapping' 
              ? 'border-blue-500 bg-blue-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-4 w-40 rounded bg-slate-350 mb-2"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Connecting definitions to real software libraries</div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Concept Mapping (conceptMapping)</span>
        </div>

        {/* industryUseCase */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'real_life' && selectedSubsectionId === 'industryUseCase' 
              ? 'border-blue-500 bg-blue-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-4 w-44 rounded bg-slate-300 mb-2"></div>
          <div className="h-20 bg-slate-250 border border-slate-200 rounded flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400">Workflow SVG (industryWorkflow.image)</span>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Industry Use Case (industryUseCase)</span>
        </div>

        {/* dailyLifeExample */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'real_life' && selectedSubsectionId === 'dailyLifeExample' 
              ? 'border-blue-500 bg-blue-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Developer day-to-day log simulation</div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Daily Life Example (dailyLifeExample)</span>
        </div>

        {/* careerRelevance & businessApplication Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* careerRelevance */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'real_life' && selectedSubsectionId === 'careerRelevance' 
                ? 'border-blue-500 bg-blue-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-250 mb-2"></div>
            <div className="flex gap-2">
              <span className="bg-white border border-slate-200 text-slate-600 text-[9px] font-bold px-2 py-1 rounded">Backend</span>
              <span className="bg-white border border-slate-200 text-slate-600 text-[9px] font-bold px-2 py-1 rounded">DevOps</span>
            </div>
            <span className="text-[9px] font-black text-slate-400 mt-2 block">Career Relevance (careerRelevance)</span>
          </div>

          {/* businessApplication */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'real_life' && selectedSubsectionId === 'businessApplication' 
                ? 'border-blue-500 bg-blue-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-350"></div>
            <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500 font-sans">ROI / Operations impact SVG</div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Business Case (businessApplication)</span>
          </div>
        </div>

        {/* problemSolutionContext */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'real_life' && selectedSubsectionId === 'problemSolutionContext' 
              ? 'border-blue-500 bg-blue-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
          <div className="h-10 bg-slate-250 border border-slate-200 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Operational problems statement</div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Problem & Solution (problemSolutionContext)</span>
        </div>

        {/* domainScenarios & practicalRecap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* domainScenarios */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'real_life' && selectedSubsectionId === 'domainScenarios' 
                ? 'border-blue-500 bg-blue-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-300"></div>
            <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Healthcare Scenarios</div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Domain Scenarios (domainScenarios)</span>
          </div>

          {/* practicalRecap */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'real_life' && selectedSubsectionId === 'practicalRecap' 
                ? 'border-blue-500 bg-blue-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-350"></div>
            <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Practical Recap Timeline SVG</div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Practical Recap (practicalRecap)</span>
          </div>
        </div>

      </div>
      )}

      {/* 5. TECHNICAL WIREFRAME SECTION */}
      {selectedSectionId === 'technical' && (
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
            <span className="text-[10px] font-bold text-slate-500">System Architecture SVG (diagramAsset)</span>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Technical Sections & Diagrams (sections)</span>
        </div>

      </div>
      )}

      {/* 6. CODE WIREFRAME SECTION */}
      {selectedSectionId === 'code' && (
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
          <div className="h-24 bg-slate-950 p-4 font-mono text-xs text-slate-300 flex flex-col gap-1">
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
          <div className="h-4 w-48 rounded bg-slate-355 bg-slate-350 mb-2"></div>
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
          <div className="h-10 bg-slate-950 rounded p-2 font-mono text-xs text-slate-400">
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
      )}

      {/* 7. VISUAL WIREFRAME SECTION */}
      {selectedSectionId === 'visual' && (
      <div 
        id="wireframe-visual"
        onClick={() => handleSectionChange('visual')}
        className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
          selectedSectionId === 'visual' 
            ? 'border-teal-500 bg-white ring-4 ring-teal-500/10 scale-[1.01]' 
            : 'border-slate-200/80 bg-white'
        } ${highlightedElement === 'visual' ? 'animate-pulse' : ''}`}
      >
        <div className="absolute top-3 right-3 bg-teal-50 border border-teal-100 text-teal-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
          7. SYSTEM DIAGRAM
        </div>

        {/* conceptVisualIntro */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'visual' && selectedSubsectionId === 'conceptVisualIntro' 
              ? 'border-teal-500 bg-teal-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
          <div className="h-2 bg-slate-200 w-full rounded"></div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Visual Intro (conceptVisualIntro)</span>
        </div>

        {/* Diagrammatic breakdown */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'visual' && selectedSubsectionId === 'diagrammaticBreakdown' 
              ? 'border-teal-500 bg-teal-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-4 w-48 rounded bg-slate-350 mb-3"></div>
          <div className="h-28 rounded bg-slate-200 border border-slate-300 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400">Full Concept Visualization SVG (image)</span>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Ecosystem Diagram (diagrammaticBreakdown)</span>
        </div>

        {/* stepByStepVisualFlow & comparativeVisualization Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* stepByStepVisualFlow */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'visual' && selectedSubsectionId === 'stepByStepVisualFlow' 
                ? 'border-teal-500 bg-teal-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-300"></div>
            <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-500 font-bold">Step Flowchart SVG</div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Process Flow (stepByStepVisualFlow)</span>
          </div>

          {/* comparativeVisualization */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'visual' && selectedSubsectionId === 'comparativeVisualization' 
                ? 'border-teal-500 bg-teal-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-350"></div>
            <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-500 font-bold">Comparison Matrix SVG</div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Comparison Matrix (comparativeVisualization)</span>
          </div>
        </div>

        {/* mentalModelVisualization & realWorldVisualMapping Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* mentalModelVisualization */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'visual' && selectedSubsectionId === 'mentalModelVisualization' 
                ? 'border-teal-500 bg-teal-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-300"></div>
            <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-500 font-bold">Layman translation graph SVG</div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Mental Model (mentalModelVisualization)</span>
          </div>

          {/* realWorldVisualMapping */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'visual' && selectedSubsectionId === 'realWorldVisualMapping' 
                ? 'border-teal-500 bg-teal-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-350"></div>
            <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-500 font-bold">Pipeline deployment SVG</div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Deployment Map (realWorldVisualMapping)</span>
          </div>
        </div>

        {/* commonConfusionVisualization & visualSummary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* commonConfusionVisualization */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'visual' && selectedSubsectionId === 'commonConfusionVisualization' 
                ? 'border-teal-500 bg-teal-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-300"></div>
            <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-500 font-bold">State lifecycle graph SVG</div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Confusion Graph (commonConfusionVisualization)</span>
          </div>

          {/* visualSummary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'visual' && selectedSubsectionId === 'visualSummary' 
                ? 'border-teal-500 bg-teal-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-350"></div>
            <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-500 font-bold">Infographic summary graph SVG</div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Visual Summary (visualSummary)</span>
          </div>
        </div>

      </div>
      )}

      {/* 8. PRACTICE WIREFRAME SECTION */}
      {selectedSectionId === 'practice' && (
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
            <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550">Readiness advice recommendation dashboard SVG</div>
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
      )}

      {/* 9. ASSIGNMENT WIREFRAME SECTION */}
      {selectedSectionId === 'assignment' && (
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
      )}

      {/* 10. PROJECT WIREFRAME SECTION */}
      {selectedSectionId === 'project' && (
      <div 
        id="wireframe-project"
        onClick={() => handleSectionChange('project')}
        className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
          selectedSectionId === 'project' 
            ? 'border-indigo-500 bg-white ring-4 ring-indigo-500/10 scale-[1.01]' 
            : 'border-slate-200/80 bg-white'
        } ${highlightedElement === 'project' ? 'animate-pulse' : ''}`}
      >
        <div className="absolute top-3 right-3 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
          10. PROJECT
        </div>

        {/* Project title spec */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'project' && selectedSubsectionId === 'title' 
              ? 'border-indigo-500 bg-indigo-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
          <div className="h-14 rounded bg-slate-200/80 border border-dashed border-slate-300 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400">Project Blueprint SVG (systemArchitecture)</span>
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Project Dashboard (title)</span>
        </div>

        {/* description */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
            selectedSectionId === 'project' && selectedSubsectionId === 'description' 
              ? 'border-indigo-500 bg-indigo-500/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-32 rounded bg-slate-300 mb-2"></div>
          <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-500">Capstone complete spec details</div>
          <span className="text-[9px] font-black text-slate-400 mt-2 block">Description (description)</span>
        </div>

        {/* buildItems & deliverables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* buildItems */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'project' && selectedSubsectionId === 'buildItems' 
                ? 'border-indigo-500 bg-indigo-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-300"></div>
            <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-450 font-bold">Phased roadmap SVG diagram</div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Build Phases (buildItems)</span>
          </div>

          {/* deliverables */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'project' && selectedSubsectionId === 'deliverables' 
                ? 'border-indigo-500 bg-indigo-500/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-355 bg-slate-350"></div>
            <div className="h-16 bg-slate-200 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-450 font-bold">System layers blueprint SVG</div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Deliverables List (deliverables)</span>
          </div>
        </div>

      </div>
      )}

      {/* 11. INTERVIEW PREP WIREFRAME SECTION */}
      {selectedSectionId === 'interview' && (
      <div 
        id="wireframe-interview"
        onClick={() => handleSectionChange('interview')}
        className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
          selectedSectionId === 'interview' 
            ? 'border-pink-600 bg-white ring-4 ring-pink-600/10 scale-[1.01]' 
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
                ? 'border-pink-600 bg-pink-600/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-4.5 w-40 rounded bg-slate-350"></div>
            <span className="text-[9px] font-black text-slate-400 mt-2 block">Interview Prep Hero (title)</span>
          </div>

          {/* description */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
            <div className={`absolute inset-0 border-2 rounded-xl transition-all ${
              selectedSectionId === 'interview' && selectedSubsectionId === 'description' 
                ? 'border-pink-600 bg-pink-600/5 scale-100' 
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
              ? 'border-pink-600 bg-pink-600/5 scale-100' 
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
              ? 'border-pink-600 bg-pink-600/5 scale-100' 
              : 'border-transparent'
          }`} />
          <div className="h-3.5 w-44 rounded bg-slate-355 bg-slate-350 mb-3"></div>
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
                ? 'border-pink-600 bg-pink-600/5 scale-100' 
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
                ? 'border-pink-600 bg-pink-600/5 scale-100' 
                : 'border-transparent'
            }`} />
            <div className="h-3.5 w-32 rounded bg-slate-350"></div>
            <div className="h-10 bg-slate-200 border border-slate-300 rounded flex items-center px-2 text-[10px] font-bold text-slate-550 font-sans">Dialogue conversation bubbles</div>
            <span className="text-[9px] font-black text-slate-400 mt-1 block">Mock Interview Flow (mockInterviewFlow)</span>
          </div>
        </div>

      </div>
      )}

      {/* 12. QUIZ WIREFRAME SECTION */}
      {selectedSectionId === 'quiz' && (
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
            <div className="h-3.5 w-32 rounded bg-slate-300"></div>
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
          <div className="h-4 w-44 rounded bg-slate-350 mb-2"></div>
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
      )}

      {/* 13. SUMMARY WIREFRAME SECTION */}
      {selectedSectionId === 'summary' && (
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
      )}

      {/* 14. AI TUTOR WIREFRAME SECTION */}
      {selectedSectionId === 'ai_tutor' && (
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
      )}

    </div>
  );
};
