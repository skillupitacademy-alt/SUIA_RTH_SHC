import { pgTable, text, timestamp, uuid, integer, jsonb, pgEnum, boolean, index, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { relations, desc } from "drizzle-orm";
import { users } from "./auth";
import { domains, subjects, topics } from "./domain";
import { questions } from "./question";

export const examStatusEnum = pgEnum("exam_status", ["started", "processing", "completed", "abandoned", "failed"]);
export const reportJobStatusEnum = pgEnum("report_job_status", ["queued", "processing", "completed", "failed"]);

export const examBlueprints = pgTable("exam_blueprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  domains: uuid("domain_ids").array(),
  subjects: uuid("subject_ids").array(),
  topics: uuid("topic_ids").array(),
  subtopics: uuid("subtopic_ids").array(),
  questionIds: uuid("question_ids").array(),
  totalQuestions: integer("total_questions").notNull().default(10),
  timeLimit: integer("time_limit"), // in minutes
  difficultyDistribution: jsonb("difficulty_distribution").notNull().default({
    simple: 30,
    intermediate: 30,
    expert: 40
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exams = (pgTable("exams", {
  id: uuid("id").notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  blueprintId: uuid("blueprint_id")
    .references(() => examBlueprints.id, { onDelete: "set null" }),
  status: examStatusEnum("status").notNull().default("started"),
  totalScore: integer("total_score"),
  durationSeconds: integer("duration_seconds"), // Snapshotted from blueprint or provided at start
  startedAt: timestamp("started_at").notNull().defaultNow(),
  lastAnsweredAt: timestamp("last_answered_at"),
  completedAt: timestamp("completed_at"),
  reportMaterialized: jsonb("report_materialized"),
  exportUrls: jsonb("export_urls"),
}, (t) => [
  primaryKey({ columns: [t.id, t.startedAt] }),
  index("idx_exams_user_id_status").on(t.userId, t.status),
  index("idx_exams_dashboard_opt").on(t.userId, t.status, desc(t.completedAt)),
  index("idx_exams_blueprint_id").on(t.blueprintId),
]));

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
}, (t) => ({
  unq_exam_question: uniqueIndex("unq_exam_question").on(t.examId, t.questionId),
  unq_exam_order: uniqueIndex("unq_exam_order").on(t.examId, t.order),
  idx_exam_questions_exam_order: index("idx_exam_questions_exam_order").on(t.examId, t.order),
}));

export const reportJobs = pgTable("report_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  status: reportJobStatusEnum("status").notNull().default("queued"),
  progress: integer("progress").notNull().default(0),
  pdfUrl: text("pdf_url"),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  idx_report_jobs_exam_id: index("idx_report_jobs_exam_id").on(t.examId),
  idx_report_jobs_status: index("idx_report_jobs_status").on(t.status),
}));

export const idempotencyKeys = pgTable("idempotency_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  unq_user_key: uniqueIndex("unq_user_key").on(t.userId, t.key),
}));

export const resultsByDimension = pgTable("results_by_dimension", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  dimensionType: text("dimension_type").notNull(), // domain, subject, topic, skill, difficulty
  dimensionId: text("dimension_id"), // link to domain/subject/topic/skill id or enum value
  name: text("name"), // descriptive name for the dimension (e.g. "Mathematics")
  score: integer("score").notNull(),
  accuracy: integer("accuracy").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  idx_results_by_dimension_exam_id: index("idx_results_by_dimension_exam_id").on(t.examId),
}));

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
  reportJobs: many(reportJobs),
}));

export const reportJobsRelations = relations(reportJobs, ({ one }) => ({
  user: one(users, {
    fields: [reportJobs.userId],
    references: [users.id],
  }),
  exam: one(exams, {
    fields: [reportJobs.examId],
    references: [exams.id],
  }),
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
export const idempotencyKeysRelations = relations(idempotencyKeys, ({ one }) => ({
  user: one(users, {
    fields: [idempotencyKeys.userId],
    references: [users.id],
  }),
  exam: one(exams, {
    fields: [idempotencyKeys.examId],
    references: [exams.id],
  }),
}));
