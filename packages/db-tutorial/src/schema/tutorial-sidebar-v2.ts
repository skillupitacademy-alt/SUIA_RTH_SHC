/* istanbul ignore file */
import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, index } from 'drizzle-orm/pg-core';
import type { TutorialNavigationTree, TutorialSidebarBrandId } from '@quiz/types';

import { tutorialDomains } from './tutorial-domains';
import { tutorialSubjects } from './tutorial-subjects';
import { tutorialTopics } from './tutorial-topics';
import { tutorialSubtopics } from './tutorial-subtopics';

export const tutorialSidebarTreesV2 = pgTable('tutorial_sidebar_trees_v2', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: text('brand_id').$type<TutorialSidebarBrandId>().notNull(),
  domainId: uuid('domain_id').notNull().references(() => tutorialDomains.id),
  subjectId: uuid('subject_id').notNull().references(() => tutorialSubjects.id),
  topicId: uuid('topic_id').notNull().references(() => tutorialTopics.id),
  activeSubtopicId: uuid('active_subtopic_id').references(() => tutorialSubtopics.id),
  tree: jsonb('tree').$type<TutorialNavigationTree>().notNull(),
  sourceFormat: text('source_format').notNull().default('json'),
  sourceContent: text('source_content').notNull(),
  status: text('status').$type<'draft' | 'published'>().notNull().default('draft'),
  version: integer('version').notNull().default(1),
  publishedAt: timestamp('published_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  idxTutorialSidebarTreesV2Scope: index('idx_tutorial_sidebar_trees_v2_scope').on(
    table.brandId,
    table.domainId,
    table.subjectId,
    table.topicId
  ),
  uqTutorialSidebarTreesV2Scope: uniqueIndex('uq_tutorial_sidebar_trees_v2_scope').on(
    table.brandId,
    table.topicId
  ),
}));

export type TutorialSidebarTreeV2 = typeof tutorialSidebarTreesV2.$inferSelect;
export type NewTutorialSidebarTreeV2 = typeof tutorialSidebarTreesV2.$inferInsert;
