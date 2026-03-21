/* istanbul ignore file */
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';

import type { TutorialContentJSON } from '@quiz/types';

import { tutorialDifficultyEnum } from './enums';

export const tutorialContent = pgTable('tutorial_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  subtopicId: uuid('subtopic_id').notNull(),
  difficulty: tutorialDifficultyEnum('difficulty').notNull(),
  contentType: text('content_type').notNull().default('standard'),
  content: jsonb('content').$type<TutorialContentJSON>().notNull(),
  version: integer('version').notNull().default(1),
  language: text('language').notNull().default('en'),
  isPublished: boolean('is_published').notNull().default(false),
  generatedByAi: boolean('generated_by_ai').notNull().default(false),
  aiModelUsed: text('ai_model_used'),
  generationJobId: uuid('generation_job_id'),
  adminApprovedBy: uuid('admin_approved_by'),
  adminApprovedAt: timestamp('admin_approved_at', { mode: 'date' }),
  qualityScore: jsonb('quality_score'),
  regenerationCount: integer('regeneration_count').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxTutorialContentSubtopic: index('idx_tutorial_content_subtopic').on(table.subtopicId),
  idxTutorialContentPublished: index('idx_tutorial_content_published').on(table.subtopicId, table.isPublished),
  uqTutorialContentVersion: uniqueIndex('uq_tutorial_content_subtopic_difficulty_type').on(
    table.subtopicId,
    table.difficulty,
    table.contentType
  ),
  idxTutorialContentContentGin: index('idx_tutorial_content_content_gin').using('gin', table.content),
}));
