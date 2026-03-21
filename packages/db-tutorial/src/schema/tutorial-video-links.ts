import { boolean, integer, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

import { tutorialDifficultyEnum, tutorialVideoProviderEnum } from './enums';

export const tutorialVideoLinks = pgTable('tutorial_video_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  subtopicId: uuid('subtopic_id'),
  projectId: uuid('project_id'),
  assignmentDifficulty: tutorialDifficultyEnum('assignment_difficulty'),
  provider: tutorialVideoProviderEnum('provider').notNull(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  durationSeconds: integer('duration_seconds'),
  captionsAvailable: boolean('captions_available').notNull().default(false),
  approvedByAdmin: boolean('approved_by_admin').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxTutorialVideoSubtopic: index('idx_tutorial_video_links_subtopic').on(table.subtopicId),
}));
