'use client';

import React from 'react';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';
import { RealLifeMappingCard } from '../reallife/RealLifeMappingCard';
import { RealLifeIndustryCase } from '../reallife/RealLifeIndustryCase';
import { RealLifeDailyStory } from '../reallife/RealLifeDailyStory';
import { RealLifeCareerPath } from '../reallife/RealLifeCareerPath';
import { RealLifeScenarioBlock } from '../reallife/RealLifeScenarioBlock';
import { RealLifeBusinessCase } from '../reallife/RealLifeBusinessCase';
import { RealLifeScenarioGrid } from '../reallife/RealLifeScenarioGrid';
import { RealLifePracticalSummary } from '../reallife/RealLifePracticalSummary';

/**
 * Real Life Examples Content Component
 * 
 * Implements the complete Real Life Examples Section Education Architecture
 * Based on AllSectionTutorialPage.json and AllSectionTutorialPageUIUXDetailed.json
 * 
 * Universal Architecture (8 templates in order):
 * 1. concept_to_real_world_mapping → mapping_card
 * 2. industry_use_case → industry_case_block
 * 3. daily_life_example → daily_life_story
 * 4. career_relevance → career_path_card
 * 5. problem_solution_context → scenario_block
 * 6. business_application → business_case_panel
 * 7. domain_specific_scenarios → scenario_grid
 * 8. practical_recap → practical_summary_card
 * 
 * All data comes from props - NO hardcoded content
 */
export function RealLifeExamplesContent({ data }: { data: SubtopicNotesViewData['mainContent']['realLifeExamples'] }) {
  if (!data) return null;

  return (
    <div className="min-w-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* 1. CONCEPT TO REAL WORLD MAPPING - mapping_card (Hero intro) */}
      {data.conceptMapping && (
        <RealLifeMappingCard
          badge={data.conceptMapping.badge}
          headline={data.conceptMapping.headline}
          conceptDefinition={data.conceptMapping.conceptDefinition}
          realWorldTranslation={data.conceptMapping.realWorldTranslation}
          importanceBlock={data.conceptMapping.importanceBlock}
          careerRelevance={data.conceptMapping.careerRelevance}
        />
      )}

      {/* 2. INDUSTRY USE CASE - industry_case_block (Enterprise examples) */}
      {data.industryUseCase && (
        <RealLifeIndustryCase
          title={data.industryUseCase.title}
          industryName={data.industryUseCase.industryName}
          scenarioDescription={data.industryUseCase.scenarioDescription}
          businessContext={data.industryUseCase.businessContext}
          implementation={data.industryUseCase.implementation}
          impact={data.industryUseCase.impact}
          keyTakeaway={data.industryUseCase.keyTakeaway}
          image={data.industryUseCase.image}
        />
      )}

      {/* 3. DAILY LIFE EXAMPLE - daily_life_story (Storytelling approach) */}
      {data.dailyLifeExample && (
        <RealLifeDailyStory
          title={data.dailyLifeExample.title}
          storyTitle={data.dailyLifeExample.storyTitle}
          storyNarrative={data.dailyLifeExample.storyNarrative}
          everydayConnection={data.dailyLifeExample.everydayConnection}
          technicalMapping={data.dailyLifeExample.technicalMapping}
          relatableInsight={data.dailyLifeExample.relatableInsight}
          image={data.dailyLifeExample.image}
        />
      )}

      {/* 4. CAREER RELEVANCE - career_path_card (Career paths) */}
      {data.careerRelevance && (
        <RealLifeCareerPath
          title={data.careerRelevance.title}
          careerPaths={data.careerRelevance.careerPaths}
          industryDemand={data.careerRelevance.industryDemand}
          futureGrowth={data.careerRelevance.futureGrowth}
        />
      )}

      {/* 5. PROBLEM SOLUTION CONTEXT - scenario_block (Problem-solution flow) */}
      {data.problemSolutionContext && (
        <RealLifeScenarioBlock
          title={data.problemSolutionContext.title}
          problemStatement={data.problemSolutionContext.problemStatement}
          context={data.problemSolutionContext.context}
          solution={data.problemSolutionContext.solution}
          implementation={data.problemSolutionContext.implementation}
          outcome={data.problemSolutionContext.outcome}
          lessonsLearned={data.problemSolutionContext.lessonsLearned}
        />
      )}

      {/* 6. BUSINESS APPLICATION - business_case_panel (Business process) */}
      {data.businessApplication && (
        <RealLifeBusinessCase
          title={data.businessApplication.title}
          companyType={data.businessApplication.companyType}
          businessChallenge={data.businessApplication.businessChallenge}
          technicalApplication={data.businessApplication.technicalApplication}
          businessProcess={data.businessApplication.businessProcess}
          roi={data.businessApplication.roi}
          scalability={data.businessApplication.scalability}
          keyInsight={data.businessApplication.keyInsight}
        />
      )}

      {/* 7. DOMAIN SPECIFIC SCENARIOS - scenario_grid (Multi-case dashboard) */}
      {data.domainScenarios && (
        <RealLifeScenarioGrid
          title={data.domainScenarios.title}
          scenarios={data.domainScenarios.scenarios}
        />
      )}

      {/* 8. PRACTICAL RECAP - practical_summary_card (Application summary) */}
      {data.practicalRecap && (
        <RealLifePracticalSummary
          summaryTitle={data.practicalRecap.summaryTitle}
          keyApplications={data.practicalRecap.keyApplications}
          industryRelevance={data.practicalRecap.industryRelevance}
          careerImpact={data.practicalRecap.careerImpact}
          nextSteps={data.practicalRecap.nextSteps}
          practicalAdvice={data.practicalRecap.practicalAdvice}
        />
      )}

    </div>
  );
}
