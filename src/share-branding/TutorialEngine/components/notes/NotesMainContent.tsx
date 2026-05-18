import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';
import { NotesDefinitionBlock } from './NotesDefinitionBlock';
import { NotesComponentGrid } from './NotesComponentGrid';
import { NotesExamplePanel } from './NotesExamplePanel';
import { NotesPracticeCard } from './NotesPracticeCard';
import { NotesWarningFaq } from './NotesWarningFaq';
import { NotesSummaryCard } from './NotesSummaryCard';
import { NotesHeroInfographic } from './NotesHeroInfographic';
import { NotesFlashcardSystem } from './NotesFlashcardSystem';
import { NotesConceptMemoryMap } from './NotesConceptMemoryMap';
import { NotesComparisonChart } from './NotesComparisonChart';
import { NotesMnemonicGraphic } from './NotesMnemonicGraphic';
import { NotesCheatSheet } from './NotesCheatSheet';
import { NotesSyntaxBlock } from './NotesSyntaxBlock';
import { NotesFooter } from './NotesFooter';

function NotesSimpleWords({ simpleWords }: { simpleWords: string }) {
  const brand = useBrand();

  return (
    <div className="w-full rounded-[24px] border border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-6 shadow-lg sm:p-8 transition-all hover:shadow-xl relative overflow-hidden group">
      <div className="absolute right-0 top-0 opacity-[0.03] text-indigo-900 group-hover:scale-105 transition-transform duration-500 pointer-events-none">
        <Icons.HelpCircle size={220} />
      </div>
      <div className="flex gap-4 sm:gap-6 items-start relative z-10">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md shadow-blue-500/20"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <Icons.Lightbulb size={24} />
        </div>
        <div className="space-y-2">
          <span className="text-[12px] font-extrabold uppercase tracking-widest text-indigo-600">In Simple Words</span>
          <p className="text-[15px] sm:text-[16px] font-semibold leading-relaxed text-slate-700">
            {simpleWords}
          </p>
        </div>
      </div>
    </div>
  );
}

interface SectionItem {
  id: string;
  title: string;
  content: string;
  keyPoint?: string;
  codeExample?: {
    code: string;
    output: string;
  };
}

