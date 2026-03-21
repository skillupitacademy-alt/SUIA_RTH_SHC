/* istanbul ignore file */
import { boolean, integer, pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const domainContentConfig = pgTable('domain_content_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  domainId: uuid('domain_id').notNull(),
  audienceProfile: text('audience_profile').notNull(),
  defaultLanguage: text('default_language').notNull().default('en'),
  seoTitleTemplate: text('seo_title_template'),
  aiTutorEnabled: boolean('ai_tutor_enabled').notNull().default(true),
  contentReviewRequired: boolean('content_review_required').notNull().default(true),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  uqDomainContentConfigDomain: uniqueIndex('uq_domain_content_config_domain').on(table.domainId),
  idxDomainContentConfigDomain: index('idx_domain_content_config_domain').on(table.domainId, table.defaultLanguage),
}));
