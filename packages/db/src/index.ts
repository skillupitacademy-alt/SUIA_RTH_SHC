import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as authSchema from './schema/auth';
import * as domainSchema from './schema/domain';
import * as questionSchema from './schema/question';
import * as examSchema from './schema/exam';

const schema = {
  ...authSchema,
  ...domainSchema,
  ...questionSchema,
  ...examSchema,
};

const databaseUrl = process.env.DATABASE_URL || 'postgres://localhost:5432/dummy';
const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });

export * from './schema/auth';
export * from './schema/domain';
export * from './schema/question';
export * from './schema/exam';

export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
