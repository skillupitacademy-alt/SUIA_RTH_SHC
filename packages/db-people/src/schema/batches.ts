import { date, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { batchModeEnum, batchStatusEnum } from './enums';
import { domains, subjects } from './hierarchy';
import { faculty } from './faculty';

export const batches = pgTable(
  'batches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    domainId: uuid('domain_id').references(() => domains.id, { onDelete: 'set null' }),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
    facultyId: uuid('faculty_id').references(() => faculty.id, { onDelete: 'set null' }),
    startDate: date('start_date'),
    endDate: date('end_date'),
    capacity: integer('capacity').notNull().default(0),
    enrolledCount: integer('enrolled_count').notNull().default(0),
    mode: batchModeEnum('mode').notNull().default('online'),
    status: batchStatusEnum('status').notNull().default('upcoming'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => ({
    idxBatchesStatusDomain: index('idx_batches_status_domain').on(table.status, table.domainId),
    idxBatchesFaculty: index('idx_batches_faculty').on(table.facultyId, table.status),
    idxBatchesActive: index('idx_batches_active').on(table.status, table.startDate),
  })
);
