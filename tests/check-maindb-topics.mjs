import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const mainDb = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('Checking MainDB topics for Backend Development...\n');

const subjects = await mainDb.query('SELECT id, name FROM subjects WHERE deleted_at IS NULL');
const backendDev = subjects.rows.find(s => s.name.toLowerCase().includes('backend'));

if (!backendDev) {
  console.log('❌ Backend Development subject not found');
  await mainDb.end();
  process.exit(1);
}

console.log(`✅ Found subject: ${backendDev.name} (${backendDev.id})\n`);

const topics = await mainDb.query(
  'SELECT id, name FROM topics WHERE subject_id = $1 AND deleted_at IS NULL',
  [backendDev.id]
);

console.log(`Found ${topics.rows.length} topics:\n`);
topics.rows.forEach((t, idx) => {
  console.log(`${idx + 1}. ${t.name}`);
  console.log(`   id: ${t.id}`);
  console.log(`   slug (lower): ${t.name.toLowerCase()}`);
  console.log(`   compactSlug: ${t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
  console.log('');
});

// Check if "java" would match
const javaMatch = topics.rows.find(t => 
  t.name.toLowerCase() === 'java' || 
  t.name.toLowerCase().replace(/[^a-z0-9]/g, '') === 'java'
);

if (javaMatch) {
  console.log(`✅ "java" WOULD match: ${javaMatch.name}`);
} else {
  console.log('❌ "java" WOULD NOT match any topic');
}

await mainDb.end();
