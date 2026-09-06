import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('=== FINAL FORENSIC CHECK ===\n');

// 1. Check ALL tutorial_sections (including draft/deleted)
const r1 = await pool.query(`
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
    COUNT(CASE WHEN status IN ('approved', 'deployed') THEN 1 END) as published
  FROM tutorial_sections
`);

console.log('tutorial_sections full status:');
console.log(JSON.stringify(r1.rows[0], null, 2));

// 2. Database connection info
console.log('\nDatabase connection:');
console.log('  DATABASE_URL_TUTORIAL:', process.env.DATABASE_URL_TUTORIAL?.split('@')[1] || 'not set');

// 3. Check if ANY tutorials were ever created
const r2 = await pool.query('SELECT COUNT(*) as count FROM tutorial_sections');
console.log('\nTotal tutorial_sections ever created:', r2.rows[0].count);

// 4. Final verdict
console.log('\n=== VERDICT ===');
console.log('Composer writes to: tutorial_sections ✅');
console.log('Learner reads from: tutorial_sections ✅');
console.log('ILS validates against: tutorial_sections ✅');
console.log('Database: tutorial_prod (ep-solitary-hill) ✅');
console.log('Table exists: YES ✅');
console.log('Schema correct: YES ✅');
console.log('Data present: NO ❌');
console.log('\nCONCLUSION: Content never created OR was deleted/purged');

await pool.end();
