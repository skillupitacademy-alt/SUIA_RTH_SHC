import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function main() {
  try {
    console.log('Querying all subtopics matching whatisjavascript...');
    const subtopics = await pool.query(`
      SELECT id, slug, name FROM tutorial_subtopics WHERE slug = 'whatisjavascript'
    `);
    
    console.log(`Found ${subtopics.rows.length} subtopics:`);
    console.log(JSON.stringify(subtopics.rows, null, 2));
    
    for (const subtopic of subtopics.rows) {
      console.log(`\n--- Sections for Subtopic ID: ${subtopic.id} ---`);
      const sections = await pool.query(`
        SELECT id, section_type, difficulty, status, version, language
        FROM tutorial_sections
        WHERE subtopic_id = $1
      `, [subtopic.id]);
      
      console.log(`Found ${sections.rows.length} sections:`);
      console.log(JSON.stringify(sections.rows, null, 2));
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

main();
