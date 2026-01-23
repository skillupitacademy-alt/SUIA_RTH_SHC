import { pgTable, text, timestamp, uuid, integer, jsonb, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { domains, subjects, topics } from "./domain";
import { questions } from "./question";

export const examStatusEnum = pgEnum("exam_status", ["started", "completed", "abandoned"]);

export const examBlueprints = pgTable("exam_blueprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  domains: uuid("domain_ids").array(),
  subjects: uuid("subject_ids").array(),
  topics: uuid("topic_ids").array(),
  totalQuestions: integer("total_questions").notNull().default(10),
  timeLimit: integer("time_limit"), // in minutes
  difficultyDistribution: jsonb("difficulty_distribution").notNull().default({
    simple: 30,
    intermediate: 30,
    expert: 40
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exams = pgTable("exams", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  blueprintId: uuid("blueprint_id")
    .references(() => examBlueprints.id, { onDelete: "set null" }),
  status: examStatusEnum("status").notNull().default("started"),
  totalScore: integer("total_score"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const examQuestions = pgTable("exam_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct"),
  responseMetadata: jsonb("response_metadata"), // e.g., time taken per question
  order: integer("order").notNull(),
});

export const resultsByDimension = pgTable("results_by_dimension", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  dimensionType: text("dimension_type").notNull(), // domain, subject, topic, skill, difficulty
  dimensionId: text("dimension_id"), // link to domain/subject/topic/skill id or enum value
  score: integer("score").notNull(),
  accuracy: integer("accuracy").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- RELATIONS ---

export const examBlueprintsRelations = relations(examBlueprints, ({ many }) => ({
  exams: many(exams),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  user: one(users, {
    fields: [exams.userId],
    references: [users.id],
  }),
  blueprint: one(examBlueprints, {
    fields: [exams.blueprintId],
    references: [examBlueprints.id],
  }),
  examQuestions: many(examQuestions),
  dimensions: many(resultsByDimension),
}));

export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({
  exam: one(exams, {
    fields: [examQuestions.examId],
    references: [exams.id],
  }),
  question: one(questions, {
    fields: [examQuestions.questionId],
    references: [questions.id],
  }),
}));

export const resultsByDimensionRelations = relations(resultsByDimension, ({ one }) => ({
  exam: one(exams, {
    fields: [resultsByDimension.examId],
    references: [exams.id],
  }),
}));
