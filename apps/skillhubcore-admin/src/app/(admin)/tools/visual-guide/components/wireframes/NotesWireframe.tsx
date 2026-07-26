/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface WireframeProps {
  selectedSectionId: string;
  selectedSubsectionId: string;
  highlightedElement: string | null;
  handleSectionChange: (sectionId: string) => void;
}

const isSelected = (selectedSectionId: string, selectedSubsectionId: string, subsectionId: string) =>
  selectedSectionId === 'notes' && selectedSubsectionId === subsectionId;

const highlightClass = (selectedSectionId: string, selectedSubsectionId: string, subsectionId: string) =>
  isSelected(selectedSectionId, selectedSubsectionId, subsectionId)
    ? 'border-orange-500 bg-orange-500/5 scale-100'
    : 'border-transparent';

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

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${highlightClass(selectedSectionId, selectedSubsectionId, 'concept_card')}`} />
        <div className="flex gap-2 mb-3">
          <span className="h-5 w-16 rounded-full bg-orange-200" />
          <span className="h-5 w-20 rounded-full bg-emerald-100" />
        </div>
        <div className="h-5 w-52 rounded bg-slate-300" />
        <div className="h-3 w-[92%] rounded bg-slate-100 mt-2" />
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Concept Card / NotesHero (concept_card)</span>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 relative mb-4">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${highlightClass(selectedSectionId, selectedSubsectionId, 'definition_block')}`} />
        <span className="bg-pink-100 text-pink-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase leading-none w-fit">Definition</span>
        <div className="h-4 w-32 rounded bg-slate-300" />
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-[85%] rounded bg-slate-100" />
        <div className="h-5 w-full rounded border border-pink-200 bg-pink-50/50 mt-1" />
        <span className="text-[9px] font-black text-slate-400 mt-1">Definition Block / CoreDefinition (definition_block)</span>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${highlightClass(selectedSectionId, selectedSubsectionId, 'component_grid')}`} />
        <div className="h-3.5 w-40 rounded bg-slate-300 mb-3" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-14 bg-white rounded border border-slate-200 p-2">
              <div className="h-2.5 w-12 bg-slate-200 rounded" />
              <div className="h-2 w-full bg-slate-100 rounded mt-2" />
            </div>
          ))}
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Component Grid / SystemMechanics (component_grid)</span>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${highlightClass(selectedSectionId, selectedSubsectionId, 'syntax_block')}`} />
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 w-36 rounded bg-slate-300" />
          <span className="bg-slate-200 text-[8px] font-mono px-2 py-0.5 rounded uppercase">Syntax</span>
        </div>
        <div className="h-20 rounded bg-slate-900 p-3 font-mono text-xs text-emerald-400 flex flex-col gap-1">
          <div>items = []</div>
          <div>items.append("new")</div>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Syntax Block / SyntaxStructure (syntax_block)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${highlightClass(selectedSectionId, selectedSubsectionId, 'example_panel')}`} />
          <div className="h-3.5 w-28 rounded bg-slate-300" />
          <div className="h-16 rounded bg-slate-100 border border-slate-200 p-2 flex flex-col gap-1.5">
            <div className="h-2 w-full bg-slate-200 rounded" />
            <div className="h-2 w-[70%] bg-slate-200 rounded" />
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Example Panel / KeyComponents (example_panel)</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-2">
          <div className={`absolute inset-0 border-2 rounded-xl transition-all ${highlightClass(selectedSectionId, selectedSubsectionId, 'practice_card')}`} />
          <div className="h-3.5 w-28 rounded bg-slate-300" />
          <div className="h-16 rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">
            Best-practice guidance
          </div>
          <span className="text-[9px] font-black text-slate-400 mt-1 block">Practice Card / BestPractices (practice_card)</span>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex gap-3 mb-4 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${highlightClass(selectedSectionId, selectedSubsectionId, 'warning_faq')}`} />
        <AlertTriangle size={18} className="text-amber-600 shrink-0" />
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-3 w-28 rounded bg-amber-200" />
          <div className="h-2.5 w-[90%] rounded bg-amber-100" />
        </div>
        <span className="text-[9px] font-black text-slate-400 absolute right-3 bottom-1">Warning FAQ / CommonMistakes (warning_faq)</span>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 relative">
        <div className={`absolute inset-0 border-2 rounded-xl transition-all ${highlightClass(selectedSectionId, selectedSubsectionId, 'summary_card')}`} />
        <div className="h-3.5 w-32 rounded bg-slate-300 mb-2" />
        <div className="h-14 rounded bg-slate-200 border border-dashed border-slate-300 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-400">Revision summary and key takeaways</span>
        </div>
        <span className="text-[9px] font-black text-slate-400 mt-2 block">Summary Card / VisualSummary (summary_card)</span>
      </div>
    </div>
  );
};
