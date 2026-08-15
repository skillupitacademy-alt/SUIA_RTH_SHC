/**
 * migrate-sections-to-domains.ts
 * Dual-Layer Schema Migration Execution
 * -----------------------------------
 * Migrates monolithic JSONB fields from tutorial_sections to dedicated section tables
 */

import dotenv from 'dotenv';
import path from 'path';
import { db } from './db';
import {
  tutorialSections,
  tutorialSectionOverview,
  tutorialSectionNotes,
  // tutorialSectionLayman, // REMOVED 2026-08-15
  tutorialSectionRealLife,
  tutorialSectionTechnical,
  tutorialSectionCode,
  tutorialSectionVisual,
  tutorialSectionPractice,
  tutorialSectionAssignment,
  tutorialSectionProject,
  tutorialSectionQuiz,
  tutorialSectionSummary,
  tutorialSectionInterview,
  tutorialSectionAITutor,
} from './schema';
import { eq, sql } from 'drizzle-orm';

// Load environment variables
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
];

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath });
}

async function migrateSectionsToDomains() {
  console.log('🚀 Starting modular section-to-domain migration...\n');

  try {
    // 1. Fetch all generic records
    console.log('📋 Fetching all modular sections from generic registry...');
    const sections = await db.select().from(tutorialSections);
    console.log(`   Found ${sections.length} total sections to migrate.\n`);

    if (sections.length === 0) {
      console.log('✅ No sections found to migrate.');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    // 2. Perform transaction-based batch insertions
    for (const section of sections) {
      const content = section.content as any;
      if (!content) {
        console.log(`   ⚠️ Skipping section ${section.id}: empty content.`);
        continue;
      }

      console.log(`   📦 Migrating Section ${section.id} (Type: ${section.sectionType})...`);

      try {
        await db.transaction(async (tx) => {
          switch (section.sectionType) {
            case 'overview':
              await tx.insert(tutorialSectionOverview).values({
                sectionId: section.id,
                hero: content.hero || {},
                progressSummary: content.progressSummary || {},
                learningOutcomes: content.learningOutcomes || [],
                learningRoadmap: content.learningRoadmap || {},
                recommendedFlow: content.recommendedFlow || [],
                readinessContext: content.readinessContext || {},
                navigation: content.navigation || {},
              });
              break;

            case 'notes':
              await tx.insert(tutorialSectionNotes).values({
                sectionId: section.id,
                simpleWords: content.simpleWords || '',
                definitionBlock: content.definitionBlock || {},
                sections: content.sections || [],
                componentGrid: content.componentGrid || {},
                examplePanel: content.examplePanel || {},
                practiceCard: content.practiceCard || {},
                warningFaq: content.warningFaq || {},
                summaryCard: content.summaryCard || {},
                syntaxBlock: content.syntaxBlock || null,
                footerBlock: content.footerBlock || null,
                flashcardVisualSystem: content.flashcardVisualSystem || null,
                comparisonSummaryChart: content.comparisonSummaryChart || null,
                mnemonicRetentionGraphic: content.mnemonicRetentionGraphic || null,
                cheatSheetSVG: content.cheatSheetSVG || null,
                summaryHeroSvg: content.summaryHeroInfographic || null,
                conceptMemoryMapSvg: content.conceptMemoryMap || null,
              });
              break;

            /* REMOVED 2026-08-15: layman section migration
            case 'layman':
              await tx.insert(tutorialSectionLayman).values({
                sectionId: section.id,
                simpleOverview: content.simpleOverview || {},
                everydayAnalogy: content.everydayAnalogy || {},
                whyItExists: content.whyItExists || {},
                simpleUseCases: content.simpleUseCases || {},
                beginnerBreakdown: content.beginnerBreakdown || {},
                mentalModel: content.mentalModel || {},
                commonConfusions: content.commonConfusions || {},
                simpleRecap: content.simpleRecap || {},
                heroVisualSvg: content.simpleOverview?.heroVisual || null,
                analogySvg: content.everydayAnalogy?.image || null,
                mentalModelSvg: content.mentalModel?.image || null,
              });
              break;
            */

            case 'real_life':
              await tx.insert(tutorialSectionRealLife).values({
                sectionId: section.id,
                conceptMapping: content.conceptMapping || {},
                industryUseCase: content.industryUseCase || {},
                dailyLifeExample: content.dailyLifeExample || {},
                careerRelevance: content.careerRelevance || {},
                problemSolutionContext: content.problemSolutionContext || {},
                businessApplication: content.businessApplication || {},
                domainScenarios: content.domainScenarios || {},
                practicalRecap: content.practicalRecap || {},
              });
              break;

            case 'technical':
              await tx.insert(tutorialSectionTechnical).values({
                sectionId: section.id,
                title: content.title || '',
                badge: content.badge || '',
                intro: content.intro || '',
                sections: content.sections || [],
              });
              break;

            case 'code':
              await tx.insert(tutorialSectionCode).values({
                sectionId: section.id,
                problemContext: content.problemContext || {},
                basicCodeExample: content.basicCodeExample || {},
                lineByLineExplanation: content.lineByLineExplanation || {},
                outputDemonstration: content.outputDemonstration || {},
                bestPracticeVersion: content.bestPracticeVersion || {},
                commonMistakes: content.commonMistakes || {},
                realWorldImplementation: content.realWorldImplementation || {},
                codeSummary: content.codeSummary || {},
              });
              break;

            case 'visual':
              await tx.insert(tutorialSectionVisual).values({
                sectionId: section.id,
                conceptVisualIntro: content.conceptVisualIntro || {},
                diagrammaticBreakdown: content.diagrammaticBreakdown || {},
                stepByStepVisualFlow: content.stepByStepVisualFlow || {},
                comparativeVisualization: content.comparativeVisualization || {},
                mentalModelVisualization: content.mentalModelVisualization || {},
                realWorldVisualMapping: content.realWorldVisualMapping || {},
                commonConfusionVisualization: content.commonConfusionVisualization || {},
                visualSummary: content.visualSummary || {},
              });
              break;

            case 'practice':
              await tx.insert(tutorialSectionPractice).values({
                sectionId: section.id,
                assessmentIntro: content.assessmentIntro || {},
                conceptRecallQuestions: content.conceptRecallQuestions || {},
                scenarioBasedQuestions: content.scenarioBasedQuestions || {},
                difficultyProgression: content.difficultyProgression || {},
                instantFeedback: content.instantFeedback || {},
                commonMistakeDetection: content.commonMistakeDetection || {},
                performanceAnalytics: content.performanceAnalytics || {},
                revisionRecommendations: content.revisionRecommendations || {},
              });
              break;

            case 'assignment':
              await tx.insert(tutorialSectionAssignment).values({
                sectionId: section.id,
                title: content.title || '',
                description: content.description || '',
                xp: content.xp || 0,
                duration: content.duration || '',
                task: content.task || {},
                objectives: content.objectives || [],
                starterCode: content.starterCode || '',
                submissionGuidelines: content.submissionGuidelines || [],
              });
              break;

            case 'project':
              await tx.insert(tutorialSectionProject).values({
                sectionId: section.id,
                title: content.title || '',
                description: content.description || '',
                xp: content.xp || 0,
                deadline: content.deadline || '',
                hero: content.hero || {},
                realWorldUse: content.realWorldUse || '',
                skills: content.skills || [],
                buildItems: content.buildItems || [],
                deliverables: content.deliverables || [],
              });
              break;

            case 'quiz':
              await tx.insert(tutorialSectionQuiz).values({
                sectionId: section.id,
                title: content.title || '',
                description: content.description || '',
                totalQuestions: content.totalQuestions || 0,
                duration: content.duration || '',
                xp: content.xp || 0,
                questions: content.questions || [],
              });
              break;

            case 'summary':
              await tx.insert(tutorialSectionSummary).values({
                sectionId: section.id,
                title: content.title || '',
                description: content.description || '',
                masteryRecapCard: content.masteryRecapCard || {},
                keyTakeawayGrid: content.keyTakeawayGrid || [],
                revisionChecklist: content.revisionChecklist || [],
                nextStepPanel: content.nextStepPanel || {},
              });
              break;

            case 'interview':
              await tx.insert(tutorialSectionInterview).values({
                sectionId: section.id,
                title: content.title || '',
                description: content.description || '',
                interviewIntroCard: content.interviewIntroCard || {},
                questionBankPanel: content.questionBankPanel || {},
                answerFrameworkCard: content.answerFrameworkCard || {},
                mockInterviewFlow: content.mockInterviewFlow || {},
              });
              break;

            case 'ai_tutor':
              await tx.insert(tutorialSectionAITutor).values({
                sectionId: section.id,
                greeting: content.greeting || '',
                qaPairs: content.qaPairs || [],
                tutorPromptCard: content.tutorPromptCard || {},
                misconceptionDetector: content.misconceptionDetector || {},
                adaptiveHintPanel: content.adaptiveHintPanel || {},
              });
              break;

            default:
              console.log(`   ⚠️ Unknown section type skipped: ${section.sectionType}`);
          }
        });
        successCount++;
      } catch (error) {
        console.error(`   ❌ Failed to migrate section ${section.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n🎯 Data Restructuring Complete:');
    console.log(`   - Successful migrations: ${successCount}`);
    console.log(`   - Unsuccessful migrations: ${errorCount}`);

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Critical migration failure:', error);
    process.exit(1);
  }
}

migrateSectionsToDomains();
