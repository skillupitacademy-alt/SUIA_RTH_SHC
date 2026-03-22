/* istanbul ignore file */
import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { badges } from './badges';
import { tutorialProjectSubmissions } from './tutorial-project-submissions';

export const studentBadges = pgTable('student_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  badgeId: uuid('badge_id').notNull().references(() => badges.id),
  awardedAt: timestamp('awarded_at', { mode: 'date' }).notNull().defaultNow(),
  projectSubmissionId: uuid('project_submission_id').references(() => tutorialProjectSubmissions.id),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  uqStudentBadgesUserBadge: uniqueIndex('uq_student_badges_user_badge').on(table.userId, table.badgeId),
}));
