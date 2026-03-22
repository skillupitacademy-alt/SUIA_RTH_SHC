/* istanbul ignore file */
import { pgTable, text, timestamp, uniqueIndex, uuid, index } from 'drizzle-orm/pg-core';

import { tutorialSubjects } from './tutorial-subjects';

export const tutorialTopics = pgTable('tutorial_topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: uuid('external_id').notNull(),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => tutorialSubjects.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  uqTutorialTopicsExternalId: uniqueIndex('uq_tutorial_topics_external_id').on(table.externalId),
  uqTutorialTopicsSlug: uniqueIndex('uq_tutorial_topics_slug').on(table.slug),
  idxTutorialTopicsSubjectId: index('idx_tutorial_topics_subject_id').on(table.subjectId),
}));
