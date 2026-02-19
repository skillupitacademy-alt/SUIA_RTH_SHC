import { pgTable, text, timestamp, uuid, integer, primaryKey, index } from "drizzle-orm/pg-core";
import { statusEnum, skillCategoryEnum, mappingTypeEnum } from "./enums";

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
}, (t) => ({
  idx_subjects_domain_id: index("idx_subjects_domain_id").on(t.domainId),
}));

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  complexityLevel: integer("complexity_level").notNull().default(1),
  weight: integer("weight").notNull().default(1),
  learningUrl: text("learning_url"),
  detailedNotesPath: text("detailed_notes_path"),
  status: statusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  idx_topics_subject_id: index("idx_topics_subject_id").on(t.subjectId),
}));

export const subtopics = pgTable("subtopics", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  depthLevel: integer("depth_level").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  idx_subtopics_topic_id: index("idx_subtopics_topic_id").on(t.topicId),
}));

// --- SKILL MAPPING ---

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  category: skillCategoryEnum("category"),
  mappingType: mappingTypeEnum("mapping_type"),
  weight: integer("weight").notNull().default(1),
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

