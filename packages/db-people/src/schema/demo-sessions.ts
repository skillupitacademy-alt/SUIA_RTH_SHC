import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { enquiries } from './enquiries';
import { faculty } from './faculty';
import { demoSessionStatusEnum } from './enums';

export const demoSessions = pgTable(
  'demo_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    enquiryId: uuid('enquiry_id').references(() => enquiries.id, { onDelete: 'set null' }),
    facultyId: uuid('faculty_id').references(() => faculty.id, { onDelete: 'set null' }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true, mode: 'date' }).notNull(),
    status: demoSessionStatusEnum('status').notNull().default('scheduled'),
    feedback: text('feedback'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxDemoSessionsEnquiry: index('idx_demo_sessions_enquiry').on(table.enquiryId),
    idxDemoSessionsScheduled: index('idx_demo_sessions_scheduled').on(table.scheduledAt),
  })
);
