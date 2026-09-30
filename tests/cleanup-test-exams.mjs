#!/usr/bin/env node
/**
 * Script to delete test exams from yesterday and today (IST timezone)
 */

import pg from 'pg';
import readline from 'readline';

const { Client } = pg;

// Database connection string (from .env.local)
const DATABASE_URL = "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr.ap-southeast-1.aws.neon.tech/quiz_platform_prod?sslmode=require&channel_binding=require";

console.log("========================================");
console.log("🧹 Exam Cleanup Script - Yesterday & Today (IST)");
console.log("========================================\n");

// Calculate IST dates (UTC+5:30)
const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
const NOW_IST = new Date(Date.now() + IST_OFFSET);
const TODAY_IST_START = new Date(NOW_IST.getFullYear(), NOW_IST.getMonth(), NOW_IST.getDate());
const YESTERDAY_IST_START = new Date(TODAY_IST_START.getTime() - 24 * 60 * 60 * 1000);

console.log(`📅 Current IST Time: ${NOW_IST.toISOString().replace('T', ' ').substring(0, 19)}`);
console.log(`📅 Yesterday IST: ${YESTERDAY_IST_START.toISOString().substring(0, 10)}`);
console.log(`📅 Today IST: ${TODAY_IST_START.toISOString().substring(0, 10)}`);
console.log("");

// Convert to UTC for database query
const YESTERDAY_UTC = new Date(YESTERDAY_IST_START.getTime() - IST_OFFSET);
const TOMORROW_UTC = new Date(TODAY_IST_START.getTime() + 24 * 60 * 60 * 1000 - IST_OFFSET);

const YESTERDAY_UTC_STR = YESTERDAY_UTC.toISOString().replace('T', ' ').substring(0, 19);
const TOMORROW_UTC_STR = TOMORROW_UTC.toISOString().replace('T', ' ').substring(0, 19);

console.log("🔍 Querying database for exams created between:");
console.log(`   UTC: ${YESTERDAY_UTC_STR} to ${TOMORROW_UTC_STR}`);
console.log("");

// Function to ask for confirmation
function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log("✅ Connected to database\n");
    
    // Count exams to be deleted
    console.log("🔢 Counting exams to be deleted...");
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM exams WHERE started_at >= $1 AND started_at < $2`,
      [YESTERDAY_UTC_STR, TOMORROW_UTC_STR]
    );
    
    const examCount = parseInt(countResult.rows[0].count);
    console.log(`📊 Found ${examCount} exam(s) to delete\n`);
    
    if (examCount === 0) {
      console.log("✅ No exams found for yesterday and today (IST). Nothing to delete.");
      await client.end();
      process.exit(0);
    }
    
    // Show sample of exams to be deleted
    console.log("📋 Sample of exams to be deleted (max 10):");
    const sampleResult = await client.query(
      `SELECT 
        id,
        user_id,
        status,
        TO_CHAR(started_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI:SS') as started_at_ist,
        total_score
      FROM exams
      WHERE started_at >= $1 AND started_at < $2
      ORDER BY started_at DESC
      LIMIT 10`,
      [YESTERDAY_UTC_STR, TOMORROW_UTC_STR]
    );
    
    console.table(sampleResult.rows);
    console.log("");
    
    // Confirmation
    console.log(`\x1b[31m⚠️  WARNING: This will DELETE ${examCount} exam(s) and all related data!\x1b[0m`);
    console.log("\x1b[31m   - Exam questions will be deleted\x1b[0m");
    console.log("\x1b[31m   - Exam results will be deleted\x1b[0m");
    console.log("\x1b[31m   - This action CANNOT be undone!\x1b[0m");
    console.log("");
    
    const confirmation = await askConfirmation("Type 'DELETE' (all caps) to confirm deletion: ");
    
    if (confirmation.trim() !== "DELETE") {
      console.log("\x1b[33m❌ Deletion cancelled. No data was deleted.\x1b[0m");
      await client.end();
      process.exit(0);
    }
    
    console.log("");
    console.log("🗑️  Starting deletion process...\n");
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Step 1: Delete exam questions
      console.log("Step 1/4: Deleting exam questions...");
      const deleteEQ = await client.query(
        `DELETE FROM exam_questions WHERE exam_id IN (SELECT id FROM exams WHERE started_at >= $1 AND started_at < $2)`,
        [YESTERDAY_UTC_STR, TOMORROW_UTC_STR]
      );
      console.log(`   Deleted ${deleteEQ.rowCount} exam question(s)`);
      
      // Step 2: Delete results by dimension
      console.log("Step 2/4: Deleting results by dimension...");
      const deleteRBD = await client.query(
        `DELETE FROM results_by_dimension WHERE exam_id IN (SELECT id FROM exams WHERE started_at >= $1 AND started_at < $2)`,
        [YESTERDAY_UTC_STR, TOMORROW_UTC_STR]
      );
      console.log(`   Deleted ${deleteRBD.rowCount} result record(s)`);
      
      // Step 3: Delete idempotency keys
      console.log("Step 3/4: Deleting idempotency keys...");
      const deleteIK = await client.query(
        `DELETE FROM idempotency_keys WHERE exam_id IN (SELECT id FROM exams WHERE started_at >= $1 AND started_at < $2)`,
        [YESTERDAY_UTC_STR, TOMORROW_UTC_STR]
      );
      console.log(`   Deleted ${deleteIK.rowCount} idempotency key(s)`);
      
      // Step 4: Delete exams
      console.log("Step 4/4: Deleting exams...");
      const deleteExams = await client.query(
        `DELETE FROM exams WHERE started_at >= $1 AND started_at < $2`,
        [YESTERDAY_UTC_STR, TOMORROW_UTC_STR]
      );
      console.log(`   Deleted ${deleteExams.rowCount} exam(s)`);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log("");
      console.log(`\x1b[32m✅ Successfully deleted ${examCount} exam(s) and all related data!\x1b[0m`);
      console.log("");
      
      // Verify deletion
      const verifyResult = await client.query(
        `SELECT COUNT(*) as count FROM exams WHERE started_at >= $1 AND started_at < $2`,
        [YESTERDAY_UTC_STR, TOMORROW_UTC_STR]
      );
      
      const remainingCount = parseInt(verifyResult.rows[0].count);
      
      if (remainingCount === 0) {
        console.log("\x1b[32m✅ Verification: All target exams deleted successfully\x1b[0m");
      } else {
        console.log(`\x1b[33m⚠️  Warning: ${remainingCount} exam(s) still remain\x1b[0m`);
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error("\n\x1b[31m❌ Error:\x1b[0m", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
  
  console.log("");
  console.log("\x1b[32m🎉 Cleanup completed!\x1b[0m");
}

main();
