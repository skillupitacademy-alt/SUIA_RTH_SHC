/* istanbul ignore file */
import { integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

import { tutorialContentJobStatusEnum, tutorialDifficultyEnum } from './enums';

export const contentGenerationJobs = pgTable('content_generation_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  subtopicId: uuid('subtopic_id').notNull(),
  difficulty: tutorialDifficultyEnum('difficulty').notNull(),
  status: tutorialContentJobStatusEnum('status').notNull().default('pending'),
  promptVersion: integer('prompt_version').notNull().default(1),
  prompt: jsonb('prompt'),
  result: jsonb('result'),
  error: text('error'),
  generatedBy: uuid('generated_by'),
  processedAt: timestamp('processed_at', { mode: 'date' }),
  retryCount: integer('retry_count').notNull().default(0),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxContentGenerationJobsSubtopic: index('idx_content_generation_jobs_subtopic').on(table.subtopicId, table.status),
}));
