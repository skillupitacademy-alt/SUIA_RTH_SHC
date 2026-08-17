/* istanbul ignore file */
import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, index } from 'drizzle-orm/pg-core';
import type {
  TutorialContentPayloadByType,
  TutorialContentSourceFormat,
  TutorialContentStatus,
  TutorialPageContentType,
  TutorialSidebarBrandId,
} from '@quiz/types';

import { tutorialDomains } from './tutorial-domains';
import { tutorialSubjects } from './tutorial-subjects';
import { tutorialTopics } from './tutorial-topics';
import { tutorialSubtopics } from './tutorial-subtopics';

export const tutorialPageContentV2 = pgTable('tutorial_page_content_v2', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: text('brand_id').$type<TutorialSidebarBrandId>().notNull(),
  domainId: uuid('domain_id').notNull().references(() => tutorialDomains.id),
  subjectId: uuid('subject_id').notNull().references(() => tutorialSubjects.id),
  topicId: uuid('topic_id').notNull().references(() => tutorialTopics.id),
  subtopicId: uuid('subtopic_id').notNull().references(() => tutorialSubtopics.id),
  contentType: text('content_type').$type<TutorialPageContentType>().notNull(),
  payload: jsonb('payload').$type<TutorialContentPayloadByType[TutorialPageContentType]>().notNull(),
  sourceFormat: text('source_format').$type<TutorialContentSourceFormat>().notNull().default('json'),
  sourceContent: text('source_content').notNull(),
  status: text('status').$type<TutorialContentStatus>().notNull().default('draft'),
  version: integer('version').notNull().default(1),
  publishedAt: timestamp('published_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  idxTutorialPageContentV2Scope: index('idx_tutorial_page_content_v2_scope').on(
    table.brandId,
    table.domainId,
    table.subjectId,
    table.topicId,
    table.subtopicId
  ),
  uqTutorialPageContentV2Scope: uniqueIndex('uq_tutorial_page_content_v2_scope').on(
    table.brandId,
    table.subtopicId,
    table.contentType
  ),
}));

export type TutorialPageContentV2 = typeof tutorialPageContentV2.$inferSelect;
export type NewTutorialPageContentV2 = typeof tutorialPageContentV2.$inferInsert;
