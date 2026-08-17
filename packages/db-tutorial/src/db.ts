/* istanbul ignore file */
import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle } from 'drizzle-orm/neon-serverless';
import WebSocket from 'ws';

import { schema } from './schema';

neonConfig.webSocketConstructor = WebSocket;

type Schema = typeof schema;
type DbClient = ReturnType<typeof drizzle<Schema>>;
type HttpDbClient = ReturnType<typeof drizzleHttp<Schema>>;

let pooledDbInstance: DbClient | null = null;
let directDbInstance: DbClient | null = null;
let httpDbInstance: HttpDbClient | null = null;

const createTestDb = (): DbClient => {
  const resolved = <T>(value: T) => Promise.resolve(value);
  const simpleWhere = () => resolved(undefined);

  return {
    query: {} as any,
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

const createDb = (connectionString: string, isDirect: boolean): DbClient => {
  const pool = new Pool({
    connectionString,
    max: isDirect ? 5 : 15,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2_000,
    statement_timeout: 30_000,
    query_timeout: 30_000,
  });

  pool.on('error', () => undefined);
  pool.on('connect', (client) => {
    client.query('SET statement_timeout = 30000');
    client.query('SET idle_in_transaction_session_timeout = 30000');
  });

  return drizzle(pool, { schema });
};

export const getTutorialDb = (type: 'primary' | 'direct' = 'primary'): DbClient => {
  const databaseUrl =
    type === 'direct'
      ? process.env.DATABASE_DIRECT_URL_TUTORIAL
      : process.env.DATABASE_URL_TUTORIAL;

  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    if (process.env.NODE_ENV === 'test') {
      return createTestDb();
    }
    throw new Error(
      type === 'direct'
        ? 'DATABASE_DIRECT_URL_TUTORIAL environment variable is required'
        : 'DATABASE_URL_TUTORIAL environment variable is required'
    );
  }

  if (type === 'direct') {
    if (directDbInstance === null) {
      directDbInstance = createDb(databaseUrl, true);
    }
    return directDbInstance;
  }

  if (pooledDbInstance === null) {
    pooledDbInstance = createDb(databaseUrl, false);
  }

  return pooledDbInstance;
};

export const getTutorialHttpDb = (): HttpDbClient => {
  const databaseUrl = process.env.DATABASE_URL_TUTORIAL;

  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    if (process.env.NODE_ENV === 'test') {
      return createTestDb() as unknown as HttpDbClient;
    }
    throw new Error('DATABASE_URL_TUTORIAL environment variable is required');
  }

  if (httpDbInstance === null) {
    httpDbInstance = drizzleHttp(neon(databaseUrl), { schema });
  }

  return httpDbInstance;
};

export const db = new Proxy({} as DbClient, {
  get: (target, prop) => {
    if (Object.prototype.hasOwnProperty.call(target, prop)) {
      return (target as any)[prop];
    }
    return (getTutorialDb('primary') as any)[prop];
  },
});

export const dbDirect = new Proxy({} as DbClient, {
  get: (target, prop) => {
    if (Object.prototype.hasOwnProperty.call(target, prop)) {
      return (target as any)[prop];
    }
    return (getTutorialDb('direct') as any)[prop];
  },
});

export const dbHttp = new Proxy({} as HttpDbClient, {
  get: (target, prop) => {
    if (Object.prototype.hasOwnProperty.call(target, prop)) {
      return (target as any)[prop];
    }
    return (getTutorialHttpDb() as any)[prop];
  },
});

export const dbReadOnly = db;
