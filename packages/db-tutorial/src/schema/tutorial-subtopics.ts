/* istanbul ignore file */
import { jsonb, pgTable, text, timestamp, uniqueIndex, uuid, index } from 'drizzle-orm/pg-core';

import { tutorialTopics } from './tutorial-topics';

export const tutorialSubtopics = pgTable('tutorial_subtopics', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: uuid('external_id').notNull(),
  topicId: uuid('topic_id')
    .notNull()
    .references(() => tutorialTopics.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  difficultyLevels: jsonb('difficulty_levels').$type<string[]>().notNull().default([]),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  uqTutorialSubtopicsExternalId: uniqueIndex('uq_tutorial_subtopics_external_id').on(table.externalId),
  uqTutorialSubtopicsSlug: uniqueIndex('uq_tutorial_subtopics_slug').on(table.slug),
  idxTutorialSubtopicsTopicId: index('idx_tutorial_subtopics_topic_id').on(table.topicId),
}));
