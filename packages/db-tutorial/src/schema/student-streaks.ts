/* istanbul ignore file */
import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const studentStreaks = pgTable('student_streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastActivity: timestamp('last_activity', { mode: 'date' }),
  totalXp: integer('total_xp').notNull().default(0),
  level: text('level').notNull().default('bronze'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  uqStudentStreaksUser: uniqueIndex('uq_student_streaks_user').on(table.userId),
}));
