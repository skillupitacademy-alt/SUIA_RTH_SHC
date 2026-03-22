/* istanbul ignore file */
import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const tutorialDomains = pgTable('tutorial_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: uuid('external_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  uqTutorialDomainsExternalId: uniqueIndex('uq_tutorial_domains_external_id').on(table.externalId),
  uqTutorialDomainsSlug: uniqueIndex('uq_tutorial_domains_slug').on(table.slug),
}));
