import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from packages/db
dotenv.config({ path: path.join(__dirname, '../packages/db/.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not defined in packages/db/.env");
  process.exit(1);
}

async function main() {
  console.log("🚀 Starting Safe Schema Migration (Direct Neon)...");
  
  const sql_client = neon(databaseUrl!);
  const db = drizzle(sql_client);

  // 1. Safe Enum Creation: mapping_type
  try {
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "public"."mapping_type" AS ENUM('conceptual', 'technical', 'practical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✅ Enum 'mapping_type' processed.");
  } catch (e) {
    console.error("⚠️ Error with mapping_type enum:", e);
  }

  // 2. Safe Enum Creation: skill_category
  try {
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "public"."skill_category" AS ENUM('technical', 'cognitive', 'process');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✅ Enum 'skill_category' processed.");
  } catch (e) {
    console.error("⚠️ Error with skill_category enum:", e);
  }

  // 3. Add Columns to 'users'
  try {
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_active_at" timestamp DEFAULT now()`);
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp`);
    console.log("✅ Added users columns.");
  } catch (e) {
    console.error("⚠️ Error adding users columns:", e);
  }

  // 4. Add Columns/Alters to 'skills'
  try {
    await db.execute(sql`ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "weight" integer DEFAULT 1 NOT NULL`);
    await db.execute(sql`ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "category" "skill_category"`);
    await db.execute(sql`ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "mapping_type" "mapping_type"`);
    console.log("✅ Processed skills columns.");
  } catch (e) {
    console.error("⚠️ Error processing skills columns:", e);
  }

  // 5. Add questions mapping_type - THE CRITICAL ONE
  try {
    await db.execute(sql`ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "mapping_type" "mapping_type"`);
    console.log("✅ Added questions.mapping_type.");
  } catch (e) {
    console.error("⚠️ Error adding questions.mapping_type:", e);
  }

  console.log("🏁 Migration Fix Complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
