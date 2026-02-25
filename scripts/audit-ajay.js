/**
 * COMPLETE AUDIT: All reports + exams + Redis
 */
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  // 1. Get report table columns first
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'reports' ORDER BY ordinal_position
  `);
  console.log('=== REPORTS TABLE COLUMNS ===');
  console.log(cols.rows.map(r => r.column_name).join(', '));

  // 2. ALL reports
  console.log('\n=== ALL REPORTS ===');
  const reports = await client.query(`SELECT * FROM reports ORDER BY created_at DESC`);
  console.log(`Total: ${reports.rowCount}`);
  reports.rows.forEach(r => {
    console.log(`  ${(r.attempt_id || '').slice(0, 8)} | ${(r.status || '').padEnd(12)} | err: ${r.error_stage || 'none'} | file: ${!!r.file_ref} | updated: ${r.updated_at}`);
  });

  // 3. ALL completed exams vs their report status
  console.log('\n=== COMPLETED EXAMS + REPORT STATUS ===');
  const exams = await client.query(`
    SELECT e.id, e.status, e.completed_at,
           r.id as report_id, r.status as report_status, r.error_stage
    FROM exams e
    LEFT JOIN reports r ON r.attempt_id = e.id
    WHERE e.status = 'completed'
    ORDER BY e.completed_at DESC
  `);
  exams.rows.forEach(e => {
    const rpt = e.report_status ? `${e.report_status} (${e.error_stage || 'ok'})` : 'NO REPORT ROW';
    console.log(`  ${e.id.slice(0, 8)} | report: ${rpt}`);
  });

  // 4. Redis check
  console.log('\n=== ALL REDIS KEYS ===');
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    const allRes = await fetch(`${redisUrl}/KEYS/*`, {
      headers: { 'Authorization': `Bearer ${redisToken}` }
    });
    const allKeys = await allRes.json();
    console.log(JSON.stringify(allKeys.result, null, 2));
  }

  await client.end();
}

run().catch(console.error);
