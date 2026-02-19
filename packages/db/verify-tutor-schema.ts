
import { db } from "./src";
import { sql } from "drizzle-orm";

async function verifySchema() {
  console.log("Verifying Tutor Schema...");

  try {
    // Check topics table columns
    const columns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'topics' 
      AND column_name IN ('learning_url', 'detailed_notes_path', 'notes_asset_id');
    `);
    console.log("Topics Columns Found:", columns.rows.map(r => r.column_name));

    // Check new tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('user_recommendations', 'notes_access_logs', 'notifications');
    `);
    console.log("Tables Found:", tables.rows.map(r => r.table_name));

  } catch (err) {
    console.error("Verification Failed:", err);
  }
  process.exit(0);
}

verifySchema();
