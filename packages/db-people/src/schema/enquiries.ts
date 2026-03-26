import { index, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { enquirySourceEnum, enquiryStatusEnum } from './enums';
import { users } from './users';

export const enquiries = pgTable(
  'enquiries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    source: enquirySourceEnum('source').notNull().default('website'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    status: enquiryStatusEnum('status').notNull().default('new'),
    assignedCounsellorId: uuid('assigned_counsellor_id').references(() => users.id, { onDelete: 'set null' }),
    notes: text('notes'),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxEnquiriesStatusCreated: index('idx_enquiries_status_created').on(table.status, table.createdAt),
    idxEnquiriesPhone: uniqueIndex('idx_enquiries_phone')
      .on(table.phone)
      .where(sql`${table.deletedAt} IS NULL`),
    idxEnquiriesCounsellor: index('idx_enquiries_counsellor').on(table.assignedCounsellorId, table.status),
    idxEnquiriesSource: index('idx_enquiries_source').on(table.source, table.createdAt),
  })
);
