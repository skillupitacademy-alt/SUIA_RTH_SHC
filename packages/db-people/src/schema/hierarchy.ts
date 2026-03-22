import { jsonb, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

export const domains = pgTable(
  'domains',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => ({
    slugUnique: uniqueIndex('domains_slug_unique').on(table.slug),
  })
);

export const subjects = pgTable(
  'subjects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    domainId: uuid('domain_id').notNull().references(() => domains.id),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => ({
    slugUnique: uniqueIndex('subjects_slug_unique').on(table.slug),
  })
);

export const topics = pgTable(
  'topics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subjectId: uuid('subject_id').notNull().references(() => subjects.id),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => ({
    slugUnique: uniqueIndex('topics_slug_unique').on(table.slug),
  })
);

export const subtopics = pgTable(
  'subtopics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    topicId: uuid('topic_id').notNull().references(() => topics.id),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    difficultyLevels: jsonb('difficulty_levels').$type<string[]>().notNull().default([]),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => ({
    slugUnique: uniqueIndex('subtopics_slug_unique').on(table.slug),
  })
);
