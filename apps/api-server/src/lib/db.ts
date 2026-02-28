
import { neon } from "@neondatabase/serverless";

const envDatabaseUrl = process.env.DATABASE_URL;
const envReplicaUrl = process.env.DATABASE_URL_REPLICA;

const connectionString =
  envDatabaseUrl === undefined || envDatabaseUrl === null || envDatabaseUrl === ""
    ? "postgresql://placeholder:placeholder@ep-placeholder.us-east-2.aws.neon.tech/neondb"
    : envDatabaseUrl;

/**
 * Primary SQL client for writes.
 */
export const sql = neon(connectionString);

/**
 * Replica SQL client for heavy reads. 
 * Falls back to primary if no replica is configured.
 */
export const sqlReplica =
  envReplicaUrl !== undefined && envReplicaUrl !== null && envReplicaUrl !== ""
    ? neon(envReplicaUrl)
    : sql;
