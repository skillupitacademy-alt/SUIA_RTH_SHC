import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const shcPool = new Pool({ connectionString: process.env.SKILLHUBCORE_DATABASE_URL });
const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\n=== FRESH SAVE TEST ===\n');

try {
  // Get hierarchy from skillhubcore database
  console.log('Fetching hierarchy...');
  const domains = await shcPool.query('SELECT id, name FROM domains WHERE deleted_at IS NULL ORDER BY name LIMIT 1');
  const domain = domains.rows[0];
  
  if (!domain) {
    console.error('No domain found');
    process.exit(1);
  }
  
  console.log(`Found domain: ${domain.name} (${domain.id})`);
  
  const subjects = await shcPool.query('SELECT id, name FROM subjects WHERE domain_id = $1 AND deleted_at IS NULL ORDER BY name LIMIT 1', [domain.id]);
  
  console.log(`Subject query returned ${subjects.rows.length} rows`);
  
  if (subjects.rows.length === 0) {
    console.error('No subjects found for domain:', domain.id);
    // Try any subject
    const anySubject = await shcPool.query('SELECT id, name, domain_id FROM subjects WHERE deleted_at IS NULL ORDER BY name LIMIT 1');
    if (anySubject.rows.length === 0) {
      console.error('No subjects found at all');
      process.exit(1);
    }
    console.log('Using first available subject:', anySubject.rows[0].name);
    const subject = anySubject.rows[0];
    const topics = await shcPool.query('SELECT id, name FROM topics WHERE subject_id = $1 AND deleted_at IS NULL ORDER BY name LIMIT 1', [subject.id]);
    
    if (topics.rows.length === 0) {
      console.error('No topics found for subject:', subject.id);
      const anyTopic = await shcPool.query('SELECT id, name, subject_id FROM topics WHERE deleted_at IS NULL ORDER BY name LIMIT 1');
      if (anyTopic.rows.length === 0) {
        console.error('No topics found at all');
        process.exit(1);
      }
      console.log('Using first available topic:', anyTopic.rows[0].name);
      const topic = anyTopic.rows[0];
      const subtopics = await shcPool.query('SELECT id, name FROM subtopics WHERE topic_id = $1 AND deleted_at IS NULL ORDER BY name LIMIT 1', [topic.id]);
      const subtopic = subtopics.rows[0] || { id: null, name: 'None' };
      
      // Get correct domain and subject for this topic
      const topicSubject = await shcPool.query('SELECT id, name, domain_id FROM subjects WHERE id = $1', [topic.subject_id]);
      const topicDomain = await shcPool.query('SELECT id, name FROM domains WHERE id = $1', [topicSubject.rows[0].domain_id]);
      
      console.log(`\nUsing hierarchy:`);
      console.log(`Domain: ${topicDomain.rows[0].name}`);
      console.log(`Subject: ${topicSubject.rows[0].name}`);
      console.log(`Topic: ${topic.name}`);
      console.log(`Active Subtopic: ${subtopic.name}\n`);
      
      await runTest(topicDomain.rows[0], topicSubject.rows[0], topic, subtopic);
      return;
    }
    
    const topic = topics.rows[0];
    const subtopics = await shcPool.query('SELECT id, name FROM subtopics WHERE topic_id = $1 AND deleted_at IS NULL ORDER BY name LIMIT 1', [topic.id]);
    const subtopic = subtopics.rows[0] || { id: null, name: 'None' };
    
    // Get correct domain for this subject
    const subjectDomain = await shcPool.query('SELECT id, name FROM domains WHERE id = $1', [subject.domain_id]);
    
    console.log(`\nUsing hierarchy:`);
    console.log(`Domain: ${subjectDomain.rows[0].name}`);
    console.log(`Subject: ${subject.name}`);
    console.log(`Topic: ${topic.name}`);
    console.log(`Active Subtopic: ${subtopic.name}\n`);
    
    await runTest(subjectDomain.rows[0], subject, topic, subtopic);
    return;
  }
  
  const subject = subjects.rows[0];
  
  const topics = await shcPool.query('SELECT id, name FROM topics WHERE subject_id = $1 AND deleted_at IS NULL ORDER BY name LIMIT 1', [subject.id]);
  const topic = topics.rows[0];
  
  const subtopics = await shcPool.query('SELECT id, name FROM subtopics WHERE topic_id = $1 AND deleted_at IS NULL ORDER BY name LIMIT 1', [topic.id]);
  const subtopic = subtopics.rows[0] || { id: null, name: 'None' };
  
  console.log(`Domain: ${domain.name}`);
  console.log(`Subject: ${subject.name}`);
  console.log(`Topic: ${topic.name}`);
  console.log(`Active Subtopic: ${subtopic.name}\n`);
  
  await runTest(domain, subject, topic, subtopic);
  
} catch (err) {
  console.error('Error:', err.message);
  console.error(err.stack);
  process.exit(1);
} finally {
  await shcPool.end();
  await tutorialPool.end();
}

