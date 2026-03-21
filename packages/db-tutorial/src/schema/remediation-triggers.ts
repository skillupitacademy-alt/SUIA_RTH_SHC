import { jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

import { tutorialTriggerStatusEnum } from './enums';

export const remediationTriggers = pgTable('remediation_triggers', {
  id: uuid('id').primaryKey().defaultRandom(),
  examResultId: uuid('exam_result_id').notNull(),
  userId: uuid('user_id').notNull(),
  weakSubtopicIds: jsonb('weak_subtopic_ids').$type<string[]>().notNull().default([]),
  recommendedContentTypes: jsonb('recommended_content_types').$type<string[]>().notNull().default([]),
  status: tutorialTriggerStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxRemediationTriggersUser: index('idx_remediation_triggers_user').on(table.userId, table.status),
}));
