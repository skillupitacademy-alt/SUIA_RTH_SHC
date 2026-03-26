import { index, pgTable, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

import { attendanceStatusEnum } from './enums';
import { batchSessions } from './batch-sessions';
import { faculty } from './faculty';
import { users } from './users';

export const attendanceRecords = pgTable(
  'attendance_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').notNull().references(() => batchSessions.id, { onDelete: 'cascade' }),
    studentUserId: uuid('student_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').notNull(),
    markedBy: uuid('marked_by').references(() => faculty.id, { onDelete: 'set null' }),
    markedAt: timestamp('marked_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    idxAttendanceSession: index('idx_attendance_session').on(table.sessionId),
    idxAttendanceStudentSession: uniqueIndex('idx_attendance_student_session').on(table.sessionId, table.studentUserId),
    idxAttendanceStudentDate: index('idx_attendance_student_date').on(table.studentUserId, table.markedAt),
  })
);