async function runTest(domain, subject, topic, subtopic) {
  
  // Universal navigation JSON
  const navigationJSON = {
    topics: [
      {
        id: "javascript",
        name: "JavaScript",
        type: "group",
        icon: "javascript",
        expanded: true,
        children: [
          {
            id: "javascript-fundamentals",
            name: "JavaScript Fundamentals",
            type: "group",
            icon: "book",
            expanded: true,
            children: [
              {
                id: "what-is-javascript",
                name: "What Is JavaScript?",
                type: "page",
                icon: "folder"
              },
              {
                id: "javascript-syntax",
                name: "JavaScript Syntax",
                type: "page",
                icon: "folder"
              }
            ]
          },
          {
            id: "functions",
            name: "Functions",
            type: "group",
            icon: "folder",
            children: [
              {
                id: "what-is-function",
                name: "What Is Function?",
                type: "page",
                icon: "folder"
              }
            ]
          }
        ]
      }
    ]
  };
  
  // POST to API
  console.log('Saving to API...');
  const response = await fetch('http://localhost:3007/api/tutorial-left-sidebar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brandId: 'shared',
      domainId: domain.id,
      subjectId: subject.id,
      topicId: topic.id,
      activeSubtopicId: subtopic.id,
      tree: navigationJSON,
      sourceFormat: 'json',
      sourceContent: JSON.stringify(navigationJSON, null, 2),
      status: 'draft'
    })
  });
  
  const result = await response.json();
  
  console.log(`HTTP Status: ${response.status}`);
  console.log(`Success: ${result.success || false}`);
  console.log(`Message: ${result.message || result.error || 'N/A'}\n`);
  
  if (!response.ok) {
    console.error('API call failed');
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
  
  // Query database
  console.log('Querying database...');
  const rows = await tutorialPool.query('SELECT * FROM tutorial_sidebar_trees_v2');
  
  console.log(`Rows after save: ${rows.rows.length}\n`);
  
  if (rows.rows.length !== 1) {
    console.error(`Expected 1 row, got ${rows.rows.length}`);
    process.exit(1);
  }
  
  const row = rows.rows[0];
  
  console.log('=== DATABASE RECORD ===\n');
  console.log(`id: ${row.id}`);
  console.log(`brand_id: ${row.brand_id}`);
  console.log(`domain_id: ${row.domain_id}`);
  console.log(`subject_id: ${row.subject_id}`);
  console.log(`topic_id: ${row.topic_id}`);
  console.log(`active_subtopic_id: ${row.active_subtopic_id}`);
  console.log(`source_format: ${row.source_format}`);
  console.log(`status: ${row.status}`);
  console.log(`version: ${row.version}`);
  console.log(`created_at: ${row.created_at}`);
  console.log(`\n=== SOURCE_CONTENT ===\n`);
  console.log(JSON.stringify(row.source_content, null, 2));
  
  console.log(`\n=== TREE ===\n`);
  console.log(JSON.stringify(row.tree, null, 2));
  
  // Audit URLs
  function countUrls(node) {
    let count = node.url ? 1 : 0;
    if (node.children) {
      count += node.children.reduce((sum, child) => sum + countUrls(child), 0);
    }
    return count;
  }
  
  function countPages(node) {
    let count = node.type === 'page' ? 1 : 0;
    if (node.children) {
      count += node.children.reduce((sum, child) => sum + countPages(child), 0);
    }
    return count;
  }
  
  function countGroupsWithUrls(node) {
    let count = (node.type === 'group' && node.url) ? 1 : 0;
    if (node.children) {
      count += node.children.reduce((sum, child) => sum + countGroupsWithUrls(child), 0);
    }
    return count;
  }
  
  const pageCount = row.tree.topics.reduce((sum, t) => sum + countPages(t), 0);
  const urlCount = row.tree.topics.reduce((sum, t) => sum + countUrls(t), 0);
  const groupsWithUrls = row.tree.topics.reduce((sum, t) => sum + countGroupsWithUrls(t), 0);
  
  console.log(`\n=== URL AUDIT ===\n`);
  console.log(`Page nodes: ${pageCount}`);
  console.log(`Generated URLs: ${urlCount}`);
  console.log(`Group nodes with URLs: ${groupsWithUrls}`);
  
  console.log(`\n=== RESULT ===\n`);
  if (row.brand_id === 'shared' && row.version === 1 && urlCount === pageCount && groupsWithUrls === 0) {
    console.log('✅ PASS\n');
  } else {
    console.log('❌ FAIL\n');
  }
}
