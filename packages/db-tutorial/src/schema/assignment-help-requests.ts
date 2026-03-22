/* istanbul ignore file */
import { integer, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

import { assignmentHelpRequestStatusEnum } from './enums';
import { tutorialAssignments } from './tutorial-assignments';

export const assignmentHelpRequests = pgTable('assignment_help_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  subtopicId: uuid('subtopic_id').notNull(),
  assignmentId: uuid('assignment_id')
    .notNull()
    .references(() => tutorialAssignments.id),
  question: text('question').notNull(),
  status: assignmentHelpRequestStatusEnum('status').notNull().default('open'),
  assignedTo: uuid('assigned_to'),
  resolvedAt: timestamp('resolved_at', { mode: 'date' }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  uqAssignmentHelpRequestUserAssignment: uniqueIndex('uq_assignment_help_request_user_assignment').on(table.userId, table.assignmentId, table.subtopicId),
}));
