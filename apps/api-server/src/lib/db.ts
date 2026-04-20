
import { neon } from "@neondatabase/serverless";

const envDatabaseUrl = process.env.DATABASE_URL;
const envReplicaUrl = process.env.DATABASE_URL_REPLICA;

const hasEnvUrl = !(envDatabaseUrl === undefined || envDatabaseUrl === null || envDatabaseUrl === "");
const connectionString = hasEnvUrl
  ? envDatabaseUrl
  : "postgresql://placeholder:placeholder@ep-placeholder.us-east-2.aws.neon.tech/neondb";

// Add statement timeout of 10s to ensure no query hangs indefinitely (only for placeholder)
const connectionWithTimeout = hasEnvUrl
  ? connectionString
  : (connectionString.includes('?')
      ? `${connectionString}&options=-c%20statement_timeout=10000`
      : `${connectionString}?options=-c%20statement_timeout=10000`);

/**
 * Primary SQL client for writes.
 * 🔥 PERFORMANCE: Track connection creation
 */
let connectionCount = 0;
const connectionCreatedAt = Date.now();

export const sql = neon(connectionWithTimeout, {
  // @ts-expect-error - Neon runtime supports onConnect, but the current type defs omit it.
  onConnect: () => {
    connectionCount++;
    console.log('[DB][CONNECTION]', JSON.stringify({
      event: 'new_connection',
      count: connectionCount,
      timeSinceInit: Date.now() - connectionCreatedAt,
      timestamp: new Date().toISOString(),
    }));
  },
});

console.log('[DB][INIT]', JSON.stringify({
  event: 'pool_initialized',
  hasEnvUrl,
  timestamp: new Date().toISOString(),
}));

/**
 * Replica SQL client for heavy reads. 
 * Falls back to primary if no replica is configured.
 */
export const sqlReplica =
  envReplicaUrl !== undefined && envReplicaUrl !== null && envReplicaUrl !== ""
    ? neon(envReplicaUrl)
    : sql;
