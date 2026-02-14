import { pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["active", "inactive", "draft"]);

export const questionTypeEnum = pgEnum("question_type", ["mcq", "code_mcq"]);

export const difficultyEnum = pgEnum("difficulty", ["simple", "intermediate", "expert"]);

export const skillCategoryEnum = pgEnum("skill_category", [
  "technical",
  "cognitive",
  "process"
]);

export const mappingTypeEnum = pgEnum("mapping_type", [
  "conceptual",
  "technical",
  "practical"
]);

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "processing",
  "completed",
  "failed"
]);
