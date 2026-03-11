
import { neon } from "@neondatabase/serverless";

const envDatabaseUrl = process.env.DATABASE_URL;
const envReplicaUrl = process.env.DATABASE_URL_REPLICA;

const connectionString =
  envDatabaseUrl === undefined || envDatabaseUrl === null || envDatabaseUrl === ""
    ? "postgresql://placeholder:placeholder@ep-placeholder.us-east-2.aws.neon.tech/neondb"
    : envDatabaseUrl;

// Add statement timeout of 10s to ensure no query hangs indefinitely
const connectionWithTimeout = connectionString.includes('?') 
    ? `${connectionString}&options=-c%20statement_timeout=10000`
    : `${connectionString}?options=-c%20statement_timeout=10000`;

/**
 * Primary SQL client for writes.
 */
export const sql = neon(connectionWithTimeout);

/**
 * Replica SQL client for heavy reads. 
 * Falls back to primary if no replica is configured.
 */
export const sqlReplica =
  envReplicaUrl !== undefined && envReplicaUrl !== null && envReplicaUrl !== ""
    ? neon(envReplicaUrl)
    : sql;
