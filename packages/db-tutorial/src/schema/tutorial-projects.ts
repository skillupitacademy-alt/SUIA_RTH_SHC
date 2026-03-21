import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

import {
  tutorialDeliverableTypeEnum,
  tutorialEvaluationTypeEnum,
  tutorialProjectLevelEnum,
  tutorialProjectScopeEnum,
} from './enums';

export const tutorialProjects = pgTable('tutorial_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  scope: tutorialProjectScopeEnum('scope').notNull(),
  parentId: uuid('parent_id').notNull(),
  level: tutorialProjectLevelEnum('level').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  deliverableType: tutorialDeliverableTypeEnum('deliverable_type').notNull(),
  evaluationType: tutorialEvaluationTypeEnum('evaluation_type').notNull(),
  estimatedHours: integer('estimated_hours'),
  badgeId: uuid('badge_id'),
  subtopicsCovered: jsonb('subtopics_covered').$type<string[]>().notNull().default([]),
  prerequisites: jsonb('prerequisites').$type<string[]>().notNull().default([]),
  isPublished: boolean('is_published').notNull().default(false),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxTutorialProjectsScope: index('idx_tutorial_projects_scope').on(table.scope, table.level),
}));
