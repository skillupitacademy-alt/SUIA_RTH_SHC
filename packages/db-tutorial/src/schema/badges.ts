/* istanbul ignore file */
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

import { tutorialProjectLevelEnum, tutorialProjectScopeEnum } from './enums';

export const badges = pgTable('badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  level: tutorialProjectLevelEnum('level'),
  scope: tutorialProjectScopeEnum('scope'),
  criteria: jsonb('criteria'),
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxBadgesScope: index('idx_badges_scope').on(table.scope, table.level),
}));
