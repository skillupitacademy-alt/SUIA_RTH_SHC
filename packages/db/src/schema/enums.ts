import { pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["active", "inactive", "draft"]);

export const questionTypeEnum = pgEnum("question_type", ["mcq", "code_mcq"]);

export const difficultyEnum = pgEnum("difficulty", ["simple", "intermediate", "expert"]);
