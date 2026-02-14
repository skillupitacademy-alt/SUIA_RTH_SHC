
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Running manual migration for background_jobs...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "background_jobs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" text NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "payload" jsonb,
        "result" jsonb,
        "error" text,
        "started_at" timestamp,
        "completed_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `;
    console.log('Table background_jobs created.');

    await sql`CREATE INDEX IF NOT EXISTS "idx_jobs_user_id" ON "background_jobs" ("user_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_jobs_status" ON "background_jobs" ("status");`;
    console.log('Indexes created.');
    
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
