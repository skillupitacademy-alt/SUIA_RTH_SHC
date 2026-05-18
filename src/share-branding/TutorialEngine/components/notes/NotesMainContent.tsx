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

export function NotesMainContent({ data, isStandalone = true }: { data: SubtopicNotesViewData['mainContent']; isStandalone?: boolean }) {
  const brand = useBrand();
  const content = (
    <div className={`min-w-0 space-y-12 transition-all duration-500 ${isStandalone ? 'mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8 sm:py-10' : ''}`}>
      {/* UNIVERSAL VISUAL ARCHITECTURE SEQUENCE (1-8)                                */}
      {/* -------------------------------------------------------------------------- */}

      {/* A. WELCOME / INTRO (SIMPLE WORDS) */}
      {data.simpleWords && (
        <NotesSimpleWords simpleWords={data.simpleWords} />
      )}

      {/* 1. DEFINITION BLOCK */}
      {data.definitionBlock && (
        <NotesDefinitionBlock
          badge={data.definitionBlock.badge}
          headline={data.definitionBlock.headline}
          definitionText={data.definitionBlock.definitionText}
          importanceCallout={data.definitionBlock.importanceCallout}
          quickSummary={data.definitionBlock.quickSummary}
        />
      )}

      {data.summaryHeroInfographic != null && (
        <NotesHeroInfographic
          summaryTitle={data.summaryHeroInfographic.summaryTitle || data.title}
          image={data.summaryHeroInfographic.image}
          examTips={data.summaryHeroInfographic.examTips || []}
          howItWorks={data.summaryHeroInfographic.howItWorks}
          topicName={data.breadcrumbs?.[1]}
        />
      )}

      {/* B. DYNAMIC CONCEPT SECTIONS */}
      {data.sections && data.sections.length > 0 && (
        <NotesConceptSections sections={data.sections} />
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
          image={data.syntaxBlock.image}
          code={data.syntaxBlock.code}
          language={data.syntaxBlock.language}
          title={data.syntaxBlock.title}
          subtitle={data.syntaxBlock.subtitle || (data.breadcrumbs?.[1] ? `${data.breadcrumbs[1]} Basic Syntax` : undefined)}
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
          <NotesFlashcardSystem
            image={data.flashcardVisualSystem.image}
            cards={data.flashcardVisualSystem.cards || []}
          />
        )}

        {data.comparisonSummaryChart != null && (
          <NotesComparisonChart
            image={data.comparisonSummaryChart.image}
            title={data.comparisonSummaryChart.title || "Comparison Summary"}
            columns={data.comparisonSummaryChart.columns || []}
            rows={data.comparisonSummaryChart.rows || []}
          />
        )}

        {data.mnemonicRetentionGraphic != null && (
          <NotesMnemonicGraphic
            image={data.mnemonicRetentionGraphic.image}
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
