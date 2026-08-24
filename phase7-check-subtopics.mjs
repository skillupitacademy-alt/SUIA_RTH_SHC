import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('Checking TutorialDB subtopics identity\n');

const result = await tutorialDb.query(`
  SELECT id, slug, name, external_id 
  FROM tutorial_subtopics 
  WHERE slug = 'whatisjava'
`);

if (result.rows.length === 0) {
  console.log('❌ No subtopic found with slug=whatisjava');
} else {
  const row = result.rows[0];
  console.log('TutorialDB tutorial_subtopics:');
  console.log('  id (internal TutorialDB):', row.id);
  console.log('  slug:', row.slug);
  console.log('  name:', row.name);
  console.log('  external_id (MainDB reference):', row.external_id);
  console.log('');
  
  console.log('MainDB subtopic ID (from resolveHierarchy):');
  console.log('  12efacf1-b5ad-4b43-9fe4-17ba1cf249e4');
  console.log('');
  
  console.log('Match check:');
  if (row.external_id === '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4') {
    console.log('  ✅ TutorialDB external_id MATCHES MainDB subtopic ID');
  } else {
    console.log('  ❌ MISMATCH:');
    console.log('     external_id:', row.external_id);
    console.log('     MainDB ID:   12efacf1-b5ad-4b43-9fe4-17ba1cf249e4');
  }
  console.log('');
  
  console.log('tutorial_sections.subtopic_id:', '7a7a0647-2207-485d-8e93-fed68c3155bd');
  console.log('TutorialDB internal id:        ', row.id);
  if (row.id === '7a7a0647-2207-485d-8e93-fed68c3155bd') {
    console.log('  ✅ tutorial_sections references correct TutorialDB internal ID');
  } else {
    console.log('  ❌ MISMATCH');
  }
}

await tutorialDb.end();
