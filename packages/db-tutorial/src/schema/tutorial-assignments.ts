/* istanbul ignore file */
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

import { assignmentQuestionTypeEnum, tutorialDifficultyEnum } from './enums';

export const tutorialAssignments = pgTable('tutorial_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  subtopicId: uuid('subtopic_id').notNull(),
  difficulty: tutorialDifficultyEnum('difficulty').notNull(),
  questionType: assignmentQuestionTypeEnum('question_type').notNull(),
  question: text('question').notNull().default(''),
  hints: jsonb('hints').$type<string[]>().notNull().default([]),
  referenceAnswer: text('reference_answer').notNull().default(''),
  title: text('title').notNull().default(''),
  content: jsonb('content').notNull(),
  orderIndex: integer('order_index'),
  points: integer('points').notNull().default(10),
  timeLimitSec: integer('time_limit_sec'),
  isPublished: boolean('is_published').notNull().default(false),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxAssignmentsSubtopicDifficulty: index('idx_assignments_subtopic_diff').on(table.subtopicId, table.difficulty),
}));
