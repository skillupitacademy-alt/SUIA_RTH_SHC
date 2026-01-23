import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as authSchema from './schema/auth';

const schema = {
  ...authSchema,
};

// Expecting DATABASE_URL in env
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

export * from './schema/auth';
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
