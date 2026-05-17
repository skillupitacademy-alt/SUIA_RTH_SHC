/**
 * run-raw-migration.ts
 * Resilient schema applicator
 * ----------------------------
 * Executes table creations and indexes directly on PostgreSQL from 0018_amused_rockslide.sql
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { sql } from 'drizzle-orm';

// Load environment variables
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
];

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath });
}

async function runRawMigration() {
  console.log('⚡ Starting raw migration application...\n');

  try {
    const migrationFilePath = path.resolve(__dirname, '../migrations/0018_amused_rockslide.sql');
    if (!fs.existsSync(migrationFilePath)) {
      throw new Error(`Migration file not found at: ${migrationFilePath}`);
    }

    const rawSql = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Split queries by drizzle's statement breakpoint
    const statements = rawSql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📋 Found ${statements.length} SQL statements to execute.`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Print first line of statement for tracking
      const firstLine = stmt.split('\n')[0].substring(0, 80);
      console.log(`   [${i + 1}/${statements.length}] Executing: "${firstLine}..."`);

      try {
        await db.execute(sql.raw(stmt));
        console.log(`   ✅ Success`);
      } catch (err: any) {
        const errMsg = (err.message || '').toLowerCase();
        const causeMsg = (err.cause?.message || '').toLowerCase();
        
        // Gracefully ignore duplicate errors
        if (
          errMsg.includes('already exists') || 
          errMsg.includes('already a member') || 
          errMsg.includes('duplicate key value') ||
          causeMsg.includes('already exists') || 
          causeMsg.includes('already a member') || 
          causeMsg.includes('duplicate key value')
        ) {
          const detail = causeMsg || errMsg;
          console.log(`   ⚠️ Skipped (already applied: ${detail.split('\n')[0]})`);
        } else {
          console.error(`   ❌ Failed:`, err);
          throw err;
        }
      }
    }

    console.log('\n✅ All SQL schema statements successfully applied!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Raw migration failed:', error);
    process.exit(1);
  }
}

runRawMigration();
