import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\n════════════════════════════════════════════════════════════════');
console.log('POST-IMPLEMENTATION DATABASE AUDIT: tutorial_sidebar_trees_v2');
console.log('════════════════════════════════════════════════════════════════\n');

(async () => {
  try {
    // 1. TABLE EXISTENCE & ROW COUNT
    console.log('1. TABLE EXISTENCE & ROW COUNT\n');
    const countResult = await pool.query(`SELECT COUNT(*) FROM tutorial_sidebar_trees_v2`);
  const rowCount = parseInt(countResult.rows[0].count);
  console.log(`   Row count: ${rowCount}\n`);

  if (rowCount === 0) {
    console.log('   ✅ TABLE IS EMPTY - CLEAN STATE\n');
    console.log('════════════════════════════════════════════════════════════════\n');
    console.log('DATABASE AUDIT VERDICT:\n');
    console.log('   DATABASE CLEAN: YES');
    console.log('   LEGACY RECORDS: NO');
    console.log('   BRAND-SPECIFIC RECORDS: NO');
    console.log('   LEGACY URLS: NO');
    console.log('   PRESENTATION DATA IN TREE: NO');
    console.log('   LEVEL 4+ TREES: NO');
    console.log('   DUPLICATE LOGICAL RECORDS: NO');
    console.log('   MARKDOWN RECORDS: NO\n');
    console.log('   RECOMMENDATION: ✅ Ready for fresh functional testing\n');
    console.log('════════════════════════════════════════════════════════════════\n');
    process.exit(0);
  }

  // 2. RECORD INVENTORY
  console.log('2. RECORD INVENTORY\n');
  const rows = await pool.query(`
    SELECT 
      id, brand_id, domain_id, subject_id, topic_id, active_subtopic_id,
      source_format, status, version, created_at, updated_at, published_at, tree
    FROM tutorial_sidebar_trees_v2
    ORDER BY created_at ASC
  `);

  rows.rows.forEach((row, index) => {
    console.log(`   Record ${index + 1}:`);
    console.log(`     id: ${row.id}`);
    console.log(`     brand_id: ${row.brand_id}`);
    console.log(`     domain_id: ${row.domain_id}`);
    console.log(`     subject_id: ${row.subject_id}`);
    console.log(`     topic_id: ${row.topic_id}`);
    console.log(`     active_subtopic_id: ${row.active_subtopic_id || 'null'}`);
    console.log(`     source_format: ${row.source_format}`);
    console.log(`     status: ${row.status}`);
    console.log(`     version: ${row.version}`);
    console.log(`     created_at: ${row.created_at}`);
    console.log('');
  });

  // 3. BRAND AUDIT
  console.log('3. BRAND AUDIT\n');
  const brandResult = await pool.query(`
    SELECT brand_id, COUNT(*) as count
    FROM tutorial_sidebar_trees_v2
    GROUP BY brand_id
    ORDER BY brand_id
  `);

  brandResult.rows.forEach(r => {
    console.log(`   ${r.brand_id}: ${r.count} record(s)`);
  });
  console.log('');

  // 4. JSON CONTENT AUDIT
  console.log('4. JSON CONTENT AUDIT\n');
  rows.rows.forEach((row, index) => {
    const tree = row.tree;
    const fields = Object.keys(tree);
    console.log(`   Record ${index + 1} (id: ${row.id}):`);
    console.log(`     Fields in tree: ${fields.join(', ')}`);
    
    if (tree.brand) console.log(`     ⚠️  Contains 'brand'`);
    if (tree.theme) console.log(`     ⚠️  Contains 'theme'`);
    if (tree.subject) console.log(`     ⚠️  Contains 'subject'`);
    if (tree.progress) console.log(`     ⚠️  Contains 'progress'`);
    if (tree.topics) console.log(`     ✓ Contains 'topics' (${tree.topics.length} items)`);
    console.log('');
  });

  // 5. LEGACY URL AUDIT
  console.log('5. LEGACY URL AUDIT\n');
  
  function extractUrls(node, urls = []) {
    if (node.url) urls.push(node.url);
    if (node.children) {
      node.children.forEach(child => extractUrls(child, urls));
    }
    return urls;
  }

  rows.rows.forEach((row, index) => {
    const tree = row.tree;
    const urls = [];
    
    if (tree.topics) {
      tree.topics.forEach(topic => extractUrls(topic, urls));
    }
    
    console.log(`   Record ${index + 1} (id: ${row.id}):`);
    console.log(`     topic_id: ${row.topic_id}`);
    console.log(`     brand_id: ${row.brand_id}`);
    if (urls.length > 0) {
      console.log(`     ⚠️  Contains ${urls.length} URL(s):`);
      urls.slice(0, 3).forEach(url => console.log(`       - ${url}`));
      if (urls.length > 3) console.log(`       ... and ${urls.length - 3} more`);
    } else {
      console.log(`     ✓ No URLs found`);
    }
    console.log('');
  });

  // 6. NAVIGATION DEPTH AUDIT
  console.log('6. NAVIGATION DEPTH AUDIT\n');
  
  function calculateMaxDepth(nodes, currentDepth = 1) {
    if (!nodes || nodes.length === 0) return currentDepth - 1;
    return Math.max(...nodes.map(node => 
      calculateMaxDepth(node.children || [], currentDepth + 1)
    ));
  }

  rows.rows.forEach((row, index) => {
    const tree = row.tree;
    const maxDepth = tree.topics ? calculateMaxDepth(tree.topics) : 0;
    console.log(`   Record ${index + 1} (id: ${row.id}):`);
    console.log(`     Maximum depth: ${maxDepth}`);
    if (maxDepth > 3) {
      console.log(`     ⚠️  EXCEEDS maximum allowed depth of 3`);
    } else {
      console.log(`     ✓ Within allowed depth`);
    }
    console.log('');
  });

  // 7. PRESENTATION DATA AUDIT
  console.log('7. PRESENTATION DATA AUDIT\n');
  const recordsWithPresentation = rows.rows.filter(row => {
    const tree = row.tree;
    return tree.brand || tree.theme || tree.progress;
  });
  
  if (recordsWithPresentation.length > 0) {
    console.log(`   ⚠️  ${recordsWithPresentation.length} record(s) contain presentation data:`);
    recordsWithPresentation.forEach(row => console.log(`     - ${row.id}`));
  } else {
    console.log(`   ✓ No records contain presentation data (brand/theme/progress)`);
  }
  console.log('');

  // 8. RECORD DUPLICATION AUDIT
  console.log('8. RECORD DUPLICATION AUDIT\n');
  const dupResult = await pool.query(`
    SELECT brand_id, topic_id, COUNT(*) as count
    FROM tutorial_sidebar_trees_v2
    GROUP BY brand_id, topic_id
    HAVING COUNT(*) > 1
  `);
  
  if (dupResult.rows.length > 0) {
    console.log(`   ⚠️  Found ${dupResult.rows.length} duplicate logical record(s):`);
    dupResult.rows.forEach(r => {
      console.log(`     ${r.brand_id}:${r.topic_id}: ${r.count} records`);
    });
  } else {
    console.log(`   ✓ No duplicate (brand_id, topic_id) combinations`);
  }
  console.log('');

  // 9. SOURCE FORMAT AUDIT
  console.log('9. SOURCE FORMAT AUDIT\n');
  const formatResult = await pool.query(`
    SELECT source_format, COUNT(*) as count
    FROM tutorial_sidebar_trees_v2
    GROUP BY source_format
    ORDER BY source_format
  `);
  
  formatResult.rows.forEach(r => {
    console.log(`   ${r.source_format}: ${r.count} record(s)`);
  });
  console.log('');

  // 10. FINAL VERDICT
  console.log('════════════════════════════════════════════════════════════════\n');
  console.log('DATABASE AUDIT VERDICT:\n');
  
  const hasLegacy = rows.rows.some(r => {
    const tree = r.tree;
    return tree.brand || tree.theme || tree.progress;
  });
  const hasBrandSpecific = rows.rows.some(r => r.brand_id !== 'shared');
  const hasLegacyUrls = rows.rows.some(r => {
    const tree = r.tree;
    const urls = [];
    if (tree.topics) tree.topics.forEach(t => extractUrls(t, urls));
    return urls.length > 0;
  });
  const hasLevel4 = rows.rows.some(r => {
    const tree = r.tree;
    return tree.topics ? calculateMaxDepth(tree.topics) > 3 : false;
  });
  const hasDuplicates = dupResult.rows.length > 0;
  const hasMarkdown = rows.rows.some(r => r.source_format === 'markdown');

  console.log(`   DATABASE CLEAN: ${!hasLegacy && !hasDuplicates && !hasLevel4 ? 'YES' : 'NO'}`);
  console.log(`   LEGACY RECORDS: ${hasLegacy ? 'YES' : 'NO'}`);
  console.log(`   BRAND-SPECIFIC RECORDS: ${hasBrandSpecific ? 'YES' : 'NO'}`);
  console.log(`   LEGACY URLS: ${hasLegacyUrls ? 'YES' : 'NO'}`);
  console.log(`   PRESENTATION DATA IN TREE: ${recordsWithPresentation.length > 0 ? 'YES' : 'NO'}`);
  console.log(`   LEVEL 4+ TREES: ${hasLevel4 ? 'YES' : 'NO'}`);
  console.log(`   DUPLICATE LOGICAL RECORDS: ${hasDuplicates ? 'YES' : 'NO'}`);
  console.log(`   MARKDOWN RECORDS: ${hasMarkdown ? 'YES' : 'NO'}\n');

  // Recommendation
  console.log('   RECOMMENDATION:\n');
  if (rowCount <= 5 && !hasLegacy && !hasDuplicates && !hasLevel4) {
    console.log('   🟡 A. Keep existing data (appears to be test data in good shape)');
    console.log('   🟡 B. Clean existing records (if you want to start fresh)\n');
  } else if (hasLegacy || hasLevel4 || hasDuplicates) {
    console.log('   🔴 C. Clean/migrate existing records before testing');
    console.log('      Reasons:');
    if (hasLegacy) console.log('      - Contains legacy presentation data');
    if (hasLevel4) console.log('      - Contains Level 4+ navigation depth');
    if (hasDuplicates) console.log('      - Contains duplicate logical records');
    console.log('');
  } else {
    console.log('   ✅ Ready for functional testing\n');
  }
  console.log('════════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('Audit failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
