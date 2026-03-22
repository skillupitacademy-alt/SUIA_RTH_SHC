/* istanbul ignore file */
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import WebSocket from 'ws';

import { schema } from './schema';

neonConfig.webSocketConstructor = WebSocket;

type Schema = typeof schema;
type DbClient = ReturnType<typeof drizzle<Schema>>;
type QueryChain = {
  where: () => QueryChain;
  limit: () => Promise<unknown[]>;
  returning: () => Promise<unknown[]>;
  set: () => {
    where: () => Promise<unknown>;
    returning: () => Promise<unknown[]>;
  };
  values: () => {
    returning: () => Promise<unknown[]>;
  };
};

let pooledDbInstance: DbClient | null = null;
let directDbInstance: DbClient | null = null;

const createTestDb = (): DbClient => {
  const resolved = <T>(value: T) => Promise.resolve(value);
  const chain = (): QueryChain => ({
    where: () => chain(),
    limit: () => resolved([]),
    returning: async () => [],
    set: () => ({
      where: async () => undefined,
      returning: async () => [],
    }),
    values: () => ({
      returning: async () => [],
    }),
  });

  return {
    query: {} as Record<string, unknown>,
    transaction: async <T>(callback: (tx: DbClient) => Promise<T>): Promise<T> => callback(createTestDb()),
    select: () => ({
      from: () => chain(),
      where: () => chain(),
      limit: () => resolved([]),
    }),
    insert: () => chain(),
    update: () => chain(),
    delete: () => ({ where: async () => undefined }),
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

export const getPeopleDb = (type: 'primary' | 'direct' = 'primary'): DbClient => {
  const databaseUrl =
    type === 'direct'
      ? process.env.DATABASE_DIRECT_URL_PEOPLE
      : process.env.DATABASE_URL_PEOPLE;

  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    if (process.env.NODE_ENV === 'test') {
      return createTestDb();
    }
    throw new Error(
      type === 'direct'
        ? 'DATABASE_DIRECT_URL_PEOPLE environment variable is required'
        : 'DATABASE_URL_PEOPLE environment variable is required'
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
    return Reflect.get(getPeopleDb('primary') as object, prop);
  },
});

export const dbDirect = new Proxy({} as DbClient, {
  get: (target, prop) => {
    if (Object.prototype.hasOwnProperty.call(target, prop)) {
      return Reflect.get(target, prop);
    }
    return Reflect.get(getPeopleDb('direct') as object, prop);
  },
});

export const dbReadOnly = db;