function NotesConceptSections({ sections }: { sections: SectionItem[] }) {
  const brand = useBrand();

  return (
    <div className="w-full space-y-10">
      {sections.map((section, idx) => (
        <div
          key={section.id || idx}
          className="w-full rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl sm:p-10 transition-all hover:shadow-2xl"
        >
          {/* Section Indicator */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: brand.primaryColor }}
              >
                <Icons.BookOpen size={16} />
              </div>
              <span className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Concept Details</span>
            </div>
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
              Part {idx + 1}
            </span>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
              {section.title}
            </h3>

            <p className="text-base font-medium leading-relaxed text-slate-600 whitespace-pre-line">
              {section.content}
            </p>

            {/* Key Point Callout */}
            {section.keyPoint && (
              <div className="rounded-xl bg-amber-50/60 p-5 border border-amber-200/80 flex gap-3.5 relative overflow-hidden group">
                <Icons.Star className="text-amber-500 fill-amber-400 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                  <h4 className="text-[13px] font-extrabold text-amber-900 uppercase tracking-wide">Key Takeaway</h4>
                  <p className="text-[14px] font-medium text-amber-950/80 leading-relaxed">
                    {section.keyPoint}
                  </p>
                </div>
              </div>
            )}

            {/* Optional Code Example */}
            {section.codeExample && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden shadow-md">
                {/* Editor Tab bar */}
                <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 ml-2">code-example.js</span>
                  </div>
                  <Icons.Code2 className="text-slate-400" size={16} />
                </div>

                {/* Code Body */}
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 font-mono text-[13px]">
                  {/* Input Code */}
                  <pre className="p-4 overflow-x-auto text-slate-300 leading-relaxed whitespace-pre subtopic-code-wrap">
                    <code>{section.codeExample.code}</code>
                  </pre>

                  {/* Console Output */}
                  <div className="p-4 bg-slate-900/60 font-sans">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Console Output</div>
                    <pre className="font-mono text-emerald-400 leading-relaxed whitespace-pre subtopic-code-wrap">
                      <code>{section.codeExample.output}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotesMainContent({ 
  data, 
  isStandalone = true,
  isEditable = false,
  onEditComponent,
  onDeleteComponent
}: { 
  data: SubtopicNotesViewData['mainContent']; 
  isStandalone?: boolean;
  isEditable?: boolean;
  onEditComponent?: (key: string, data: any) => void;
  onDeleteComponent?: (key: string) => void;
}) {
  const brand = useBrand();
  const content = (
    <div className={`min-w-0 space-y-12 transition-all duration-500 ${isStandalone ? 'mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8 sm:py-10' : ''}`}>
      {/* UNIVERSAL VISUAL ARCHITECTURE SEQUENCE (1-8)                                */}
      {/* -------------------------------------------------------------------------- */}

      {/* A. WELCOME / INTRO (SIMPLE WORDS) */}
      {data.simpleWords && (
        <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
              <button
                onClick={() => onEditComponent?.('simpleWords', data.simpleWords)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
              >
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => onDeleteComponent?.('simpleWords')}
                className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
              >
                <Icons.Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <NotesSimpleWords simpleWords={data.simpleWords} />
        </div>
      )}

      {/* 1. DEFINITION BLOCK */}
      {data.definitionBlock && (
        <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
              <button
                onClick={() => onEditComponent?.('definitionBlock', data.definitionBlock)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
              >
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => onDeleteComponent?.('definitionBlock')}
                className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
              >
                <Icons.Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <NotesDefinitionBlock
            badge={data.definitionBlock.badge}
            headline={data.definitionBlock.headline}
            definitionText={data.definitionBlock.definitionText}
            importanceCallout={data.definitionBlock.importanceCallout}
            quickSummary={data.definitionBlock.quickSummary}
          />
        </div>
      )}

      {data.summaryHeroInfographic != null && (
        <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
              <button
                onClick={() => onEditComponent?.('summaryHeroInfographic', data.summaryHeroInfographic)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
              >
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => onDeleteComponent?.('summaryHeroInfographic')}
                className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
              >
                <Icons.Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <NotesHeroInfographic
            summaryTitle={data.summaryHeroInfographic.summaryTitle || data.title}
            image={data.summaryHeroInfographic.image}
            examTips={data.summaryHeroInfographic.examTips || []}
            howItWorks={data.summaryHeroInfographic.howItWorks}
            topicName={data.breadcrumbs?.[1]}
          />
        </div>
      )}

      {/* B. DYNAMIC CONCEPT SECTIONS */}
      {data.sections && data.sections.length > 0 && (
        <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
              <button
                onClick={() => onEditComponent?.('sections', data.sections)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
              >
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => onDeleteComponent?.('sections')}
                className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
              >
                <Icons.Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <NotesConceptSections sections={data.sections} />
        </div>
      )}

      {/* 2. CONCEPT CARD / MEMORY MAP */}
      {data.conceptMemoryMap != null && (
        <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
              <button
                onClick={() => onEditComponent?.('conceptMemoryMap', data.conceptMemoryMap)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
              >
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => onDeleteComponent?.('conceptMemoryMap')}
                className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
              >
                <Icons.Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <NotesConceptMemoryMap
            image={data.conceptMemoryMap.image}
            nodes={data.conceptMemoryMap.nodes || []}
            connections={data.conceptMemoryMap.connections || []}
          />
        </div>
      )}

      {/* 3. COMPONENT GRID */}
      {data.componentGrid && (
        <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
              <button
                onClick={() => onEditComponent?.('componentGrid', data.componentGrid)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
              >
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => onDeleteComponent?.('componentGrid')}
                className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
              >
                <Icons.Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <NotesComponentGrid
            gridTitle={data.componentGrid.gridTitle}
            componentCards={data.componentGrid.componentCards}
          />
        </div>
      )}

      {/* 4. SYNTAX BLOCK */}
      {data.syntaxBlock != null && (
        <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
              <button
                onClick={() => onEditComponent?.('syntaxBlock', data.syntaxBlock)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
              >
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => onDeleteComponent?.('syntaxBlock')}
                className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
              >
                <Icons.Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <NotesSyntaxBlock
            image={data.syntaxBlock.image}
            code={data.syntaxBlock.code}
            language={data.syntaxBlock.language}
            title={data.syntaxBlock.title}
            subtitle={data.syntaxBlock.subtitle || (data.breadcrumbs?.[1] ? `${data.breadcrumbs[1]} Basic Syntax` : undefined)}
            explanations={data.syntaxBlock.explanations || []}
          />
        </div>
      )}

      {/* 5. EXAMPLE PANEL */}
      {data.examplePanel && (
        <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
              <button
                onClick={() => onEditComponent?.('examplePanel', data.examplePanel)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
              >
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => onDeleteComponent?.('examplePanel')}
                className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
              >
                <Icons.Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <NotesExamplePanel
            exampleTitle={data.examplePanel.exampleTitle}
            scenarios={data.examplePanel.scenarios}
          />
        </div>
      )}

      {/* 6. PRACTICE CARD */}
      {data.practiceCard && (
        <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
              <button
                onClick={() => onEditComponent?.('practiceCard', data.practiceCard)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
              >
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => onDeleteComponent?.('practiceCard')}
                className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
              >
                <Icons.Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <NotesPracticeCard
            bestPracticeTitle={data.practiceCard.bestPracticeTitle}
            recommendations={data.practiceCard.recommendations}
            optimizationTips={data.practiceCard.optimizationTips}
            industryStandards={data.practiceCard.industryStandards}
          />
        </div>
      )}

      {/* 7. WARNING FAQ (COMMON MISTAKES) */}
      {data.warningFaq && (
        <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
              <button
                onClick={() => onEditComponent?.('warningFaq', data.warningFaq)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
              >
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => onDeleteComponent?.('warningFaq')}
                className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
              >
                <Icons.Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <NotesWarningFaq
            faqItems={data.warningFaq.faqItems}
          />
        </div>
      )}

      {/* 8. SUMMARY CARD (REVISION DASHBOARD) */}
      {data.summaryCard && (
        <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
              <button
                onClick={() => onEditComponent?.('summaryCard', data.summaryCard)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
              >
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => onDeleteComponent?.('summaryCard')}
                className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
              >
                <Icons.Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <NotesSummaryCard
            image={data.summaryCard.image}
            summaryTitle={data.summaryCard.summaryTitle}
            keyTakeaways={data.summaryCard.keyTakeaways}
            revisionChecklist={data.summaryCard.revisionChecklist}
            memoryReinforcement={data.summaryCard.memoryReinforcement}
            examTips={data.summaryCard.examTips}
          />
        </div>
      )}

      {/* ADDITIONAL VISUALS (If any) */}
      <div className="space-y-12">
        {data.cheatSheetSVG != null && (
          <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
            {isEditable && (
              <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
                <button
                  onClick={() => onEditComponent?.('cheatSheetSVG', data.cheatSheetSVG)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
                >
                  <Icons.Edit3 size={12} /> Edit
                </button>
                <button
                  onClick={() => onDeleteComponent?.('cheatSheetSVG')}
                  className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
                >
                  <Icons.Trash2 size={12} /> Delete
                </button>
              </div>
            )}
            <NotesCheatSheet
              image={data.cheatSheetSVG.image}
              title={data.cheatSheetSVG.title}
              items={data.cheatSheetSVG.sections || []}
            />
          </div>
        )}

        {data.flashcardVisualSystem != null && (
          <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
            {isEditable && (
              <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
                <button
                  onClick={() => onEditComponent?.('flashcardVisualSystem', data.flashcardVisualSystem)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
                >
                  <Icons.Edit3 size={12} /> Edit
                </button>
                <button
                  onClick={() => onDeleteComponent?.('flashcardVisualSystem')}
                  className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
                >
                  <Icons.Trash2 size={12} /> Delete
                </button>
              </div>
            )}
            <NotesFlashcardSystem
              image={data.flashcardVisualSystem.image}
              cards={data.flashcardVisualSystem.cards || []}
            />
          </div>
        )}

        {data.comparisonSummaryChart != null && (
          <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
            {isEditable && (
              <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
                <button
                  onClick={() => onEditComponent?.('comparisonSummaryChart', data.comparisonSummaryChart)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
                >
                  <Icons.Edit3 size={12} /> Edit
                </button>
                <button
                  onClick={() => onDeleteComponent?.('comparisonSummaryChart')}
                  className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
                >
                  <Icons.Trash2 size={12} /> Delete
                </button>
              </div>
            )}
            <NotesComparisonChart
              image={data.comparisonSummaryChart.image}
              title={data.comparisonSummaryChart.title || "Comparison Summary"}
              columns={data.comparisonSummaryChart.columns || []}
              rows={data.comparisonSummaryChart.rows || []}
            />
          </div>
        )}

        {data.mnemonicRetentionGraphic != null && (
          <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
            {isEditable && (
              <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
                <button
                  onClick={() => onEditComponent?.('mnemonicRetentionGraphic', data.mnemonicRetentionGraphic)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
                >
                  <Icons.Edit3 size={12} /> Edit
                </button>
                <button
                  onClick={() => onDeleteComponent?.('mnemonicRetentionGraphic')}
                  className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
                >
                  <Icons.Trash2 size={12} /> Delete
                </button>
              </div>
            )}
            <NotesMnemonicGraphic
              image={data.mnemonicRetentionGraphic.image}
              mnemonicTitle={data.mnemonicRetentionGraphic.mnemonicTitle || ''}
              memoryHook={data.mnemonicRetentionGraphic.memoryHook || ''}
              rememberItems={data.mnemonicRetentionGraphic.rememberItems || []}
              keyPoints={data.mnemonicRetentionGraphic.keyPoints || []}
            />
          </div>
        )}
      </div>

      {/* FOOTER SECTION */}
      {data.footerBlock != null && (
        <div className="relative group/editable-item border-2 border-transparent hover:border-pink-300 rounded-[32px] p-2 transition-all duration-300">
          {isEditable && (
            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover/editable-item:opacity-100 transition-all duration-200 flex gap-2">
              <button
                onClick={() => onEditComponent?.('footerBlock', data.footerBlock)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-blue-500 hover:scale-105 transition-transform"
              >
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => onDeleteComponent?.('footerBlock')}
                className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500 hover:scale-105 transition-transform"
              >
                <Icons.Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <NotesFooter
            image={data.footerBlock.image}
            finalNote={data.footerBlock.finalNote || ''}
            nextStepLabel={data.footerBlock.nextStepLabel || ''}
            nextStepTarget={data.footerBlock.nextStepTarget || ''}
          />
        </div>
      )}

    </div>
  );

  if (!isStandalone) return content;

  return (
    <main className="flex-1 overflow-y-auto hide-scrollbar bg-white">
      {content}
    </main>
  );
}
