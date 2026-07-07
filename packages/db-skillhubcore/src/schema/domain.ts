import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  decimal,
  primaryKey,
  uniqueIndex,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  statusEnum,
  domainCategoryEnum,
  topicComplexityEnum,
  skillCategoryEnum,
} from './enums';

// ==================== DOMAINS ====================
export const domains = pgTable('domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  category: domainCategoryEnum('category').notNull(),
  status: statusEnum('status').notNull().default('active'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('domains_name_unique').on(table.name),
  index('domains_category_idx').on(table.category),
  index('domains_status_idx').on(table.status),
  index('domains_order_idx').on(table.order),
]);

// ==================== SUBJECTS ====================
export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  domainId: uuid('domain_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  order: integer('order').notNull().default(0),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('subjects_domain_name_unique').on(table.domainId, table.name),
  foreignKey({
    columns: [table.domainId],
    foreignColumns: [domains.id],
    name: 'subjects_domain_id_fk',
  }),
  index('subjects_domain_idx').on(table.domainId),
  index('subjects_status_idx').on(table.status),
  index('subjects_order_idx').on(table.order),
]);

// ==================== TOPICS ====================
export const topics = pgTable('topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  subjectId: uuid('subject_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  complexity: topicComplexityEnum('complexity').notNull().default('beginner'),
  weight: decimal('weight', { precision: 3, scale: 2 })
    .notNull()
    .default('1.00'),
  order: integer('order').notNull().default(0),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('topics_subject_name_unique').on(table.subjectId, table.name),
  foreignKey({
    columns: [table.subjectId],
    foreignColumns: [subjects.id],
    name: 'topics_subject_id_fk',
  }),
  index('topics_subject_idx').on(table.subjectId),
  index('topics_complexity_idx').on(table.complexity),
  index('topics_status_idx').on(table.status),
  index('topics_order_idx').on(table.order),
]);

// ==================== SUBTOPICS ====================
export const subtopics = pgTable('subtopics', {
  id: uuid('id').primaryKey().defaultRandom(),
  topicId: uuid('topic_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  depth: integer('depth').notNull().default(1),
  order: integer('order').notNull().default(0),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('subtopics_topic_name_unique').on(table.topicId, table.name),
  foreignKey({
    columns: [table.topicId],
    foreignColumns: [topics.id],
    name: 'subtopics_topic_id_fk',
  }),
  index('subtopics_topic_idx').on(table.topicId),
  index('subtopics_depth_idx').on(table.depth),
  index('subtopics_status_idx').on(table.status),
  index('subtopics_order_idx').on(table.order),
]);

// ==================== SKILLS ====================
export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  category: skillCategoryEnum('category').notNull(),
  weight: decimal('weight', { precision: 3, scale: 2 })
    .notNull()
    .default('1.00'),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('skills_name_unique').on(table.name),
  index('skills_category_idx').on(table.category),
  index('skills_status_idx').on(table.status),
]);

// ==================== TOPIC_SKILLS (Many-to-Many) ====================
export const topicSkills = pgTable(
  'topic_skills',
  {
    topicId: uuid('topic_id').notNull(),
    skillId: uuid('skill_id').notNull(),
    relevance: decimal('relevance', { precision: 3, scale: 2 })
      .notNull()
      .default('0.50'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.topicId, table.skillId] }),
    foreignKey({
      columns: [table.topicId],
      foreignColumns: [topics.id],
      name: 'topic_skills_topic_id_fk',
    }),
    foreignKey({
      columns: [table.skillId],
      foreignColumns: [skills.id],
      name: 'topic_skills_skill_id_fk',
    }),
    index('topic_skills_topic_idx').on(table.topicId),
    index('topic_skills_skill_idx').on(table.skillId),
  ]
);