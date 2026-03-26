/* istanbul ignore file */
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import WebSocket from 'ws';

import { schema } from './schema';

neonConfig.webSocketConstructor = WebSocket;

type Schema = typeof schema;
type DbClient = ReturnType<typeof drizzle<Schema>>;

let pooledDbInstance: DbClient | null = null;
let directDbInstance: DbClient | null = null;

const createTestDb = (): DbClient =>
  ({
    query: {} as Record<string, unknown>,
    transaction: async <T>(callback: (tx: DbClient) => Promise<T>): Promise<T> => callback(createTestDb()),
    select: () => ({
      from: () => ({
        where: async () => [],
        limit: async () => [],
      }),
      where: async () => [],
      limit: async () => [],
    }),
    insert: () => ({
      values: () => ({
        returning: async () => [],
      }),
    }),
    update: () => ({
      set: () => ({
        where: async () => undefined,
      }),
    }),
    delete: () => ({
      where: async () => undefined,
    }),
    execute: async () => ({ rows: [] }),
  }) as unknown as DbClient;

const createDb = (connectionString: string, isDirect: boolean): DbClient => {
  const pool = new Pool({
    connectionString,
    max: isDirect ? 5 : 10,
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

export const getPaymentDb = (type: 'primary' | 'direct' = 'primary'): DbClient => {
  const databaseUrl =
    type === 'direct' ? process.env.DATABASE_DIRECT_URL_PAYMENT : process.env.DATABASE_URL_PAYMENT;

  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    if (process.env.NODE_ENV === 'test') {
      return createTestDb();
    }
    throw new Error(
      type === 'direct'
        ? 'DATABASE_DIRECT_URL_PAYMENT environment variable is required'
        : 'DATABASE_URL_PAYMENT environment variable is required'
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

export const db = new Proxy({} as DbClient, {
  get: (target, prop) => {
    if (Object.prototype.hasOwnProperty.call(target, prop)) {
      return Reflect.get(target, prop);
    }
    return Reflect.get(getPaymentDb('primary') as object, prop);
  },
});

export const dbDirect = new Proxy({} as DbClient, {
  get: (target, prop) => {
    if (Object.prototype.hasOwnProperty.call(target, prop)) {
      return Reflect.get(target, prop);
    }
    return Reflect.get(getPaymentDb('direct') as object, prop);
  },
});

export const dbReadOnly = db;
