import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

try {
  const result = await db.execute(sql`SELECT id, name, description FROM subtopics LIMIT 5`);
  
  if (result.rows && result.rows.length > 0) {
    console.log(`Found ${result.rows.length} subtopic(s):\n`);
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`);
      console.log(`   ID: ${row.id}`);
      console.log('');
    });
    console.log('\nTo use the first one, run:');
    console.log(`$env:TEST_SUBTOPIC_ID="${result.rows[0].id}"`);
  } else {
    console.log('No subtopics found in database');
  }
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
} finally {
  await pool.end();
}
