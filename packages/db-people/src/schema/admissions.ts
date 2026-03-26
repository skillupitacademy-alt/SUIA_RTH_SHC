import { index, jsonb, pgTable, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { admissionStatusEnum, admissionTypeEnum } from './enums';
import { enquiries } from './enquiries';
import { users } from './users';
import { domains } from './hierarchy';
import { batches } from './batches';

export const admissions = pgTable(
  'admissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    enquiryId: uuid('enquiry_id').notNull().references(() => enquiries.id, { onDelete: 'cascade' }),
    studentUserId: uuid('student_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    admissionType: admissionTypeEnum('admission_type').notNull(),
    domainId: uuid('domain_id').references(() => domains.id, { onDelete: 'set null' }),
    batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'set null' }),
    status: admissionStatusEnum('status').notNull().default('pending'),
    admissionDate: timestamp('admission_date', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    documents: jsonb('documents').notNull().default({}),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxAdmissionsStudent: uniqueIndex('idx_admissions_student')
      .on(table.studentUserId)
      .where(sql`${table.deletedAt} IS NULL`),
    idxAdmissionsStatus: index('idx_admissions_status').on(table.status, table.createdAt),
    idxAdmissionsBatch: index('idx_admissions_batch').on(table.batchId),
  })
);
