import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { placementInterviewStatusEnum } from './enums';

export const placementInterviews = pgTable(
  'placement_interviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: text('student_id').notNull(),
    listingId: uuid('listing_id').notNull(),
    interviewerName: text('interviewer_name').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    status: placementInterviewStatusEnum('status').notNull().default('scheduled'),
    meetingUrl: text('meeting_url'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    idxPlacementInterviewsStudent: index('idx_placement_interviews_student').on(table.studentId),
    idxPlacementInterviewsListing: index('idx_placement_interviews_listing').on(table.listingId),
    idxPlacementInterviewsStatusScheduledAt: index('idx_placement_interviews_status_scheduled_at').on(
      table.status,
      table.scheduledAt
    ),
  })
);
