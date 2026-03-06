import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as authSchema from './schema/auth';
import * as domainSchema from './schema/domain';
import * as questionSchema from './schema/question';
import * as examSchema from './schema/exam';
import * as enumsSchema from './schema/enums';
import * as jobsSchema from './schema/jobs';
import * as notificationSchema from './schema/notification';
import * as tutorSchema from './schema/tutor';
import * as reportSchema from './schema/reports';

import * as relationsSchema from './schema/relations';

const schema = {
  ...authSchema,
  ...domainSchema,
  ...questionSchema,
  ...examSchema,
  ...enumsSchema,
  ...jobsSchema,
  ...notificationSchema,
  ...tutorSchema,
  ...reportSchema,
  ...relationsSchema,
};

type Schema = typeof schema;
type DbClient = ReturnType<typeof drizzle<Schema>>;

// Create lazy-initialized database clients for Read/Write splitting
let primaryDbInstance: DbClient | null = null;
let replicaDbInstance: DbClient | null = null;

// Lightweight no-op Drizzle-like stub to keep unit tests running without a real DB connection.
const createTestDb = (): DbClient => {
  const resolved = <T>(value: T) => Promise.resolve(value);
  const simpleWhere = () => resolved(undefined);

  const tableFns = {
    findFirst: () => resolved(null as any),
    findMany: () => resolved([] as any),
  };

  return {
    query: {
      exams: { ...tableFns },
      topics: { ...tableFns },
      subtopics: { ...tableFns },
      questions: { ...tableFns },
      resultsByDimension: { ...tableFns },
      examBlueprints: { ...tableFns },
      users: { ...tableFns },
    } as any,
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

export const getDb = (type: 'primary' | 'replica' = 'primary'): DbClient => {
    // 1. Check if we should use the replica
    if (type === 'replica' && process.env.DATABASE_URL_REPLICA) {
        if (!replicaDbInstance) {
            const pool = new Pool({ 
                connectionString: process.env.DATABASE_URL_REPLICA,
                max: 10,
                idleTimeoutMillis: 30000,
            });
            replicaDbInstance = drizzle(pool, { schema });
        }
        return replicaDbInstance;
    }

    // 2. Fallback to Primary
    if (!primaryDbInstance) {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            if (process.env.NODE_ENV === 'test') {
                primaryDbInstance = createTestDb();
                return primaryDbInstance!;
            }
            throw new Error('DATABASE_URL environment variable is required');
        }

        const pool = new Pool({ 
            connectionString: databaseUrl,
            max: 15, // Higher limit for primary writes
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            query_timeout: 10000, // 10s global query timeout (Task 37)
        });

        pool.on('error', (err) => console.error('[DB Pool Error]', err));
        pool.on('connect', () => { if (process.env.DEBUG_DB) console.log('[DB Pool] New connection created'); });

        primaryDbInstance = drizzle(pool, { schema });
    }
    return primaryDbInstance!;
}

/**
 * Returns metrics for both Primary and Replica pools.
 */
export const getPoolMetrics = () => {
    const primaryPool = (primaryDbInstance as any)?.session?.client as Pool | undefined;
    const replicaPool = (replicaDbInstance as any)?.session?.client as Pool | undefined;

    const getMetrics = (pool?: Pool) => {
        if (!pool) return null;
        const total = pool.totalCount;
        const idle = pool.idleCount;
        const waiting = pool.waitingCount;
        const max = (pool as any).options?.max || 10;
        const utilization = total > 0 ? ((total - idle) / max) * 100 : 0;

        if (utilization > 80) {
            console.warn(`[DB Pool Warning] High utilization: ${utilization.toFixed(2)}% (${total - idle}/${max})`);
        }

        return {
            totalConnections: total,
            idleConnections: idle,
            waitingRequests: waiting,
            maxConnections: max,
            utilizationPercent: utilization,
        };
    };

    return {
        primary: getMetrics(primaryPool),
        replica: getMetrics(replicaPool),
    };
};

/**
 * Closes all active database pool connections.
 */
export const closePool = async () => {
    const primaryPool = (primaryDbInstance as any)?.session?.client as Pool | undefined;
    const replicaPool = (replicaDbInstance as any)?.session?.client as Pool | undefined;

    await Promise.all([
        primaryPool?.end(),
        replicaPool?.end()
    ]);

    primaryDbInstance = null;
    replicaDbInstance = null;
};

/**
 * Main database export. Defaults to Primary.
 * For scaling millions of users, use dbReplica for SELECT queries.
 */
export const db = new Proxy({} as DbClient, {
    get: (target, prop) => {
        const instance = getDb('primary');
        return (instance as any)[prop];
    }
});

/**
 * Replica database export. Use for heavy GET/SELECT operations.
 * Falls back to Primary if NO REPLICA is configured.
 */
export const dbReplica = new Proxy({} as DbClient, {
    get: (target, prop) => {
        const instance = getDb('replica');
        return (instance as any)[prop];
    }
});

export * from './schema/auth';
export * from './schema/domain';
export * from './schema/question';
export * from './schema/exam';
export * from './schema/enums';
export * from './schema/jobs';
export * from './schema/notification';
export * from './schema/tutor';
export * from './schema/reports';

export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
export * from './utils/query-timeout';
