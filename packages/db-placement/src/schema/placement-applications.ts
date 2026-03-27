import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { placementApplicationStatusEnum } from './enums';

export const placementApplications = pgTable(
  'placement_applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: text('student_id').notNull(),
    listingId: uuid('listing_id').notNull(),
    status: placementApplicationStatusEnum('status').notNull().default('applied'),
    appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    uqPlacementApplicationsStudentListing: uniqueIndex('uq_placement_applications_student_listing').on(
      table.studentId,
      table.listingId
    ),
    idxPlacementApplicationsStatus: index('idx_placement_applications_status').on(table.status),
  })
);
