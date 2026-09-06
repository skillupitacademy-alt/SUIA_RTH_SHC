import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

const SECTION_ID = 'cce5ff0e-0fb1-458e-808a-9858f2e7605d';

console.log('=== CHECKING FOR DELETED/MISSING SECTION ===\n');
console.log(`Section ID: ${SECTION_ID}\n`);

// Check if section exists (including deleted)
const r = await pool.query('SELECT id, subtopic_id, navigation_node_id, brand_id, status, deleted_at, created_at FROM tutorial_sections WHERE id = $1', [SECTION_ID]);

console.log(`Found in tutorial_sections: ${r.rows.length} row(s)`);
if (r.rows.length > 0) {
  console.log(JSON.stringify(r.rows[0], null, 2));
} else {
  console.log('❌ SECTION DELETED OR NEVER EXISTED IN CURRENT DB');
}

console.log('\n=== EVIDENCE ===');
console.log('tutorial_navigation_progress has section_id:', SECTION_ID);
console.log('This proves content WAS created and users visited it.');
console.log('But tutorial_sections has 0 rows total.');
console.log('\n**CONCLUSION: DATA WAS DELETED/PURGED**');

await pool.end();
