import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

try {
  // Get the published sidebar's topic_id  
  const sidebarResult = await tutorialPool.query(`
    SELECT topic_id
    FROM tutorial_sidebar_trees_v2
    WHERE status = 'published'
    LIMIT 1
  `);

  const topicId = sidebarResult.rows[0].topic_id;
  
  // Look up this topic
  const topicResult = await tutorialPool.query(`
    SELECT id, external_id, name, slug
    FROM tutorial_topics
    WHERE id = $1
  `, [topicId]);

  console.log('\n=== PUBLISHED SIDEBAR TOPIC ===');
  console.log('Topic ID (tutorial_topics.id):', topicId);
  
  if (topicResult.rows.length > 0) {
    const topic = topicResult.rows[0];
    console.log('Name:', topic.name);
    console.log('Slug:', topic.slug);
    console.log('External ID (curriculum topics.id):', topic.external_id);
  } else {
    console.log('Topic NOT FOUND in tutorial_topics');
  }

  console.log('\n=== JAVA TOPIC STATUS ===');
  console.log('Curriculum ID: fb47747d-ac1c-4091-bd8e-a8a7d7378e07');
  
  // Check if Java exists by external_id
  const javaCheck = await tutorialPool.query(`
    SELECT id, name, slug
    FROM tutorial_topics
    WHERE external_id = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07'
  `);
  
  if (javaCheck.rows.length > 0) {
    console.log('Status: EXISTS in tutorial_topics');
    console.log('Tutorial ID:', javaCheck.rows[0].id);
    console.log('Name:', javaCheck.rows[0].name);
  } else {
    console.log('Status: MISSING from tutorial_topics');
    console.log('Reason: Hierarchy sync never ran for Java topic');
  }

  await tutorialPool.end();
} catch (error) {
  console.error('Error:', error.message);
  await tutorialPool.end();
  process.exit(1);
}
