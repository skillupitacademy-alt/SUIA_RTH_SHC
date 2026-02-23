
import "dotenv/config";
import { db } from '../packages/db/src';
import { sql } from 'drizzle-orm';

async function forceSync() {
  console.log("Starting force sync of 'reports' table...");
  
  try {
    console.log("1. Checking if 'reports' table exists...");
    try {
      await db.execute(sql`SELECT 1 FROM reports LIMIT 1`);
      console.log("   - Table 'reports' already exists.");
    } catch (e) {
      console.log("   - Table 'reports' does not exist. Creating it...");
      await db.execute(sql`
        CREATE TABLE "reports" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "attempt_id" uuid NOT NULL,
          "user_id" uuid NOT NULL,
          "storage_provider" text NOT NULL,
          "file_ref" text,
          "status" text DEFAULT 'pending' NOT NULL,
          "page_count" integer,
          "file_size_kb" integer,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          CONSTRAINT "reports_attempt_id_unique" UNIQUE("attempt_id")
        )
      `);
      console.log("   - Table 'reports' created.");
    }

    console.log("2. Ensuring new columns exist...");
    const columns = [
      { name: 'generation_time_ms', type: 'integer' },
      { name: 'layout_version', type: 'integer DEFAULT 1' },
      { name: 'error_stage', type: 'text' }
    ];

    for (const col of columns) {
      try {
        await db.execute(sql.raw(`ALTER TABLE "reports" ADD COLUMN "${col.name}" ${col.type}`));
        console.log(`   - Column '${col.name}' added.`);
      } catch (e: any) {
        if (e.message.includes("already exists")) {
          console.log(`   - Column '${col.name}' already exists.`);
        } else {
          console.log(`   - Error adding '${col.name}':`, e.message);
        }
      }
    }

    console.log("3. Ensuring constraints exist...");
    try {
      await db.execute(sql`ALTER TABLE "reports" ADD CONSTRAINT "reports_attempt_id_exams_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action`);
      console.log("   - Constraint 'reports_attempt_id_exams_id_fk' added.");
    } catch(e) { console.log("   - Constraint 'reports_attempt_id_exams_id_fk' already exists or failed."); }

    try {
      await db.execute(sql`ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`);
      console.log("   - Constraint 'reports_user_id_users_id_fk' added.");
    } catch(e) { console.log("   - Constraint 'reports_user_id_users_id_fk' already exists or failed."); }

    console.log("4. Ensuring indexes exist...");
    try {
      await db.execute(sql`CREATE INDEX "idx_reports_attempt_id" ON "reports" ("attempt_id")`);
      console.log("   - Index 'idx_reports_attempt_id' created.");
    } catch(e) { console.log("   - Index 'idx_reports_attempt_id' already exists."); }

    try {
      await db.execute(sql`CREATE INDEX "idx_reports_user_id" ON "reports" ("user_id")`);
      console.log("   - Index 'idx_reports_user_id' created.");
    } catch(e) { console.log("   - Index 'idx_reports_user_id' already exists."); }

    console.log("FORCE SYNC FINISHED.");
    process.exit(0);
  } catch (error: any) {
    console.error("CRITICAL SYNC FAILURE:");
    console.error(error.message);
    process.exit(1);
  }
}

forceSync();
