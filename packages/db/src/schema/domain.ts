import { pgTable, text, timestamp, uuid, integer, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { statusEnum } from "./enums";

// --- EDUCATIONAL HIERARCHY ---

export const domains = pgTable("domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category"),
  status: statusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  domainId: uuid("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  status: statusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  complexityLevel: integer("complexity_level").notNull().default(1),
  weight: integer("weight").notNull().default(1),
  status: statusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subtopics = pgTable("subtopics", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  depthLevel: integer("depth_level").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- SKILL MAPPING ---

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  category: text("category"),
  mappingType: text("mapping_type"), // conceptual, technical, practical
});

export const topicSkills = pgTable("topic_skills", {
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.topicId, t.skillId] }),
}));

// --- RELATIONS ---

export const domainsRelations = relations(domains, ({ many }) => ({
  subjects: many(subjects),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  domain: one(domains, {
    fields: [subjects.domainId],
    references: [domains.id],
  }),
  topics: many(topics),
}));

import { questions, questionSkills } from "./question";

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [topics.subjectId],
    references: [subjects.id],
  }),
  subtopics: many(subtopics),
  topicSkills: many(topicSkills),
  questions: many(questions),
}));

export const subtopicsRelations = relations(subtopics, ({ one }) => ({
  topic: one(topics, {
    fields: [subtopics.topicId],
    references: [topics.id],
  }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  topicSkills: many(topicSkills),
  questionSkills: many(questionSkills),
}));

export const topicSkillsRelations = relations(topicSkills, ({ one }) => ({
  topic: one(topics, {
    fields: [topicSkills.topicId],
    references: [topics.id],
  }),
  skill: one(skills, {
    fields: [topicSkills.skillId],
    references: [skills.id],
  }),
}));
