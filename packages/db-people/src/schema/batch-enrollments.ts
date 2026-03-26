import { index, pgTable, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { enrollmentStatusEnum } from './enums';
import { batches } from './batches';
import { users } from './users';

export const batchEnrollments = pgTable(
  'batch_enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    batchId: uuid('batch_id').notNull().references(() => batches.id, { onDelete: 'cascade' }),
    studentUserId: uuid('student_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    status: enrollmentStatusEnum('status').notNull().default('active'),
    droppedAt: timestamp('dropped_at', { withTimezone: true, mode: 'date' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => ({
    idxEnrollmentsBatchStudent: uniqueIndex('idx_enrollments_batch_student')
      .on(table.batchId, table.studentUserId)
      .where(sql`${table.deletedAt} IS NULL`),
    idxEnrollmentsStudent: index('idx_enrollments_student').on(table.studentUserId, table.status),
  })
);
