import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { placementProfileStatusEnum } from './enums';

export const studentPlacementProfiles = pgTable(
  'student_placement_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    status: placementProfileStatusEnum('status').notNull().default('active'),
    readinessScore: integer('readiness_score').notNull().default(0),
    skills: text('skills').array().notNull(),
    preferredLocation: text('preferred_location'),
    expectedCtc: integer('expected_ctc'),
    experienceSummary: text('experience_summary'),
    resumeUrl: text('resume_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    uqStudentPlacementProfilesUser: uniqueIndex('uq_student_placement_profiles_user').on(table.userId),
    idxStudentPlacementProfilesStatus: index('idx_student_placement_profiles_status').on(table.status),
  })
);
