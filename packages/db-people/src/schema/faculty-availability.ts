import { boolean, index, integer, pgTable, time, uuid } from 'drizzle-orm/pg-core';

import { batches } from './batches';
import { faculty } from './faculty';

export const facultyAvailability = pgTable(
  'faculty_availability',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    facultyId: uuid('faculty_id').notNull().references(() => faculty.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    isBooked: boolean('is_booked').notNull().default(false),
    bookedBatchId: uuid('booked_batch_id').references(() => batches.id, { onDelete: 'set null' }),
  },
  (table) => ({
    idxFacultyAvailFaculty: index('idx_faculty_avail_faculty').on(table.facultyId, table.dayOfWeek),
    idxFacultyAvailUnbooked: index('idx_faculty_avail_unbooked').on(table.facultyId, table.isBooked),
  })
);
