import { pgTable, text, timestamp, uuid, integer, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { topics, subtopics, skills } from "./domain";
import { statusEnum, questionTypeEnum, difficultyEnum } from "./enums";

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
  questionText: text("question_text").notNull(),
  options: jsonb("options").notNull(), // Array of strings or objects
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  codeSnippet: text("code_snippet"),
  metadata: jsonb("metadata"), // For future AI/platform extensions
  status: statusEnum("status").notNull().default("active"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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

export const questionsRelations = relations(questions, ({ one, many }) => ({
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id],
  }),
  subtopic: one(subtopics, {
    fields: [questions.subtopicId],
    references: [subtopics.id],
  }),
  questionSkills: many(questionSkills),
}));

export const questionSkillsRelations = relations(questionSkills, ({ one }) => ({
    question: one(questions, {
      fields: [questionSkills.questionId],
      references: [questions.id],
    }),
    skill: one(skills, {
      fields: [questionSkills.skillId],
      references: [skills.id],
    }),
  }));
