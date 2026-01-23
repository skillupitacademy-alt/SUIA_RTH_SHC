import { pgTable, text, timestamp, uuid, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { topics } from "./domain";

export const questionTypeEnum = pgEnum("question_type", ["mcq", "code_mcq"]);
export const difficultyEnum = pgEnum("difficulty", ["simple", "intermediate", "expert"]);

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  difficulty: difficultyEnum("difficulty").notNull(),
  type: questionTypeEnum("type").notNull().default("mcq"),
  questionText: text("question_text").notNull(),
  options: jsonb("options").notNull(), // Array of strings or objects
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  codeSnippet: text("code_snippet"),
  metadata: jsonb("metadata"), // For future AI/platform extensions
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const questionsRelations = relations(questions, ({ one }) => ({
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id],
  }),
}));
