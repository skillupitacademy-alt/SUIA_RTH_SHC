import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users';

export const studentPlacementProfiles = pgTable('student_placement_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  roleGoal: text('role_goal').notNull(),
  resumeStatus: text('resume_status').notNull(),
  profileCompletion: integer('profile_completion').notNull().default(0),
  interviewCount: integer('interview_count').notNull().default(0),
  skills: text('skills').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});
