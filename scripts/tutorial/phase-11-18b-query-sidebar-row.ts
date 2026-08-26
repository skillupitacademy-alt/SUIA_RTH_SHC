#!/usr/bin/env tsx
/**
 * PHASE 11.18B: Query Existing Sidebar Row
 * READ ONLY - Determine if row was created by Save Draft or Publish
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { sql } from 'drizzle-orm';
import { db as tutorialDb } from '@quiz/db-tutorial';

function section(title: string): void {
  console.log('');
  console.log('='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
  console.log('');
}

async function main() {
  console.log('PHASE 11.18B — SIDEBAR ROW FORENSIC');
  console.log('READ ONLY - NO DATABASE MODIFICATIONS');

  section('EXISTING SIDEBAR ROW DATA');

  const result = await tutorialDb.execute(sql`
    SELECT 
      id,
      brand_id,
      domain_id,
      subject_id,
      topic_id,
      active_subtopic_id,
      status,
      version,
      source_format,
      created_at,
      updated_at,
      published_at,
      tree
    FROM tutorial_sidebar_trees_v2
  `);

  if (result.rows.length === 0) {
    console.log('❌ No rows found in tutorial_sidebar_trees_v2');
    console.log('');
    console.log('CLASSIFICATION: NO_SIDEBAR_ROW');
    console.log('');
    console.log('This contradicts the investigation assumption.');
    console.log('Either the row was deleted, or never existed.');
    return;
  }

  const row = result.rows[0] as any;

  console.log(`Found ${result.rows.length} row(s)\n`);

  section('KEY FIELDS');

  console.log('Identity:');
  console.log(`  id:         ${row.id}`);
  console.log(`  brand_id:   ${row.brand_id}`);
  console.log(`  topic_id:   ${row.topic_id}`);
  console.log('');

  console.log('Status:');
  console.log(`  status:     ${row.status}`);
  console.log(`  version:    ${row.version}`);
  console.log('');

  console.log('Timestamps:');
  console.log(`  created_at:   ${row.created_at}`);
  console.log(`  updated_at:   ${row.updated_at}`);
  console.log(`  published_at: ${row.published_at || 'NULL'}`);
  console.log('');

  section('CLASSIFICATION ANALYSIS');

  const isDraft = row.status === 'draft';
  const isPublished = row.status === 'published';
  const hasPublishedTimestamp = row.published_at !== null;

  console.log(`Status is "draft": ${isDraft ? 'YES ✅' : 'NO'}`);
  console.log(`Status is "published": ${isPublished ? 'YES ✅' : 'NO'}`);
  console.log(`Has published_at timestamp: ${hasPublishedTimestamp ? 'YES' : 'NO'}`);
  console.log('');

  if (isDraft && !hasPublishedTimestamp) {
    console.log('CLASSIFICATION: SAVE_DRAFT_CREATED_ROW ✅');
    console.log('');
    console.log('Evidence:');
    console.log('  - Status is "draft"');
    console.log('  - published_at is NULL');
    console.log('  - Consistent with Save Draft operation');
    console.log('');
    console.log('Conclusion:');
    console.log('  This row was created by Save Draft, NOT by Publish.');
    console.log('  Publish never completed successfully.');
    console.log('  The 500 error prevented Publish from creating/updating this row.');
  } else if (isPublished && hasPublishedTimestamp) {
    console.log('CLASSIFICATION: PUBLISH_COMPLETED ⚠️');
    console.log('');
    console.log('Evidence:');
    console.log('  - Status is "published"');
    console.log('  - published_at has timestamp');
    console.log('');
    console.log('⚠️  WARNING: This contradicts the reported 500 error.');
    console.log('   Either:');
    console.log('   A. Publish succeeded after displaying error');
    console.log('   B. Error was from a different operation');
    console.log('   C. Multiple publish attempts occurred');
  } else if (isPublished && !hasPublishedTimestamp) {
    console.log('CLASSIFICATION: INCONSISTENT_STATE ❌');
    console.log('');
    console.log('Status is "published" but published_at is NULL.');
    console.log('This indicates data corruption or incomplete operation.');
  } else {
    console.log('CLASSIFICATION: OTHER_STATE');
    console.log(`  Status: ${row.status}`);
  }

  section('TOPIC ID VERIFICATION');

  const expectedJavaTopicId = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';
  const topicMatch = row.topic_id === expectedJavaTopicId;

  console.log(`Expected (Java): ${expectedJavaTopicId}`);
  console.log(`Actual:          ${row.topic_id}`);
  console.log(`Match: ${topicMatch ? 'YES ✅' : 'NO ❌'}`);

  if (!topicMatch) {
    console.log('');
    console.log('⚠️  WARNING: This sidebar row is NOT for Java topic');
    console.log('   Investigation may be looking at wrong data.');
  }

  section('TREE STRUCTURE PREVIEW');

  if (row.tree) {
    const tree = row.tree as any;
    
    if (tree.topics && Array.isArray(tree.topics)) {
      console.log(`Tree contains ${tree.topics.length} top-level topic(s)`);
      
      function findJavaNodes(nodes: any[], depth = 0): void {
        const indent = '  '.repeat(depth);
        for (const node of nodes) {
          if (node.name && (
            node.name.toLowerCase().includes('java') ||
            node.name.toLowerCase().includes('what is')
          )) {
            console.log(`${indent}→ ${node.name}`);
            console.log(`${indent}  id: ${node.id || 'NO ID'}`);
            console.log(`${indent}  type: ${node.type || 'NO TYPE'}`);
          }
          if (node.children && Array.isArray(node.children)) {
            findJavaNodes(node.children, depth + 1);
          }
        }
      }
      
      console.log('');
      console.log('Java-related nodes in tree:');
      findJavaNodes(tree.topics);
    } else {
      console.log('Tree structure unexpected or empty');
    }
  } else {
    console.log('Tree is NULL');
  }

  section('FINAL VERDICT');

  if (isDraft && !hasPublishedTimestamp && topicMatch) {
    console.log('✅ This sidebar row was created by SAVE DRAFT');
    console.log('✅ It is for the Java topic');
    console.log('✅ Publish never completed');
    console.log('');
    console.log('Next Investigation: Why did Publish fail?');
    console.log('  - Check ensureTopicHierarchySynced() execution');
    console.log('  - Review server logs for actual exception');
    console.log('  - Verify MainDB → TutorialDB sync logic');
  } else {
    console.log('⚠️  Unexpected state - requires further investigation');
  }
}

main().catch(error => {
  console.error('');
  console.error('QUERY FAILED');
  console.error(error);
  process.exit(1);
});
