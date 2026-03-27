import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { jobListingStatusEnum } from './enums';

export const jobListings = pgTable(
  'job_listings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    domainId: uuid('domain_id').notNull(),
    companyName: text('company_name').notNull(),
    title: text('title').notNull(),
    location: text('location').notNull(),
    jobType: text('job_type').notNull(),
    status: jobListingStatusEnum('status').notNull().default('open'),
    deadline: timestamp('deadline', { withTimezone: true }).notNull(),
    ctcMin: integer('ctc_min'),
    ctcMax: integer('ctc_max'),
    requiredSkills: text('required_skills').array().notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    idxJobListingsDomainStatus: index('idx_job_listings_domain_status').on(table.domainId, table.status),
    idxJobListingsOpenDeadline: index('idx_job_listings_open_deadline')
      .on(table.deadline)
      .where(sql`${table.status} = 'open'`),
    uqJobListingsCompanyTitle: uniqueIndex('uq_job_listings_company_title').on(table.companyName, table.title),
  })
);
