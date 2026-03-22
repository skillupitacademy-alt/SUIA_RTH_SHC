/* istanbul ignore file */
import { pgTable, text, timestamp, uniqueIndex, uuid, index } from 'drizzle-orm/pg-core';

import { tutorialDomains } from './tutorial-domains';

export const tutorialSubjects = pgTable('tutorial_subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: uuid('external_id').notNull(),
  domainId: uuid('domain_id')
    .notNull()
    .references(() => tutorialDomains.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  uqTutorialSubjectsExternalId: uniqueIndex('uq_tutorial_subjects_external_id').on(table.externalId),
  uqTutorialSubjectsSlug: uniqueIndex('uq_tutorial_subjects_slug').on(table.slug),
  idxTutorialSubjectsDomainId: index('idx_tutorial_subjects_domain_id').on(table.domainId),
}));
