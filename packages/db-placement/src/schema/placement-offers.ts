import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { placementOfferStatusEnum } from './enums';

export const placementOffers = pgTable(
  'placement_offers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: text('student_id').notNull(),
    listingId: uuid('listing_id').notNull(),
    status: placementOfferStatusEnum('status').notNull().default('offered'),
    offeredCtc: integer('offered_ctc').notNull(),
    responseDueAt: timestamp('response_due_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    idxPlacementOffersStudent: index('idx_placement_offers_student').on(table.studentId),
    idxPlacementOffersStatus: index('idx_placement_offers_status').on(table.status),
  })
);
