import { pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["active", "inactive", "draft"]);

export const questionTypeEnum = pgEnum("question_type", ["mcq", "code_mcq"]);

export const difficultyEnum = pgEnum("difficulty", ["simple", "intermediate", "expert"]);

export const skillCategoryEnum = pgEnum("skill_category", [
  "problem_solving",
  "code_debugging",
  "api_design",
  "data_analysis",
  "system_design",
  "security_awareness",
  "performance_optimization",
  "testing_qa",
  "version_control",
  "agile_methodology",
  "technical",
  "conceptual",
  "practical"
]);
