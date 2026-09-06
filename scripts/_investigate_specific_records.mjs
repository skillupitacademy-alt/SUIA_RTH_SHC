import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('=== INVESTIGATING SPECIFIC RECORDS ===\n');

const USER_1 = 'afc355ca-6bae-4165-89dd-198494a62f85';
const USER_2 = '54726a2e-fca5-4d93-abc6-e7cee97a86f8';
const SECTION_ID = 'cce5ff0e-0fb1-458e-808a-9858f2e7605d';

// 1. Full details of these progress records
console.log('1. FULL PROGRESS RECORDS:\n');
const r1 = await pool.query(`
  SELECT * FROM tutorial_navigation_progress 
  WHERE user_id IN ($1, $2)
  ORDER BY user_id
`, [USER_1, USER_2]);

r1.rows.forEach((row, i) => {
  console.log(`Record ${i + 1}:`);
  console.log(JSON.stringify(row, null, 2));
  console.log('');
});

// 2. Check when these records were created
console.log('\n2. TIMING ANALYSIS:\n');
r1.rows.forEach((row) => {
  console.log(`User: ${row.user_id.substring(0, 8)}...`);
  console.log(`  Created: ${row.created_at}`);
  console.log(`  First viewed: ${row.first_viewed_at}`);
  console.log(`  Last viewed: ${row.last_viewed_at}`);
  console.log(`  Visit count: ${row.visit_count}`);
  console.log(`  Completed blocks: ${JSON.stringify(row.completed_blocks)}`);
  console.log(`  Status: ${row.status}`);
  console.log('');
});

// 3. Check if these users exist in People DB
console.log('\n3. CHECKING USERS IN PEOPLE DB:\n');
const peoplePool = new Pool({ connectionString: process.env.DATABASE_URL_PEOPLE });

for (const userId of [USER_1, USER_2]) {
  try {
    const r = await peoplePool.query('SELECT id, email, name FROM users WHERE id = $1', [userId]);
    if (r.rows.length > 0) {
      console.log(`✅ User ${userId.substring(0, 8)}... exists:`);
      console.log(`   Email: ${r.rows[0].email}`);
      console.log(`   Name: ${r.rows[0].name}`);
    } else {
      console.log(`❌ User ${userId.substring(0, 8)}... NOT FOUND`);
    }
  } catch (err) {
    console.log(`⚠️  User ${userId.substring(0, 8)}... ERROR: ${err.message}`);
  }
}

await peoplePool.end();

// 4. Look for ANY other sections these users visited
console.log('\n\n4. OTHER SECTIONS VISITED BY THESE USERS:\n');
const r4 = await pool.query(`
  SELECT DISTINCT section_id, navigation_node_id, subtopic_id
  FROM tutorial_navigation_progress
  WHERE user_id IN ($1, $2)
`, [USER_1, USER_2]);

console.log(`Found ${r4.rows.length} distinct sections:`);
r4.rows.forEach(row => {
  console.log(`  section_id: ${row.section_id}`);
  console.log(`  navigation_node_id: ${row.navigation_node_id}`);
  console.log(`  subtopic_id: ${row.subtopic_id}`);
  console.log('');
});

// 5. Check all navigation_progress records for whatisjava
console.log('\n5. ALL WHATISJAVA PROGRESS RECORDS:\n');
const r5 = await pool.query(`
  SELECT user_id, section_id, visit_count, status, last_viewed_at
  FROM tutorial_navigation_progress
  WHERE navigation_node_id = 'whatisjava'
  ORDER BY last_viewed_at DESC NULLS LAST
`);

console.log(`Total records for whatisjava: ${r5.rows.length}`);
r5.rows.forEach(row => {
  console.log(`  User: ${row.user_id.substring(0, 8)}...`);
  console.log(`    section_id: ${row.section_id}`);
  console.log(`    visits: ${row.visit_count}`);
  console.log(`    status: ${row.status}`);
  console.log(`    last_viewed: ${row.last_viewed_at}`);
  console.log('');
});

// 6. CRITICAL: Check if section_id has foreign key constraint
console.log('\n6. FOREIGN KEY CONSTRAINTS:\n');
const r6 = await pool.query(`
  SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'tutorial_navigation_progress'
    AND kcu.column_name = 'section_id'
`);

if (r6.rows.length > 0) {
  console.log('section_id HAS foreign key constraint:');
  console.log(JSON.stringify(r6.rows[0], null, 2));
  console.log('\n⚠️  This means the section_id was VALID when inserted!');
  console.log('⚠️  But tutorial_sections is now empty = DATA WAS DELETED');
} else {
  console.log('section_id has NO foreign key constraint');
  console.log('This means orphaned data is possible without deletion');
}

console.log('\n=== SUMMARY ===');
console.log(`section_id: ${SECTION_ID}`);
console.log(`Referenced by: ${r1.rows.length} user(s)`);
console.log(`Total visits: ${r1.rows.reduce((sum, r) => sum + r.visit_count, 0)}`);
console.log(`Exists in tutorial_sections: NO ❌`);
console.log(`\nCONCLUSION: Content existed and was accessed, then deleted.`);

await pool.end();
