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

  console.log('Adding missing report_materialized column to exams table...');

  try {
    await client.query(`
      ALTER TABLE exams 
      ADD COLUMN IF NOT EXISTS report_materialized jsonb
    `);
    console.log('✅ Column added successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // Verify the column was added
  const result = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'exams' 
    ORDER BY ordinal_position
  `);
  console.log('\nExams columns after migration:');
  console.log(result.rows.map(r => `  ${r.column_name} (${r.data_type})`).join('\n'));

  await client.end();
}
run().catch(console.error);
