import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Database connection
const databaseUrl = process.env.SKILLHUBCORE_DATABASE_URL || 
                    process.env.DATABASE_URL_TUTORIAL;

if (!databaseUrl) {
  throw new Error(
    'Database URL not found. Please set SKILLHUBCORE_DATABASE_URL or DATABASE_URL_TUTORIAL in environment variables.'
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool);

// Export all schemas
export * from './schema/domain';
export * from './schema/enums';
export * from './schema/relations';

// Import types and schemas for type definitions
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
  domains,
  subjects,
  topics,
  subtopics,
  skills,
  topicSkills,
} from './schema/domain';

// Re-export Drizzle types
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Export specific types
export type Domain = InferSelectModel<typeof domains>;
export type InsertDomain = InferInsertModel<typeof domains>;

export type Subject = InferSelectModel<typeof subjects>;
export type InsertSubject = InferInsertModel<typeof subjects>;

export type Topic = InferSelectModel<typeof topics>;
export type InsertTopic = InferInsertModel<typeof topics>;

export type Subtopic = InferSelectModel<typeof subtopics>;
export type InsertSubtopic = InferInsertModel<typeof subtopics>;

export type Skill = InferSelectModel<typeof skills>;
export type InsertSkill = InferInsertModel<typeof skills>;

export type TopicSkill = InferSelectModel<typeof topicSkills>;
export type InsertTopicSkill = InferInsertModel<typeof topicSkills>;