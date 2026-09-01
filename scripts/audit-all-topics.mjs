import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });
const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  console.log('\n=== TUTORIAL_TOPICS TABLE ===');
  
  const topicsResult = await tutorialPool.query(`
    SELECT COUNT(*) as count
    FROM tutorial_topics
  `);
  
  console.log('Total topics:', topicsResult.rows[0].count);
  
  if (topicsResult.rows[0].count > 0) {
    const allTopics = await tutorialPool.query(`
      SELECT id, external_id, name, slug
      FROM tutorial_topics
      ORDER BY name
      LIMIT 10
    `);
    
    console.log('\nFirst 10 topics:');
    allTopics.rows.forEach((topic, i) => {
      console.log(`${i + 1}. ${topic.name} (${topic.slug})`);
      console.log(`   Internal ID: ${topic.id}`);
      console.log(`   External ID: ${topic.external_id}`);
    });
  }
  
  console.log('\n=== MAIN DB JAVA TOPIC ===');
  
  const javaMainResult = await mainPool.query(`
    SELECT id, name
    FROM topics
    WHERE id = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07'
  `);
  
  if (javaMainResult.rows.length > 0) {
    console.log('Java topic EXISTS in main DB:');
    console.log('  ID:', javaMainResult.rows[0].id);
    console.log('  Name:', javaMainResult.rows[0].name);
    console.log('\nConclusion: Java topic exists in curriculum but NOT synced to tutorial DB');
  } else {
    console.log('Java topic NOT FOUND in main DB either');
  }

  await tutorialPool.end();
  await mainPool.end();
} catch (error) {
  console.error('Error:', error.message);
  await tutorialPool.end();
  await mainPool.end();
  process.exit(1);
}
