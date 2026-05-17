/* istanbul ignore file */
/**
 * Tutorial Section Domains - Restructured Sub-section Architecture
 * Restructures polymorphic JSONB columns into surgical domain-specific tables and columns
 */

import { pgTable, uuid, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { tutorialSections } from './tutorial-sections';

// ==========================================
// 1. OVERVIEW SECTION DOMAIN
// ==========================================
export const tutorialSectionOverview = pgTable('tutorial_section_overview', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  hero: jsonb('hero').notNull(),
  progressSummary: jsonb('progress_summary').notNull(),
  learningOutcomes: jsonb('learning_outcomes').notNull(),
  learningRoadmap: jsonb('learning_roadmap').notNull(),
  recommendedFlow: jsonb('recommended_flow').notNull(),
  readinessContext: jsonb('readiness_context').notNull(),
  navigation: jsonb('navigation').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 2. NOTES SECTION DOMAIN
// ==========================================
export const tutorialSectionNotes = pgTable('tutorial_section_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  simpleWords: text('simple_words').notNull(),
  definitionBlock: jsonb('definition_block').notNull(),
  sections: jsonb('sections').notNull(),
  componentGrid: jsonb('component_grid').notNull(),
  examplePanel: jsonb('example_panel').notNull(),
  practiceCard: jsonb('practice_card').notNull(),
  warningFaq: jsonb('warning_faq').notNull(),
  summaryCard: jsonb('summary_card').notNull(),
  
  // Premium Visual Architecture Blocks
  syntaxBlock: jsonb('syntax_block'),
  footerBlock: jsonb('footer_block'),
  flashcardVisualSystem: jsonb('flashcard_visual_system'),
  comparisonSummaryChart: jsonb('comparison_summary_chart'),
  mnemonicRetentionGraphic: jsonb('mnemonic_retention_graphic'),
  cheatSheetSVG: jsonb('cheat_sheet_svg'),
  
  // Surgical SVG Assets (Isolated for lazy-loading optimization)
  summaryHeroSvg: jsonb('summary_hero_svg'),
  conceptMemoryMapSvg: jsonb('concept_memory_map_svg'),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 3. LAYMAN SECTION DOMAIN
// ==========================================
export const tutorialSectionLayman = pgTable('tutorial_section_layman', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  simpleOverview: jsonb('simple_overview').notNull(),
  everydayAnalogy: jsonb('everyday_analogy').notNull(),
  whyItExists: jsonb('why_it_exists').notNull(),
  simpleUseCases: jsonb('simple_use_cases').notNull(),
  beginnerBreakdown: jsonb('beginner_breakdown').notNull(),
  mentalModel: jsonb('mental_model').notNull(),
  commonConfusions: jsonb('common_confusions').notNull(),
  simpleRecap: jsonb('simple_recap').notNull(),

  // Surgical SVG Assets
  heroVisualSvg: jsonb('hero_visual_svg'),
  analogySvg: jsonb('analogy_svg'),
  mentalModelSvg: jsonb('mental_model_svg'),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 4. REAL-LIFE SECTION DOMAIN
// ==========================================
export const tutorialSectionRealLife = pgTable('tutorial_section_real_life', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  conceptMapping: jsonb('concept_mapping').notNull(),
  industryUseCase: jsonb('industry_use_case').notNull(),
  dailyLifeExample: jsonb('daily_life_example').notNull(),
  careerRelevance: jsonb('career_relevance').notNull(),
  problemSolutionContext: jsonb('problem_solution_context').notNull(),
  businessApplication: jsonb('business_application').notNull(),
  domainScenarios: jsonb('domain_scenarios').notNull(),
  practicalRecap: jsonb('practical_recap').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 5. TECHNICAL SECTION DOMAIN
// ==========================================
export const tutorialSectionTechnical = pgTable('tutorial_section_technical', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  title: text('title').notNull(),
  badge: text('badge').notNull(),
  intro: text('intro').notNull(),
  sections: jsonb('sections').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 6. CODE SECTION DOMAIN
// ==========================================
export const tutorialSectionCode = pgTable('tutorial_section_code', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  problemContext: jsonb('problem_context').notNull(),
  basicCodeExample: jsonb('basic_code_example').notNull(),
  lineByLineExplanation: jsonb('line_by_line_explanation').notNull(),
  outputDemonstration: jsonb('output_demonstration').notNull(),
  bestPracticeVersion: jsonb('best_practice_version').notNull(),
  commonMistakes: jsonb('common_mistakes').notNull(),
  realWorldImplementation: jsonb('real_world_implementation').notNull(),
  codeSummary: jsonb('code_summary').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 7. VISUAL SECTION DOMAIN
// ==========================================
export const tutorialSectionVisual = pgTable('tutorial_section_visual', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  conceptVisualIntro: jsonb('concept_visual_intro').notNull(),
  diagrammaticBreakdown: jsonb('diagrammatic_breakdown').notNull(),
  stepByStepVisualFlow: jsonb('step_by_step_visual_flow').notNull(),
  comparativeVisualization: jsonb('comparative_visualization').notNull(),
  mentalModelVisualization: jsonb('mental_model_visualization').notNull(),
  realWorldVisualMapping: jsonb('real_world_visual_mapping').notNull(),
  commonConfusionVisualization: jsonb('common_confusion_visualization').notNull(),
  visualSummary: jsonb('visual_summary').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 8. PRACTICE SECTION DOMAIN
// ==========================================
export const tutorialSectionPractice = pgTable('tutorial_section_practice', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  assessmentIntro: jsonb('assessment_intro').notNull(),
  conceptRecallQuestions: jsonb('concept_recall_questions').notNull(),
  scenarioBasedQuestions: jsonb('scenario_based_questions').notNull(),
  difficultyProgression: jsonb('difficulty_progression').notNull(),
  instantFeedback: jsonb('instant_feedback').notNull(),
  commonMistakeDetection: jsonb('common_mistake_detection').notNull(),
  performanceAnalytics: jsonb('performance_analytics').notNull(),
  revisionRecommendations: jsonb('revision_recommendations').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 9. ASSIGNMENT SECTION DOMAIN
// ==========================================
export const tutorialSectionAssignment = pgTable('tutorial_section_assignment', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  title: text('title').notNull(),
  description: text('description').notNull(),
  xp: integer('xp').notNull().default(0),
  duration: text('duration').notNull(),
  task: jsonb('task').notNull(),
  objectives: jsonb('objectives').notNull(),
  starterCode: text('starter_code').notNull(),
  submissionGuidelines: jsonb('submission_guidelines').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 10. PROJECT SECTION DOMAIN
// ==========================================
export const tutorialSectionProject = pgTable('tutorial_section_project', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  title: text('title').notNull(),
  description: text('description').notNull(),
  xp: integer('xp').notNull().default(0),
  deadline: text('deadline').notNull(),
  hero: jsonb('hero').notNull(),
  realWorldUse: text('real_world_use').notNull(),
  skills: jsonb('skills').notNull(),
  buildItems: jsonb('build_items').notNull(),
  deliverables: jsonb('deliverables').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 11. QUIZ SECTION DOMAIN
// ==========================================
export const tutorialSectionQuiz = pgTable('tutorial_section_quiz', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  title: text('title').notNull(),
  description: text('description').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  duration: text('duration').notNull(),
  xp: integer('xp').notNull().default(0),
  questions: jsonb('questions').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 12. SUMMARY SECTION DOMAIN
// ==========================================
export const tutorialSectionSummary = pgTable('tutorial_section_summary', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  title: text('title').notNull(),
  description: text('description').notNull(),
  masteryRecapCard: jsonb('mastery_recap_card').notNull(),
  keyTakeawayGrid: jsonb('key_takeaway_grid').notNull(),
  revisionChecklist: jsonb('revision_checklist').notNull(),
  nextStepPanel: jsonb('next_step_panel').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 13. INTERVIEW SECTION DOMAIN
// ==========================================
export const tutorialSectionInterview = pgTable('tutorial_section_interview', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  title: text('title').notNull(),
  description: text('description').notNull(),
  interviewIntroCard: jsonb('interview_intro_card').notNull(),
  questionBankPanel: jsonb('question_bank_panel').notNull(),
  answerFrameworkCard: jsonb('answer_framework_card').notNull(),
  mockInterviewFlow: jsonb('mock_interview_flow').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ==========================================
// 14. AI TUTOR SECTION DOMAIN
// ==========================================
export const tutorialSectionAITutor = pgTable('tutorial_section_ai_tutor', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  
  greeting: text('greeting').notNull(),
  qaPairs: jsonb('qa_pairs').notNull(),
  tutorPromptCard: jsonb('tutor_prompt_card').notNull(),
  misconceptionDetector: jsonb('misconception_detector').notNull(),
  adaptiveHintPanel: jsonb('adaptive_hint_panel').notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});
