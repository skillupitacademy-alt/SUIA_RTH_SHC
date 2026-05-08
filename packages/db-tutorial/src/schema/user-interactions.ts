/* istanbul ignore file */
/**
 * User Interaction Tracking Tables
 * Track user interactions with tutorial sections (quiz answers, practice tests, code execution, etc.)
 */

import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { tutorialSections } from './tutorial-sections';

/**
 * Quiz Answers Table
 * Tracks user answers to quiz questions
 */
export const quizAnswers = pgTable('quiz_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull(),
  selectedAnswer: text('selected_answer').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  timeSpent: integer('time_spent').notNull().default(0), // seconds
  attemptNumber: integer('attempt_number').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  idxQuizAnswersUser: index('idx_quiz_answers_user').on(table.userId),
  idxQuizAnswersSection: index('idx_quiz_answers_section').on(table.sectionId),
  idxQuizAnswersQuestion: index('idx_quiz_answers_question').on(table.questionId),
}));

/**
 * Practice Test Answers Table
 * Tracks user answers to practice test questions
 */
export const practiceTestAnswers = pgTable('practice_test_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull(),
  selectedAnswer: text('selected_answer').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  timeSpent: integer('time_spent').notNull().default(0), // seconds
  attemptNumber: integer('attempt_number').notNull().default(1),
  feedbackViewed: boolean('feedback_viewed').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  idxPracticeTestAnswersUser: index('idx_practice_test_answers_user').on(table.userId),
  idxPracticeTestAnswersSection: index('idx_practice_test_answers_section').on(table.sectionId),
  idxPracticeTestAnswersQuestion: index('idx_practice_test_answers_question').on(table.questionId),
}));

/**
 * Code Interactions Table
 * Tracks user interactions with code examples (execution, modifications)
 */
export const codeInteractions = pgTable('code_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  codeExampleId: text('code_example_id').notNull(),
  userCode: text('user_code').notNull(),
  executed: boolean('executed').notNull().default(false),
  executionResult: jsonb('execution_result').$type<{
    success: boolean;
    output?: string;
    error?: string;
  }>(),
  timeSpent: integer('time_spent').notNull().default(0), // seconds
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  idxCodeInteractionsUser: index('idx_code_interactions_user').on(table.userId),
  idxCodeInteractionsSection: index('idx_code_interactions_section').on(table.sectionId),
  idxCodeInteractionsExample: index('idx_code_interactions_example').on(table.codeExampleId),
}));

/**
 * Visual Interactions Table
 * Tracks user interactions with visual explanation components
 */
export const visualInteractions = pgTable('visual_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  componentId: text('component_id').notNull(), // which visual component was viewed
  interactionType: text('interaction_type').notNull(), // 'view', 'expand', 'navigate', 'interact'
  interactionData: jsonb('interaction_data').$type<Record<string, unknown>>(),
  timeSpent: integer('time_spent').notNull().default(0), // seconds
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  idxVisualInteractionsUser: index('idx_visual_interactions_user').on(table.userId),
  idxVisualInteractionsSection: index('idx_visual_interactions_section').on(table.sectionId),
  idxVisualInteractionsComponent: index('idx_visual_interactions_component').on(table.componentId),
}));

/**
 * Section Completions Table
 * Tracks when users complete sections or subsections
 */
export const sectionCompletions = pgTable('section_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => tutorialSections.id, { onDelete: 'cascade' }),
  subsectionId: uuid('subsection_id'), // nullable - for subsection-level tracking
  completedAt: timestamp('completed_at', { mode: 'date' }).notNull().defaultNow(),
  timeSpent: integer('time_spent').notNull().default(0), // seconds
  score: integer('score'), // nullable - for sections with scoring (quiz, practice)
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  idxSectionCompletionsUser: index('idx_section_completions_user').on(table.userId),
  idxSectionCompletionsSection: index('idx_section_completions_section').on(table.sectionId),
  idxSectionCompletionsSubsection: index('idx_section_completions_subsection').on(table.subsectionId),
}));

/**
 * Type inference for TypeScript
 */
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type NewQuizAnswer = typeof quizAnswers.$inferInsert;

export type PracticeTestAnswer = typeof practiceTestAnswers.$inferSelect;
export type NewPracticeTestAnswer = typeof practiceTestAnswers.$inferInsert;

export type CodeInteraction = typeof codeInteractions.$inferSelect;
export type NewCodeInteraction = typeof codeInteractions.$inferInsert;

export type VisualInteraction = typeof visualInteractions.$inferSelect;
export type NewVisualInteraction = typeof visualInteractions.$inferInsert;

export type SectionCompletion = typeof sectionCompletions.$inferSelect;
export type NewSectionCompletion = typeof sectionCompletions.$inferInsert;
