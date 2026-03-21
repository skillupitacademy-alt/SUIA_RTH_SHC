import { boolean, integer, pgTable, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const subtopicFlowProgress = pgTable('subtopic_flow_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  subtopicId: uuid('subtopic_id').notNull(),
  laymanReadAt: timestamp('layman_read_at', { mode: 'date' }),
  realLifeReadAt: timestamp('real_life_read_at', { mode: 'date' }),
  technicalReadAt: timestamp('technical_read_at', { mode: 'date' }),
  codeReadAt: timestamp('code_read_at', { mode: 'date' }),
  aiTutorFirstMessageAt: timestamp('ai_tutor_first_message_at', { mode: 'date' }),
  assignmentUnlockedAt: timestamp('assignment_unlocked_at', { mode: 'date' }),
  assignmentCompletedAt: timestamp('assignment_completed_at', { mode: 'date' }),
  currentFlowStep: integer('current_flow_step').notNull().default(1),
  flowCompleted: boolean('flow_completed').notNull().default(false),
  timeOnLaymanSeconds: integer('time_on_layman_seconds').notNull().default(0),
  timeOnTechnicalSeconds: integer('time_on_technical_seconds').notNull().default(0),
  timeOnCodeSeconds: integer('time_on_code_seconds').notNull().default(0),
  totalTimeSeconds: integer('total_time_seconds').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxSubtopicFlowProgressUser: index('idx_subtopic_flow_progress_user').on(table.userId),
  uqSubtopicFlowProgressUserSubtopic: uniqueIndex('uq_subtopic_flow_progress_user_subtopic').on(table.userId, table.subtopicId),
}));
