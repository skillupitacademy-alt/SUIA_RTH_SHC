import { boolean, integer, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

export const placementJobs = pgTable(
  'placement_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    company: text('company').notNull(),
    title: text('title').notNull(),
    location: text('location').notNull(),
    matchScore: integer('match_score').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxPlacementJobsActive: index('idx_placement_jobs_active').on(table.isActive, table.matchScore),
  })
);
