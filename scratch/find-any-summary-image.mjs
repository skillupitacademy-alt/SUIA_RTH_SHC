import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';

neonConfig.webSocketConstructor = WebSocket;

const connectionString = 'postgresql://tutorial_admin:TutorialPlatform@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require';
const pool = new Pool({ connectionString });

async function main() {
  try {
    console.log('Searching all tutorial_sections for summaryCard with image...');
    const res = await pool.query(`
      SELECT ts.id, ts.section_type, ts.difficulty, ts.status, sub.slug as subtopic_slug, ts.content
      FROM tutorial_sections ts
      JOIN tutorial_subtopics sub ON ts.subtopic_id = sub.id
    `);
    
    console.log(`Total sections fetched: ${res.rows.length}`);
    
    let found = false;
    for (const row of res.rows) {
      const content = row.content;
      if (content?.summaryCard?.image) {
        found = true;
        console.log(`\n🎉 FOUND SECTION WITH IMAGE!`);
        console.log(`Section ID: ${row.id}`);
        console.log(`Subtopic Slug: ${row.subtopic_slug}`);
        console.log(`Section Type: ${row.section_type}`);
        console.log(`Difficulty: ${row.difficulty}`);
        console.log(`Status: ${row.status}`);
        console.log(`Image info:`, {
          alt: content.summaryCard.image.alt,
          name: content.summaryCard.image.name,
          type: content.summaryCard.image.type,
          hasDataUri: !!content.summaryCard.image.dataUri,
          dataUriLength: content.summaryCard.image.dataUri?.length
        });
      }
    }
    
    if (!found) {
      console.log('❌ No section in the database has an image inside summaryCard!');
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

main();
