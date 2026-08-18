import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\n=== DATABASE INSPECTION AFTER FRESH SAVE ===\n');

try {
  const rows = await tutorialPool.query(`
    SELECT 
      id, brand_id, domain_id, subject_id, topic_id, active_subtopic_id,
      source_format, status, version, created_at, updated_at,
      source_content, tree
    FROM tutorial_sidebar_trees_v2
    ORDER BY created_at DESC
  `);
  
  console.log(`Total rows: ${rows.rows.length}\n`);
  
  if (rows.rows.length === 0) {
    console.log('❌ NO ROWS FOUND - Save did not complete\n');
    process.exit(1);
  }
  
  const row = rows.rows[0];
  
  console.log('=== RECORD METADATA ===\n');
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
  console.log(`updated_at: ${row.updated_at || 'null'}`);
  
  console.log('\n=== SOURCE_CONTENT (Author JSON) ===\n');
  console.log(JSON.stringify(row.source_content, null, 2));
  
  // Check for prohibited fields in source_content
  const sourceProhibited = [];
  if (row.source_content.brand) sourceProhibited.push('brand');
  if (row.source_content.theme) sourceProhibited.push('theme');
  if (row.source_content.progress) sourceProhibited.push('progress');
  if (row.source_content.subject) sourceProhibited.push('subject');
  
  console.log('\n=== TREE (Delivery JSON) ===\n');
  console.log(JSON.stringify(row.tree, null, 2));
  
  // Audit URLs
  function auditNode(node, depth = 1, results = { pages: 0, groups: 0, urls: 0, groupsWithUrls: 0, maxDepth: 1 }) {
    results.maxDepth = Math.max(results.maxDepth, depth);
    
    if (node.type === 'page') {
      results.pages++;
      if (node.url) results.urls++;
    } else if (node.type === 'group') {
      results.groups++;
      if (node.url) results.groupsWithUrls++;
    }
    
    if (node.children) {
      node.children.forEach(child => auditNode(child, depth + 1, results));
    }
    
    return results;
  }
  
  const audit = { pages: 0, groups: 0, urls: 0, groupsWithUrls: 0, maxDepth: 0 };
  if (row.tree.topics) {
    row.tree.topics.forEach(topic => auditNode(topic, 1, audit));
  }
  
  console.log('\n=== URL AUDIT ===\n');
  console.log(`Page nodes: ${audit.pages}`);
  console.log(`Group nodes: ${audit.groups}`);
  console.log(`Generated URLs: ${audit.urls}`);
  console.log(`Groups with URLs: ${audit.groupsWithUrls}`);
  console.log(`Maximum depth: ${audit.maxDepth}`);
  
  // Check URL format
  const urlSamples = [];
  function collectUrls(node) {
    if (node.url) urlSamples.push(node.url);
    if (node.children) node.children.forEach(collectUrls);
  }
  if (row.tree.topics) row.tree.topics.forEach(collectUrls);
  
  if (urlSamples.length > 0) {
    console.log('\nSample URLs:');
    urlSamples.slice(0, 3).forEach(url => console.log(`  ${url}`));
    
    const legacyUrls = urlSamples.filter(url => !url.startsWith('/tutorial-v2/'));
    if (legacyUrls.length > 0) {
      console.log(`\n⚠️  Found ${legacyUrls.length} non-tutorial-v2 URLs:`);
      legacyUrls.forEach(url => console.log(`  ${url}`));
    }
  }
  
  console.log('\n=== VALIDATION ===\n');
  
  const checks = {
    'brand_id is shared': row.brand_id === 'shared',
    'version is 1': row.version === 1,
    'source_format is json': row.source_format === 'json',
    'status is draft': row.status === 'draft',
    'source_content has no prohibited fields': sourceProhibited.length === 0,
    'URLs match page count': audit.urls === audit.pages,
    'Groups have no URLs': audit.groupsWithUrls === 0,
    'Maximum depth is 3 or less': audit.maxDepth <= 3,
    'All URLs start with /tutorial-v2/': urlSamples.every(url => url.startsWith('/tutorial-v2/'))
  };
  
  let allPassed = true;
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
    if (!passed) allPassed = false;
  });
  
  if (sourceProhibited.length > 0) {
    console.log(`\n⚠️  source_content contains prohibited fields: ${sourceProhibited.join(', ')}`);
  }
  
  console.log(`\n=== RESULT ===\n`);
  console.log(allPassed ? '✅ PASS\n' : '❌ FAIL\n');
  
  if (!allPassed) {
    console.log('STOP: Do not proceed with further tests until this passes.\n');
  }
  
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await tutorialPool.end();
}
