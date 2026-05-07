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

/**
 * Notes Main Content Component
 * 
 * Implements the complete Notes Section Education Architecture
 * Based on AllSectionTutorialPage.json and AllSectionTutorialPageUIUXDetailed.json
 * 
 * Universal Architecture (8 templates in order):
 * 1. core_definition → definition_block
 * 2. concept_explanation → concept_card
 * 3. key_components → component_grid
 * 4. syntax_or_structure → syntax_block
 * 5. examples → example_panel
 * 6. best_practices → practice_card
 * 7. common_errors → warning_faq
 * 8. revision_summary → summary_card
 * 
 * All data comes from props - NO hardcoded content
 */
export function NotesMainContent({ data, isStandalone = true }: { data: SubtopicNotesViewData['mainContent']; isStandalone?: boolean }) {
  const brand = useBrand();

  const content = (
    <div className={`min-w-0 space-y-8 transition-all duration-500 ${isStandalone ? 'mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8 sm:py-10' : ''}`}>

      {/* Page Meta Info */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold sm:gap-4">
            <span className="flex items-center gap-1.5 text-slate-900">
              <Icons.Clock size={14} aria-hidden="true" /> {data.meta.readTime}
            </span>
            <span className="flex items-center gap-1.5 text-amber-950 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200">
              <Icons.BarChart2 size={14} aria-hidden="true" /> {data.meta.level}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-950 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
              <Icons.Star size={14} aria-hidden="true" /> +{data.meta.xp} XP
            </span>
          </div>
          <button
            className="flex items-center gap-1.5 text-[11px] font-bold transition-colors hover:underline text-primary-dark"
          >
            <Icons.Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* 1. CORE DEFINITION - definition_block (Hero-style intro) */}
      {data.definitionBlock && (
        <NotesDefinitionBlock
          badge={data.definitionBlock.badge}
          headline={data.definitionBlock.headline}
          definitionText={data.definitionBlock.definitionText}
          importanceCallout={data.definitionBlock.importanceCallout}
          quickSummary={data.definitionBlock.quickSummary}
        />
      )}

      {/* 2. CONCEPT EXPLANATION - concept_card (Educational content panels) */}
      <div className="space-y-10">
        {data.sections.map((section) => (
          <section key={section.id} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
            <p className="text-[15px] font-medium leading-relaxed text-slate-800 whitespace-pre-wrap">
              {section.content}
            </p>

            {section.keyPoint && (
              <div className="flex gap-4 rounded-xl bg-amber-100 p-5 mt-6 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-t border-white/60 border-amber-200">
                <Icons.Star size={20} className="text-amber-900 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-[13px] font-bold text-amber-950 mb-1">Key Point</h3>
                  <p className="text-[13px] font-medium text-amber-950">{section.keyPoint}</p>
                </div>
              </div>
            )}

            {/* 4. SYNTAX OR STRUCTURE - syntax_block (Code/formula highlight) */}
            {section.codeExample && (
              <div className="mt-6 space-y-4">
                <div className="relative overflow-hidden rounded-xl bg-[#1e293b] p-4 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)] border-t border-white/10 sm:p-5">
                  <button className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20 transition-colors border border-white/10" aria-label="Copy code snippet">
                    <Icons.Copy size={12} aria-hidden="true" /> Copy
                  </button>
                  <pre className="whitespace-pre-wrap break-words pr-16 font-mono text-[12px] leading-relaxed text-slate-200 sm:text-[13px]">
                    <code className="break-words">{section.codeExample.code}</code>
                  </pre>
                </div>
                <div className="rounded-xl bg-slate-100 p-4 border border-slate-200">
                  <p className="text-[13px] font-medium text-slate-900 font-mono whitespace-pre-wrap">
                    {section.codeExample.output}
                  </p>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* 3. KEY COMPONENTS - component_grid (3-column breakdown) */}
      {data.componentGrid && (
        <NotesComponentGrid
          gridTitle={data.componentGrid.gridTitle}
          componentCards={data.componentGrid.componentCards}
        />
      )}

      {/* 5. EXAMPLES - example_panel (2-column practical examples) */}
      {data.examplePanel && (
        <NotesExamplePanel
          exampleTitle={data.examplePanel.exampleTitle}
          scenarios={data.examplePanel.scenarios}
        />
      )}

      {/* 6. BEST PRACTICES - practice_card (Recommendations & optimization) */}
      {data.practiceCard && (
        <NotesPracticeCard
          bestPracticeTitle={data.practiceCard.bestPracticeTitle}
          recommendations={data.practiceCard.recommendations}
          optimizationTips={data.practiceCard.optimizationTips}
          industryStandards={data.practiceCard.industryStandards}
        />
      )}

      {/* 7. COMMON ERRORS - warning_faq (Mistakes & FAQ accordion) */}
      {data.warningFaq && (
        <NotesWarningFaq
          commonErrors={data.warningFaq.commonErrors}
          faqItems={data.warningFaq.faqItems}
          misconceptionAlerts={data.warningFaq.misconceptionAlerts}
        />
      )}

      {/* 8. REVISION SUMMARY - summary_card (Exam-ready summary) */}
      {data.summaryCard && (
        <NotesSummaryCard
          summaryTitle={data.summaryCard.summaryTitle}
          keyTakeaways={data.summaryCard.keyTakeaways}
          revisionChecklist={data.summaryCard.revisionChecklist}
          memoryReinforcement={data.summaryCard.memoryReinforcement}
          examTips={data.summaryCard.examTips}
        />
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
