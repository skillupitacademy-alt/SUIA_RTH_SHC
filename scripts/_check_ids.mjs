import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('Checking ID mapping:\n');

const r1 = await pool.query('SELECT id, external_id, slug, name FROM tutorial_subtopics WHERE id = $1', ['414f63eb-cccf-4bd1-bcc0-b52df69ce499']);
console.log('By internal ID (414f63eb...):');
console.log(JSON.stringify(r1.rows[0], null, 2));

console.log('\n');

const r2 = await pool.query('SELECT id, external_id, slug, name FROM tutorial_subtopics WHERE external_id = $1', ['12efacf1-b5ad-4b43-9fe4-17ba1cf249e4']);
console.log('By external ID (12efacf1...):');
console.log(JSON.stringify(r2.rows[0], null, 2));

console.log('\n=== KEY FINDING ===');
console.log('tutorial_page_content_v2 uses: external_id (12efacf1-b5ad-4b43-9fe4-17ba1cf249e4)');
console.log('tutorial_sections uses: internal id (414f63eb-cccf-4bd1-bcc0-b52df69ce499)');
console.log('ILS validation uses: internal id (414f63eb-cccf-4bd1-bcc0-b52df69ce499)');
console.log('\nDIFFERENT ID SYSTEMS!');

await pool.end();
