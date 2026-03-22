/* istanbul ignore file */
import { integer, pgTable, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

import { assignmentProgressStatusEnum, tutorialDifficultyEnum } from './enums';

export const assignmentProgress = pgTable('assignment_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  subtopicId: uuid('subtopic_id').notNull(),
  difficulty: tutorialDifficultyEnum('difficulty').notNull(),
  status: assignmentProgressStatusEnum('status').notNull().default('not_started'),
  startedAt: timestamp('started_at', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  uqAssignmentProgressUserSubtopicDifficulty: uniqueIndex('uq_assignment_progress_user_subtopic_difficulty').on(table.userId, table.subtopicId, table.difficulty),
}));
