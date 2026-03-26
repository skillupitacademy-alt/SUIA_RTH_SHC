import { date, index, integer, numeric, pgTable, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { facultyAvailabilityTypeEnum, facultyStatusEnum } from './enums';
import { users } from './users';

export const faculty = pgTable(
  'faculty',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    specializations: uuid('specializations').array().notNull().default([]),
    availabilityType: facultyAvailabilityTypeEnum('availability_type').notNull(),
    status: facultyStatusEnum('status').notNull().default('active'),
    hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
    ratingAvg: numeric('rating_avg', { precision: 3, scale: 2 }),
    totalSessions: integer('total_sessions').notNull().default(0),
    joinedAt: date('joined_at').notNull().default(sql`CURRENT_DATE`),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => ({
    idxFacultyUser: uniqueIndex('idx_faculty_user')
      .on(table.userId)
      .where(sql`${table.deletedAt} IS NULL`),
    idxFacultyStatus: index('idx_faculty_status').on(table.status),
    idxFacultySpecializations: index('idx_faculty_specializations').using('gin', table.specializations),
  })
);
