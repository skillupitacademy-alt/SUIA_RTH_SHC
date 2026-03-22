/* istanbul ignore file */
import { index, pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

import { liveSessionRequestStatusEnum } from './enums';

export const liveSessionRequests = pgTable('live_session_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull(),
  subtopicId: uuid('subtopic_id').notNull(),
  doubtText: text('doubt_text'),
  status: liveSessionRequestStatusEnum('status').notNull().default('pending'),
  facultyId: uuid('faculty_id'),
  meetingLink: text('meeting_link'),
  scheduledAt: timestamp('scheduled_at', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  cancelledReason: text('cancelled_reason'),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  idxSessionRequestsStudent: index('idx_session_requests_student').on(table.studentId),
  idxSessionRequestsFaculty: index('idx_session_requests_faculty').on(table.facultyId),
  idxSessionRequestsStatus: index('idx_session_requests_status').on(table.status),
}));
