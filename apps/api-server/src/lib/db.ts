
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@ep-placeholder.us-east-2.aws.neon.tech/neondb";
export const sql = neon(connectionString);
  
