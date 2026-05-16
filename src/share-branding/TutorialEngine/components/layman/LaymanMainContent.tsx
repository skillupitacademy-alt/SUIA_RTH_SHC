import React from 'react';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';
import { LaymanIntroCard } from './LaymanIntroCard';
import { LaymanAnalogyCard } from './LaymanAnalogyCard';
import { LaymanBenefitCard } from './LaymanBenefitCard';
import { LaymanUseCaseGrid } from './LaymanUseCaseGrid';
import { LaymanBeginnerBreakdown } from './LaymanBeginnerBreakdown';
import { LaymanMentalModel } from './LaymanMentalModel';
import { LaymanCommonConfusions } from './LaymanCommonConfusions';
import { LaymanSimpleRecap } from './LaymanSimpleRecap';
import * as Icons from 'lucide-react';

/**
 * Layman Main Content Component
 * 
 * Implements the Universal 8-Template Layman Architecture
 * 1. Simple Overview
 * 2. Everyday Analogy
 * 3. Why It Exists
 * 4. Simple Use Cases
 * 5. Beginner Breakdown
 * 6. Mental Model
 * 7. Common Confusions
 * 8. Simple Recap
 */
export function LaymanMainContent({ data }: { data: SubtopicNotesViewData['mainContent']['laymanExplanation'] }) {
  if (!data) return null;

  return (
    <div className="min-w-0 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* 1. SIMPLE OVERVIEW */}
      {data.simpleOverview && (
        <LaymanIntroCard
          badge={data.simpleOverview.badge}
          headline={data.simpleOverview.headline}
          simpleDefinition={data.simpleOverview.simpleDefinition}
          subExplanation={data.simpleOverview.subExplanation}
          importanceBlock={data.simpleOverview.importanceBlock}
          heroVisual={data.simpleOverview.heroVisual}
        />
      )}

      {/* 2. EVERYDAY ANALOGY */}
      {data.everydayAnalogy && (
        <LaymanAnalogyCard
          title={data.everydayAnalogy.title}
          storyAnalogy={data.everydayAnalogy.storyAnalogy}
          comparisonPanel={data.everydayAnalogy.comparisonPanel}
          visualMetaphor={data.everydayAnalogy.visualMetaphor}
          keyTakeaway={data.everydayAnalogy.keyTakeaway}
          analogyVisual={data.everydayAnalogy.analogyVisual}
        />
      )}

      {/* 3. WHY IT EXISTS */}
      {data.whyItExists && (
        <LaymanBenefitCard
          sectionTitle={data.whyItExists.sectionTitle}
          benefitCards={data.whyItExists.benefitCards}
        />
      )}

      {/* 4. SIMPLE USE CASES */}
      {data.simpleUseCases && (
        <LaymanUseCaseGrid
          gridTitle={data.simpleUseCases.gridTitle}
          useCaseCards={data.simpleUseCases.useCaseCards}
        />
      )}

      {/* 5. BEGINNER BREAKDOWN */}
      {data.beginnerBreakdown && (
        <LaymanBeginnerBreakdown
          title={data.beginnerBreakdown.title}
          steps={data.beginnerBreakdown.steps}
        />
      )}

      {/* 6. MENTAL MODEL */}
      {data.mentalModel && (
        <LaymanMentalModel
          title={data.mentalModel.title}
          conceptMap={data.mentalModel.conceptMap}
          visualLabels={data.mentalModel.visualLabels}
          flowArrows={data.mentalModel.flowArrows}
          tooltips={data.mentalModel.tooltips}
        />
      )}

      {/* 7. COMMON CONFUSIONS */}
      {data.commonConfusions && (
        <LaymanCommonConfusions
          title={data.commonConfusions.title}
          confusionItems={data.commonConfusions.confusionItems}
          faqItems={data.commonConfusions.faqItems}
          misconceptionAlerts={data.commonConfusions.misconceptionAlerts}
        />
      )}

      {/* 8. SIMPLE RECAP */}
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
