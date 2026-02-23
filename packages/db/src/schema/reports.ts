import { pgTable, text, timestamp, uuid, integer, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { users } from "./auth";
import { exams } from "./exam";

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id")
    .unique()
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  storageProvider: text("storage_provider").notNull(), // 'blob' | 'r2'
  fileRef: text("file_ref"), // URL (Blob) or key (R2)

  status: text("status", { enum: ["pending", "generating", "ready", "failed"] })
    .notNull()
    .default("pending"),

  pageCount: integer("page_count"),
  fileSizeKb: integer("file_size_kb"),
  generationTimeMs: integer("generation_time_ms"),
  layoutVersion: integer("layout_version").default(1),
  errorStage: text("error_stage"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
}, (t) => ({
  idx_reports_attempt_id: index("idx_reports_attempt_id").on(t.attemptId),
  idx_reports_user_id: index("idx_reports_user_id").on(t.userId),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  exam: one(exams, {
    fields: [reports.attemptId],
    references: [exams.id],
  }),
}));
