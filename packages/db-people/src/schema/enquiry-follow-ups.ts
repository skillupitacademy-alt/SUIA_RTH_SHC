import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users';
import { enquiries } from './enquiries';

export const enquiryFollowUps = pgTable(
  'enquiry_follow_ups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    enquiryId: uuid('enquiry_id').notNull().references(() => enquiries.id, { onDelete: 'cascade' }),
    counsellorId: uuid('counsellor_id').references(() => users.id, { onDelete: 'set null' }),
    followUpType: text('follow_up_type').notNull(),
    notes: text('notes'),
    nextFollowUpAt: timestamp('next_follow_up_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxFollowupsEnquiry: index('idx_followups_enquiry').on(table.enquiryId),
    idxFollowupsScheduled: index('idx_followups_scheduled').on(table.nextFollowUpAt),
  })
);
