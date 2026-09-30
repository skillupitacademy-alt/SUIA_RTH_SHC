import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });
const mainDb = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('═══════════════════════════════════════════════════════════');
console.log('SUBTOPIC ID MAPPING');
console.log('═══════════════════════════════════════════════════════════\n');

// Check MainDB
const mainSubtopic = await mainDb.query(`
  SELECT id, name FROM subtopics WHERE name = 'What is Java?' AND deleted_at IS NULL
`);

console.log('MainDB subtopic:');
if (mainSubtopic.rows.length > 0) {
  console.log(`  ID: ${mainSubtopic.rows[0].id}`);
  console.log(`  Name: ${mainSubtopic.rows[0].name}`);
} else {
  console.log('  ❌ NOT FOUND');
}
console.log('');

// Check TutorialDB
const tutorialSubtopics = await tutorialDb.query(`
  SELECT id, name, external_id, slug FROM tutorial_subtopics WHERE name LIKE '%Java%'
`);

console.log('TutorialDB subtopics (matching Java):');
if (tutorialSubtopics.rows.length > 0) {
  tutorialSubtopics.rows.forEach(row => {
    console.log(`  ID: ${row.id}`);
    console.log(`  Name: ${row.name}`);
    console.log(`  External ID: ${row.external_id}`);
    console.log(`  Slug: ${row.slug}`);
    console.log('');
  });
} else {
  console.log('  ❌ NO JAVA SUBTOPICS FOUND');
}

await tutorialDb.end();
await mainDb.end();
