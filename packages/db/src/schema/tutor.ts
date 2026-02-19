import { pgTable, text, timestamp, uuid, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { topics } from "./domain";
import { exams } from "./exam";
import { recommendationLevelEnum } from "./enums";

// 📒 Access Log for Notes (Security Audit)
export const notesAccessLogs = pgTable("notes_access_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  deliveredVia: text("delivered_via").notNull().default("email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  idx_notes_access_user: index("idx_notes_access_user").on(t.userId),
  idx_notes_access_topic: index("idx_notes_access_topic").on(t.topicId),
}));

// 🧠 User Recommendations (Adaptive Insights)
export const userRecommendations = pgTable("user_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  recommendationLevel: recommendationLevelEnum("recommendation_level").notNull(),
  sourceExamId: uuid("source_exam_id")
    .references(() => exams.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  idx_user_reco_user: index("idx_user_reco_user").on(t.userId),
  idx_user_reco_topic: index("idx_user_reco_topic").on(t.topicId),
}));

// 🔐 Idempotency Locks (Prevent Spam)
export const notesDeliveryLocks = pgTable("notes_delivery_locks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  deliveryDate: text("delivery_date").notNull(), // Format 'YYYY-MM-DD'
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  unq_notes_delivery: uniqueIndex("unq_notes_delivery").on(
    t.userId,
    t.topicId,
    t.deliveryDate
  ),
}));

// 🆘 Live Help Requests
export const tutorHelpRequests = pgTable("tutor_help_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, scheduled, resolved
  priority: text("priority").notNull().default("low"), // low, medium, high
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  idx_help_request_user: index("idx_help_request_user").on(t.userId),
  idx_help_request_status: index("idx_help_request_status").on(t.status),
}));
