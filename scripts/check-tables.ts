
import "dotenv/config";
import { db } from '../packages/db/src';
import { sql } from 'drizzle-orm';
import { WebSocket } from "ws";

// Polyfill WebSocket for Neon serverless in Node.js
if (typeof (global as any).WebSocket === 'undefined') {
  (global as any).WebSocket = WebSocket;
}

async function check() {
  console.log("Database URL configured:", process.env.DATABASE_URL ? "Yes" : "No");
  try {
    const res = await db.execute(sql`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`);
    const tables = res.rows.map((r: any) => r.tablename);
    console.log("Tables in database:", tables.join(', '));
    
    const mvRes = await db.execute(sql`SELECT matviewname FROM pg_catalog.pg_matviews WHERE schemaname = 'public'`);
    const mvs = mvRes.rows.map((r: any) => r.matviewname);
    console.log("Materialized Views in database:", mvs.join(', '));
    
    if (tables.includes('reports')) {
      console.log("SUCCESS: 'reports' table exists.");
      const columns = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'reports'`);
      console.log("Columns in 'reports':", columns.rows.map((r: any) => r.column_name).join(', '));
    } else {
      console.log("FAILURE: 'reports' table is MISSING.");
    }
  } catch (e: any) {
    console.error("Database check failed.");
    console.error("Error message:", e.message);
    if (e.cause) console.error("Cause:", e.cause);
    if (e.originalError) console.error("Original:", e.originalError);
  }
  process.exit(0);
}

check();
