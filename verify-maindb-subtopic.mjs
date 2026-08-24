import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const mainDb = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('Checking MainDB subtopics schema and data...\n');

// Get columns
const columns = await mainDb.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'subtopics'
  ORDER BY ordinal_position
`);

console.log('MainDB subtopics columns:');
columns.rows.forEach(row => {
  console.log(`  ${row.column_name}: ${row.data_type}`);
});

// Get Java subtopic
const subtopics = await mainDb.query(`
  SELECT * FROM subtopics 
  WHERE name = 'What is Java?' 
  AND deleted_at IS NULL
`);

console.log('\nJava subtopic data:');
if (subtopics.rows.length > 0) {
  const row = subtopics.rows[0];
  Object.keys(row).forEach(key => {
    console.log(`  ${key}: ${row[key]}`);
  });
} else {
  console.log('  NOT FOUND');
}

await mainDb.end();
