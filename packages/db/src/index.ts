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

type Schema = typeof schema;
type DbClient = ReturnType<typeof drizzle<Schema>>;

// Create a lazy-initialized database client
let dbInstance: DbClient | null = null;

export const getDb = (): DbClient => {
    if (!dbInstance) {
        const databaseUrl = process.env.DATABASE_URL || 'postgres://localhost:5432/dummy';
        const sql = neon(databaseUrl);
        dbInstance = drizzle(sql, { schema });
    }
    return dbInstance!;
}

// Proxy the db export with full schema type information
export const db = new Proxy({} as DbClient, {
    get: (target, prop) => {
        const instance = getDb();
        return (instance as any)[prop];
    }
});

export * from './schema/auth';
export * from './schema/domain';
export * from './schema/question';
export * from './schema/exam';

export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
