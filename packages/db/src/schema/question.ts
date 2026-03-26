import { pgTable, text, timestamp, uuid, integer, jsonb, primaryKey, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { topics, subtopics, skills } from "./domain";
import { statusEnum, questionTypeEnum, difficultyEnum, mappingTypeEnum } from "./enums";

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  subtopicId: uuid("subtopic_id")
    .references(() => subtopics.id, { onDelete: "set null" }),
  skillId: uuid("skill_id") // Deprecated in favor of question_skills
    .references(() => skills.id, { onDelete: "set null" }),
  difficulty: difficultyEnum("difficulty").notNull(),
  type: questionTypeEnum("type").notNull().default("mcq"),
  mappingType: mappingTypeEnum("mapping_type"),
  questionText: text("question_text").notNull(),
  options: jsonb("options").notNull(), // Array of strings or objects
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  codeSnippet: text("code_snippet"),
  metadata: jsonb("metadata"), // For future AI/platform extensions
  status: statusEnum("status").notNull().default("active"),
  deletedAt: timestamp("deleted_at"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  idx_questions_selection_filter: index("idx_questions_selection_filter").on(t.topicId, t.subtopicId, t.difficulty),
  idx_questions_active_partial: index("idx_questions_active_partial").on(t.id).where(sql`${t.status} = 'active'`),
  idx_questions_subtopic_id: index("idx_questions_subtopic_id").on(t.subtopicId),
}));

export const questionSkills = pgTable("question_skills", {
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  }, (t) => ({
    pk: primaryKey({ columns: [t.questionId, t.skillId] }),
  }));
