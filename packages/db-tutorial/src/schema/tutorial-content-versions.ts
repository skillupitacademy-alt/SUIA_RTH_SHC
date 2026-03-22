/* istanbul ignore file */
import { index, integer, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import type { TutorialContentJSON } from '@quiz/types';

export const tutorialContentVersions = pgTable('tutorial_content_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id').notNull(),
  version: integer('version').notNull(),
  content: jsonb('content').$type<TutorialContentJSON>().notNull(),
  savedBy: uuid('saved_by').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  idxContentVersionsContentId: index('idx_content_versions_content_id').on(table.contentId),
}));
