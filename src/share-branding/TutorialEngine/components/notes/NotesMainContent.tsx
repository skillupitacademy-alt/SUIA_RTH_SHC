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

export function NotesMainContent({ data, isStandalone = true }: { data: SubtopicNotesViewData['mainContent']; isStandalone?: boolean }) {
  const brand = useBrand();

  const content = (
    <div className={`min-w-0 space-y-12 transition-all duration-500 ${isStandalone ? 'mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8 sm:py-10' : ''}`}>

      {/* Page Meta Info (Breadcrumbs & Stats) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold sm:gap-4">
             <span className="flex items-center gap-1.5 text-slate-400">
               <Icons.Home size={14} /> {data.breadcrumbs.join(' / ')}
             </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
              <Icons.Clock size={14} /> {data.meta.readTime}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-xs font-bold">
              <Icons.Star size={14} /> +{data.meta.xp} XP
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* UNIVERSAL VISUAL ARCHITECTURE SEQUENCE (1-8)                                */}
      {/* -------------------------------------------------------------------------- */}

      {/* 1. DEFINITION BLOCK / HERO INFOGRAPHIC */}
      {data.summaryHeroInfographic != null ? (
        <NotesHeroInfographic 
          summaryTitle={data.summaryHeroInfographic.summaryTitle || data.title}
          image={data.summaryHeroInfographic.image}
          examTips={data.summaryHeroInfographic.examTips || []}
          howItWorks={data.summaryHeroInfographic.howItWorks}
        />
      ) : data.definitionBlock && (
        <NotesDefinitionBlock
          badge={data.definitionBlock.badge}
          headline={data.definitionBlock.headline}
          definitionText={data.definitionBlock.definitionText}
          importanceCallout={data.definitionBlock.importanceCallout}
          quickSummary={data.definitionBlock.quickSummary}
        />
      )}

      {/* 2. CONCEPT CARD / MEMORY MAP */}
      {data.conceptMemoryMap != null && (
        <NotesConceptMemoryMap 
          image={data.conceptMemoryMap.image}
          nodes={data.conceptMemoryMap.nodes || []} 
          connections={data.conceptMemoryMap.connections || []} 
        />
      )}

      {/* 3. COMPONENT GRID */}
      {data.componentGrid && (
        <NotesComponentGrid
          gridTitle={data.componentGrid.gridTitle}
          componentCards={data.componentGrid.componentCards}
        />
      )}

      {/* 4. SYNTAX BLOCK */}
      {data.syntaxBlock != null && (
        <NotesSyntaxBlock
          code={data.syntaxBlock.code}
          language={data.syntaxBlock.language}
          title={data.syntaxBlock.title}
          subtitle={data.syntaxBlock.subtitle}
          explanations={data.syntaxBlock.explanations || []}
        />
      )}

      {/* 5. EXAMPLE PANEL */}
      {data.examplePanel && (
        <NotesExamplePanel
          exampleTitle={data.examplePanel.exampleTitle}
          scenarios={data.examplePanel.scenarios}
        />
      )}

      {/* 6. PRACTICE CARD */}
      {data.practiceCard && (
        <NotesPracticeCard
          bestPracticeTitle={data.practiceCard.bestPracticeTitle}
          recommendations={data.practiceCard.recommendations}
          optimizationTips={data.practiceCard.optimizationTips}
          industryStandards={data.practiceCard.industryStandards}
        />
      )}

      {/* 7. WARNING FAQ (COMMON MISTAKES) */}
      {data.warningFaq && (
        <NotesWarningFaq
          faqItems={data.warningFaq.faqItems}
        />
      )}

      {/* 8. SUMMARY CARD (REVISION DASHBOARD) */}
      {data.summaryCard && (
        <NotesSummaryCard
          image={data.summaryCard.image}
          summaryTitle={data.summaryCard.summaryTitle}
          keyTakeaways={data.summaryCard.keyTakeaways}
          revisionChecklist={data.summaryCard.revisionChecklist}
          memoryReinforcement={data.summaryCard.memoryReinforcement}
          examTips={data.summaryCard.examTips}
        />
      )}

      {/* ADDITIONAL VISUALS (If any) */}
      <div className="space-y-12">
          {data.cheatSheetSVG != null && (
            <NotesCheatSheet 
              image={data.cheatSheetSVG.image}
              title={data.cheatSheetSVG.title}
              items={data.cheatSheetSVG.sections || []}
            />
          )}

          {data.flashcardVisualSystem != null && (
            <NotesFlashcardSystem cards={data.flashcardVisualSystem.cards || []} />
          )}

          {data.comparisonSummaryChart != null && (
            <NotesComparisonChart 
              title={data.comparisonSummaryChart.title || "Comparison Summary"}
              columns={data.comparisonSummaryChart.columns || []}
              rows={data.comparisonSummaryChart.rows || []}
            />
          )}

          {data.mnemonicRetentionGraphic != null && (
            <NotesMnemonicGraphic 
              mnemonicTitle={data.mnemonicRetentionGraphic.mnemonicTitle || ''}
              memoryHook={data.mnemonicRetentionGraphic.memoryHook || ''}
              rememberItems={data.mnemonicRetentionGraphic.rememberItems || []}
              keyPoints={data.mnemonicRetentionGraphic.keyPoints || []}
            />
          )}
      </div>

      {/* FOOTER SECTION */}
      {data.footerBlock != null && (
        <NotesFooter 
          image={data.footerBlock.image}
          finalNote={data.footerBlock.finalNote || ''}
          nextStepLabel={data.footerBlock.nextStepLabel || ''}
          nextStepTarget={data.footerBlock.nextStepTarget || ''}
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
