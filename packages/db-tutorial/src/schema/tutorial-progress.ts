import { boolean, decimal, integer, jsonb, pgTable, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';

import { tutorialProgressStatusEnum } from './enums';

export const tutorialProgress = pgTable('tutorial_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  subtopicId: uuid('subtopic_id').notNull(),
  status: tutorialProgressStatusEnum('status').notNull().default('not_started'),
  blocksCompleted: jsonb('blocks_completed').$type<string[]>().notNull().default([]),
  remediationTriggered: boolean('remediation_triggered').notNull().default(false),
  score: decimal('score', { precision: 5, scale: 2 }),
  timeSpentSec: integer('time_spent_sec').notNull().default(0),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxTutorialProgressUser: index('idx_tutorial_progress_user').on(table.userId),
  uqTutorialProgressUserSubtopic: uniqueIndex('uq_tutorial_progress_user_subtopic').on(table.userId, table.subtopicId),
}));
