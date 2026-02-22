
import { neon } from "@neondatabase/serverless";

const envDatabaseUrl = process.env.DATABASE_URL;
const connectionString =
  envDatabaseUrl === undefined || envDatabaseUrl === null || envDatabaseUrl === ""
    ? "postgresql://placeholder:placeholder@ep-placeholder.us-east-2.aws.neon.tech/neondb"
    : envDatabaseUrl;

export const sql = neon(connectionString);
