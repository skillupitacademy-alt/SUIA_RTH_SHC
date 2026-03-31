import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

import * as schema from './schema/users';

type Schema = typeof schema;
type DbClient = ReturnType<typeof drizzle<Schema>>;

let dbInstance: DbClient | null = null;

const createTestDb = (): DbClient => {
  const resolved = <T>(value: T) => Promise.resolve(value);
  const simpleWhere = () => resolved(undefined);

  return {
    query: {} as Record<string, unknown>,
    transaction: async <T>(callback: (tx: DbClient) => Promise<T>) => callback(dbInstance as DbClient),
    select: () => ({
      from: () => ({ where: simpleWhere }),
      where: simpleWhere,
    }) as any,
    insert: () => ({ values: () => ({ returning: async () => [] }) }) as any,
    update: () => ({ set: () => ({ where: async () => undefined }) }) as any,
    delete: () => ({ where: async () => undefined }) as any,
    execute: async () => ({ rows: [] }),
  } as unknown as DbClient;
};

export const getDb = (): DbClient => {
  const databaseUrl = process.env.DATABASE_URL_SKILLUP;

  if (!databaseUrl || databaseUrl.trim().length === 0) {
    if (process.env.NODE_ENV === 'test') {
      if (!dbInstance) {
        dbInstance = createTestDb();
      }
      return dbInstance;
    }
    throw new Error('DATABASE_URL_SKILLUP environment variable is required');
  }

  if (!dbInstance) {
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 15,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 2_000,
      query_timeout: 30_000,
      statement_timeout: 30_000,
    });

    dbInstance = drizzle(pool, { schema });
  }

  return dbInstance;
};

export const db = new Proxy({} as DbClient, {
  get: (target, prop) => {
    if (Object.prototype.hasOwnProperty.call(target, prop)) {
      return Reflect.get(target, prop);
    }
    return Reflect.get(getDb() as object, prop);
  },
}) as DbClient;

export * from './schema/users';
