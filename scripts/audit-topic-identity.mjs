import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });
const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  console.log('\n=== PUBLISHED SIDEBAR TOPIC ===');
  
  // Get the published sidebar topic details
  const sidebarResult = await tutorialPool.query(`
    SELECT 
      brand_id,
      domain_id,
      subject_id,
      topic_id,
      active_subtopic_id,
      status,
      version
    FROM tutorial_sidebar_trees_v2
    WHERE status = 'published'
  `);

  if (sidebarResult.rows.length === 0) {
    console.log('No published sidebars found');
    await tutorialPool.end();
    await mainPool.end();
    process.exit(0);
  }

  const sidebar = sidebarResult.rows[0];
  console.log('\nPublished Sidebar:');
  console.log('  Brand:', sidebar.brand_id);
  console.log('  Topic ID:', sidebar.topic_id);
  console.log('  Version:', sidebar.version);
  console.log('');

  // Look up this topic in tutorial_topics
  const tutorialTopicResult = await tutorialPool.query(`
    SELECT id, external_id, name, slug
    FROM tutorial_topics
    WHERE id = $1
  `, [sidebar.topic_id]);

  if (tutorialTopicResult.rows.length > 0) {
    const tutorialTopic = tutorialTopicResult.rows[0];
    console.log('Tutorial DB Topic (internal):');
    console.log('  ID:', tutorialTopic.id);
    console.log('  External ID:', tutorialTopic.external_id);
    console.log('  Name:', tutorialTopic.name);
    console.log('  Slug:', tutorialTopic.slug);
    console.log('');

    // Look up the curriculum topic (external_id should map to main DB topics.id)
    const mainTopicResult = await mainPool.query(`
      SELECT id, name, subject_id
      FROM topics
      WHERE id = $1
    `, [tutorialTopic.external_id]);

    if (mainTopicResult.rows.length > 0) {
      const mainTopic = mainTopicResult.rows[0];
      console.log('Main DB Topic (curriculum):');
      console.log('  ID:', mainTopic.id);
      console.log('  Name:', mainTopic.name);
      console.log('');

      // Get the subject
      const subjectResult = await mainPool.query(`
        SELECT id, name, domain_id
        FROM subjects
        WHERE id = $1
      `, [mainTopic.subject_id]);

      if (subjectResult.rows.length > 0) {
        const subject = subjectResult.rows[0];
        console.log('Subject:');
        console.log('  ID:', subject.id);
        console.log('  Name:', subject.name);
        console.log('');

        // Get the domain
        const domainResult = await mainPool.query(`
          SELECT id, name
          FROM domains
          WHERE id = $1
        `, [subject.domain_id]);

        if (domainResult.rows.length > 0) {
          const domain = domainResult.rows[0];
          console.log('Domain:');
          console.log('  ID:', domain.id);
          console.log('  Name:', domain.name);
          console.log('');
        }
      }
    }
  }

  console.log('=== JAVA TOPIC LOOKUP ===\n');
  
  // Check if Java topic exists in tutorial_topics
  const javaTopicResult = await tutorialPool.query(`
    SELECT id, external_id, name, slug
    FROM tutorial_topics
    WHERE external_id = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07'
  `);

  if (javaTopicResult.rows.length > 0) {
    const javaTopic = javaTopicResult.rows[0];
    console.log('Java Topic in Tutorial DB:');
    console.log('  ID:', javaTopic.id);
    console.log('  External ID:', javaTopic.external_id);
    console.log('  Name:', javaTopic.name);
    console.log('  Slug:', javaTopic.slug);
    console.log('');

    // Check if there's a sidebar for this topic (by external_id lookup)
    const javaSidebarCheck = await tutorialPool.query(`
      SELECT COUNT(*) as count
      FROM tutorial_sidebar_trees_v2
      WHERE topic_id = $1
      AND status = 'published'
    `, [javaTopic.id]);

    console.log('Sidebar Status:');
    console.log('  Published sidebars:', javaSidebarCheck.rows[0].count);
  } else {
    console.log('Java topic NOT FOUND in tutorial_topics table');
    console.log('External ID searched: fb47747d-ac1c-4091-bd8e-a8a7d7378e07');
  }

  await tutorialPool.end();
  await mainPool.end();
} catch (error) {
  console.error('Error:', error.message);
  await tutorialPool.end();
  await mainPool.end();
  process.exit(1);
}
