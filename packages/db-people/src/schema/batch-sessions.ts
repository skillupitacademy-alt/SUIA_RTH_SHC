import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { sessionStatusEnum } from './enums';
import { batches } from './batches';
import { faculty } from './faculty';

export const batchSessions = pgTable(
  'batch_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    batchId: uuid('batch_id').notNull().references(() => batches.id, { onDelete: 'cascade' }),
    facultyId: uuid('faculty_id').references(() => faculty.id, { onDelete: 'set null' }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true, mode: 'date' }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(60),
    subtopicsCovered: uuid('subtopics_covered').array().notNull().default([]),
    sessionNotes: text('session_notes'),
    status: sessionStatusEnum('status').notNull().default('scheduled'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxBatchSessionsBatchDate: index('idx_batch_sessions_batch_date').on(table.batchId, table.scheduledAt),
    idxBatchSessionsFacultyUpcoming: index('idx_batch_sessions_faculty_upcoming').on(table.facultyId, table.scheduledAt),
    idxBatchSessionsSubtopics: index('idx_batch_sessions_subtopics').using('gin', table.subtopicsCovered),
  })
);
