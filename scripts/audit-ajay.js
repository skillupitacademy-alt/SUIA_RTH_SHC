const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Reset all stuck pending/generating reports back to failed so users can retry
  console.log('=== RESETTING STUCK REPORTS ===');
  const staleReports = await client.query(`
    UPDATE reports 
    SET status = 'failed', 
        error_stage = 'Stale: reset by migration script',
        updated_at = NOW()
    WHERE status IN ('pending', 'generating')
      AND updated_at < NOW() - INTERVAL '5 minutes'
    RETURNING id, attempt_id, status, updated_at
  `);
  console.log('Reset', staleReports.rowCount, 'stale reports:');
  console.log(JSON.stringify(staleReports.rows, null, 2));

  // Show current state of all reports for Ajay Shah
  console.log('\n=== CURRENT REPORTS STATE ===');
  const reports = await client.query(`
    SELECT r.id, r.attempt_id, r.status, r.error_stage, r.file_ref IS NOT NULL as has_file,
           r.updated_at
    FROM reports r
    WHERE r.user_id = '54726a2e-fca5-4d93-abc6-e7cee97a86f8'
    ORDER BY r.created_at DESC
  `);
  console.log(JSON.stringify(reports.rows, null, 2));

  await client.end();
}
run().catch(console.error);
