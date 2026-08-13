import { pgTable, text, timestamp, uuid, integer, jsonb, primaryKey, index, uniqueIndex } from "drizzle-orm/pg-core";
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
  // --- Duplicate-Detection columns (factory pipeline) ---
  // SHA-256 of normalized question text. UNIQUE partial index guarantees
  // race-condition safety across concurrent GENERATE/commit actions.
  questionHash: text("question_hash"),
  // SHA-256 of normalized (whitespace-insensitive) code snippet.
  // Structurally identical code questions ("add(2,3)" vs "add(10,20)")
  // share the same code hash and are flagged for review.
  codeHash: text("code_hash"),
  // Stable identifier for the concept being tested (e.g.
  // "javascript_closure_lexical_scope"). Additional signal only —
  // never the sole duplicate mechanism.
  conceptKey: text("concept_key"),
  // Learning objective (e.g. "javascript_closure_predict_output").
  // Strong signal for objective-level duplication, but not mandatory gate.
  objectiveKey: text("objective_key"),
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
  idx_questions_question_hash: index("idx_questions_question_hash").on(t.questionHash),
  idx_questions_question_hash_unique: uniqueIndex("uq_questions_question_hash_active").on(t.questionHash).where(sql`${t.questionHash} IS NOT NULL AND ${t.status} = 'active'`),
  idx_questions_code_hash: index("idx_questions_code_hash").on(t.codeHash),
  idx_questions_objective_key: index("idx_questions_objective_key").on(t.objectiveKey),
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
