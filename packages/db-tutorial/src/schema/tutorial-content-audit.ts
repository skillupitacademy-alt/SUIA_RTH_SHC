/* istanbul ignore file */
import { index, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { tutorialContentAuditActionEnum } from './enums';

export const tutorialContentAudit = pgTable('tutorial_content_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id').notNull(),
  userId: uuid('user_id').notNull(),
  action: tutorialContentAuditActionEnum('action').notNull(),
  diff: jsonb('diff'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  idxContentAuditContentId: index('idx_content_audit_content_id').on(table.contentId),
}));
