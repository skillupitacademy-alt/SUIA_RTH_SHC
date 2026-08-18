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
  // Get any valid hierarchy
  const topics = await shcPool.query('SELECT id, name, subject_id FROM topics WHERE deleted_at IS NULL LIMIT 1');
  const topic = topics.rows[0];
  
  const subjects = await shcPool.query('SELECT id, name, domain_id FROM subjects WHERE id = $1', [topic.subject_id]);
  const subject = subjects.rows[0];
  
  const domains = await shcPool.query('SELECT id, name FROM domains WHERE id = $1', [subject.domain_id]);
  const domain = domains.rows[0];
  
  const subtopics = await shcPool.query('SELECT id, name FROM subtopics WHERE topic_id = $1 AND deleted_at IS NULL LIMIT 1', [topic.id]);
  const subtopic = subtopics.rows[0];
  
  console.log('Hierarchy:');
  console.log(`  Domain: ${domain.name}`);
  console.log(`  Subject: ${subject.name}`);
  console.log(`  Topic: ${topic.name}`);
  console.log(`  Active Subtopic: ${subtopic ? subtopic.name : 'None'}\n`);
  
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
            children: [
              {
                id: "what-is-javascript",
                name: "What Is JavaScript?",
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
      activeSubtopicId: subtopic ? subtopic.id : null,
      tree: navigationJSON,
      sourceFormat: 'json',
      sourceContent: JSON.stringify(navigationJSON, null, 2),
      status: 'draft'
    })
  });
  
  const result = await response.json();
  
  console.log(`\nPOST:`);
  console.log(`  HTTP status: ${response.status}`);
  console.log(`  success: ${result.success || false}`);
  console.log(`  message: ${result.message || result.error || 'N/A'}`);
  
  if (!response.ok) {
    console.error('\nAPI call failed:');
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
  
  // Query database
  const rows = await tutorialPool.query('SELECT * FROM tutorial_sidebar_trees_v2');
  
  console.log(`\nDATABASE:`);
  console.log(`  Rows after: ${rows.rows.length}`);
  
  if (rows.rows.length !== 1) {
    console.error(`\nExpected 1 row, got ${rows.rows.length}`);
    process.exit(1);
  }
  
  const row = rows.rows[0];
  
  console.log(`\nRECORD:`);
  console.log(`  id: ${row.id}`);
  console.log(`  brand_id: ${row.brand_id}`);
  console.log(`  domain_id: ${row.domain_id}`);
  console.log(`  subject_id: ${row.subject_id}`);
  console.log(`  topic_id: ${row.topic_id}`);
  console.log(`  active_subtopic_id: ${row.active_subtopic_id}`);
  console.log(`  source_format: ${row.source_format}`);
  console.log(`  status: ${row.status}`);
  console.log(`  version: ${row.version}`);
  
  console.log(`\nSOURCE_CONTENT:`);
  console.log(JSON.stringify(row.source_content, null, 2));
  
  console.log(`\nTREE:`);
  console.log(JSON.stringify(row.tree, null, 2));
  
  // Audit URLs
  function countNodes(node, condition) {
    let count = condition(node) ? 1 : 0;
    if (node.children) {
      count += node.children.reduce((sum, child) => sum + countNodes(child, condition), 0);
    }
    return count;
  }
  
  const pageCount = row.tree.topics.reduce((sum, t) => sum + countNodes(t, n => n.type === 'page'), 0);
  const urlCount = row.tree.topics.reduce((sum, t) => sum + countNodes(t, n => !!n.url), 0);
  const groupsWithUrls = row.tree.topics.reduce((sum, t) => sum + countNodes(t, n => n.type === 'group' && n.url), 0);
  
  console.log(`\nURL AUDIT:`);
  console.log(`  Page nodes: ${pageCount}`);
  console.log(`  Generated URLs: ${urlCount}`);
  console.log(`  Group nodes with URLs: ${groupsWithUrls}`);
  
  console.log(`\nRESULT:`);
  if (row.brand_id === 'shared' && row.version === 1 && urlCount === pageCount && groupsWithUrls === 0) {
    console.log('  ✅ PASS\n');
  } else {
    console.log('  ❌ FAIL');
    if (row.brand_id !== 'shared') console.log('    - brand_id should be "shared"');
    if (row.version !== 1) console.log('    - version should be 1');
    if (urlCount !== pageCount) console.log(`    - URL count (${urlCount}) should equal page count (${pageCount})`);
    if (groupsWithUrls > 0) console.log(`    - Groups should not have URLs (found ${groupsWithUrls})`);
    console.log('');
  }
  
} catch (err) {
  console.error('\nError:', err.message);
  console.error(err.stack);
  process.exit(1);
} finally {
  await shcPool.end();
  await tutorialPool.end();
}
