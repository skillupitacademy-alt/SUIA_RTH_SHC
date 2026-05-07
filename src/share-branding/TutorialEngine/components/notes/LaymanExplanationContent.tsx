import React from 'react';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';
import { LaymanIntroCard } from '../layman/LaymanIntroCard';
import { LaymanAnalogyCard } from '../layman/LaymanAnalogyCard';
import { LaymanBenefitCard } from '../layman/LaymanBenefitCard';
import { LaymanUseCaseGrid } from '../layman/LaymanUseCaseGrid';
import { LaymanBeginnerBreakdown } from '../layman/LaymanBeginnerBreakdown';
import { LaymanMentalModel } from '../layman/LaymanMentalModel';
import { LaymanCommonConfusions } from '../layman/LaymanCommonConfusions';
import { LaymanSimpleRecap } from '../layman/LaymanSimpleRecap';

/**
 * Layman Explanation Content Component
 * 
 * Implements the complete Layman Section Education Architecture
 * Based on AllSectionTutorialPage.json and AllSectionTutorialPageUIUXDetailed.json
 * 
 * Universal Architecture (8 templates in order):
 * 1. simple_overview → intro_card
 * 2. everyday_analogy → analogy_card
 * 3. why_it_exists → benefit_card
 * 4. simple_use_cases → use_case_grid
 * 5. beginner_breakdown → accordion
 * 6. mental_model → diagram_renderer
 * 7. common_confusions → faq_block
 * 8. simple_recap → summary_card
 * 
 * All data comes from props - NO hardcoded content
 */
export function LaymanExplanationContent({ data }: { data: SubtopicNotesViewData['mainContent']['laymanExplanation'] }) {
  if (!data) return null;

  return (
    <div className="min-w-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* 1. SIMPLE OVERVIEW - intro_card (Hero-style beginner intro) */}
      {data.simpleOverview && (
        <LaymanIntroCard
          badge={data.simpleOverview.badge}
          headline={data.simpleOverview.headline}
          simpleDefinition={data.simpleOverview.simpleDefinition}
          subExplanation={data.simpleOverview.subExplanation}
          importanceBlock={data.simpleOverview.importanceBlock}
          progressIndicator={data.simpleOverview.progressIndicator}
        />
      )}

      {/* 2. EVERYDAY ANALOGY - analogy_card (Story-based analogy) */}
      {data.everydayAnalogy && (
        <LaymanAnalogyCard
          title={data.everydayAnalogy.title}
          storyAnalogy={data.everydayAnalogy.storyAnalogy}
          comparisonPanel={data.everydayAnalogy.comparisonPanel}
          visualMetaphor={data.everydayAnalogy.visualMetaphor}
          keyTakeaway={data.everydayAnalogy.keyTakeaway}
          image={data.everydayAnalogy.image}
        />
      )}

      {/* 3. WHY IT EXISTS - benefit_card (3-column benefit grid) */}
      {data.whyItExists && (
        <LaymanBenefitCard
          sectionTitle={data.whyItExists.sectionTitle}
          benefitCards={data.whyItExists.benefitCards}
        />
      )}

      {/* 4. SIMPLE USE CASES - use_case_grid (4-column use case examples) */}
      {data.simpleUseCases && (
        <LaymanUseCaseGrid
          gridTitle={data.simpleUseCases.gridTitle}
          useCaseCards={data.simpleUseCases.useCaseCards}
        />
      )}

      {/* 5. BEGINNER BREAKDOWN - accordion (Step-by-step expandable) */}
      {data.beginnerBreakdown && (
        <LaymanBeginnerBreakdown
          title={data.beginnerBreakdown.title}
          steps={data.beginnerBreakdown.steps}
        />
      )}

      {/* 6. MENTAL MODEL - diagram_renderer (Interactive visual) */}
      {data.mentalModel && (
        <LaymanMentalModel
          title={data.mentalModel.title}
          conceptMap={data.mentalModel.conceptMap}
          visualLabels={data.mentalModel.visualLabels}
        />
      )}

      {/* 7. COMMON CONFUSIONS - faq_block (FAQ accordion) */}
      {data.commonConfusions && (
        <LaymanCommonConfusions
          title={data.commonConfusions.title}
          confusionItems={data.commonConfusions.confusionItems}
          faqItems={data.commonConfusions.faqItems}
          misconceptionAlerts={data.commonConfusions.misconceptionAlerts}
        />
      )}

      {/* 8. SIMPLE RECAP - summary_card (Revision dashboard) */}
      {data.simpleRecap && (
        <LaymanSimpleRecap
          summaryTitle={data.simpleRecap.summaryTitle}
          keyTakeaways={data.simpleRecap.keyTakeaways}
          simpleRecapPoints={data.simpleRecap.simpleRecapPoints}
          confidenceBoost={data.simpleRecap.confidenceBoost}
          memoryReinforcement={data.simpleRecap.memoryReinforcement}
        />
      )}

    </div>
  );
}
