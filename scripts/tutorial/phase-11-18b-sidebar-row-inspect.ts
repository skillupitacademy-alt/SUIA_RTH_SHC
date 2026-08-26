#!/usr/bin/env tsx
/**
 * PHASE 11.18B: Inspect Existing Sidebar Row
 * READ ONLY - Determine origin of tutorial_sidebar_trees_v2 row
 */

// CRITICAL: Load dotenv BEFORE any db imports
import 'dotenv/config';

// Now safe to import db
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

  section('PART 1: SCHEMA INSPECTION');

  const schemaQuery = await tutorialDb.execute(sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tutorial_sidebar_trees_v2'
    ORDER BY ordinal_position
  `);

  console.log('tutorial_sidebar_trees_v2 columns:');
  console.log('');
  schemaQuery.rows.forEach((row: any) => {
    console.log(`  ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} nullable: ${row.is_nullable}`);
  });

  section('PART 2: EXISTING ROW DATA');

  const rowQuery = await tutorialDb.execute(sql`
    SELECT *
    FROM tutorial_sidebar_trees_v2
  `);

  if (rowQuery.rows.length === 0) {
    console.log('No rows found in tutorial_sidebar_trees_v2');
    console.log('');
    console.log('CLASSIFICATION: NO_SIDEBAR_ROW');
    return;
  }

  if (rowQuery.rows.length > 1) {
    console.log(`⚠️  WARNING: Found ${rowQuery.rows.length} rows, expected 1`);
    console.log('');
  }

  const row = rowQuery.rows[0] as any;

  console.log('Row data:');
  console.log('');
  console.log(JSON.stringify(row, null, 2));

  section('PART 3: KEY FIELD ANALYSIS');

  console.log('Status:');
  console.log(`  ${row.status || 'NULL'}`);
  console.log('');

  console.log('Timestamps:');
  console.log(`  created_at:   ${row.created_at || 'NULL'}`);
  console.log(`  updated_at:   ${row.updated_at || 'NULL'}`);
  console.log(`  published_at: ${row.published_at || 'NULL'}`);
  console.log('');

  console.log('Identity:');
  console.log(`  id:         ${row.id || 'NULL'}`);
  console.log(`  brand_id:   ${row.brand_id || 'NULL'}`);
  console.log(`  topic_id:   ${row.topic_id || 'NULL'}`);
  console.log(`  domain_id:  ${row.domain_id || 'NULL'}`);
  console.log(`  subject_id: ${row.subject_id || 'NULL'}`);
  console.log('');

  console.log('Metadata:');
  console.log(`  version:       ${row.version || 'NULL'}`);
  console.log(`  source_format: ${row.source_format || 'NULL'}`);
  console.log('');

  section('PART 4: TREE STRUCTURE');

  if (row.tree) {
    console.log('Tree payload exists:');
    console.log('');
    console.log(JSON.stringify(row.tree, null, 2));
    console.log('');

    // Analyze tree structure
    if (typeof row.tree === 'object' && row.tree !== null) {
      const tree = row.tree as any;
      
      if (tree.topics && Array.isArray(tree.topics)) {
        console.log(`Tree contains ${tree.topics.length} top-level nodes`);
        
        function countNodes(nodes: any[]): number {
          let count = nodes.length;
          for (const node of nodes) {
            if (node.children && Array.isArray(node.children)) {
              count += countNodes(node.children);
            }
          }
          return count;
        }
        
        const totalNodes = countNodes(tree.topics);
        console.log(`Total navigation nodes: ${totalNodes}`);
        console.log('');
        
        // Look for Java-related nodes
        function findJavaNodes(nodes: any[], path: string = ''): void {
          for (const node of nodes) {
            const currentPath = path ? `${path} → ${node.name}` : node.name;
            if (node.name && (
              node.name.toLowerCase().includes('java') ||
              node.name.toLowerCase().includes('what is')
            )) {
              console.log(`  Found: ${currentPath}`);
              console.log(`    id: ${node.id || 'NO ID'}`);
              console.log(`    type: ${node.type || 'NO TYPE'}`);
              console.log(`    url: ${node.url || 'NO URL'}`);
            }
            if (node.children && Array.isArray(node.children)) {
              findJavaNodes(node.children, currentPath);
            }
          }
        }
        
        console.log('Java-related nodes:');
        findJavaNodes(tree.topics);
      }
    }
  } else {
    console.log('Tree payload is NULL or empty');
  }

  section('PART 5: CLASSIFICATION');

  const isDraft = row.status === 'draft';
  const isPublished = row.status === 'published';
  const hasPublishedAt = row.published_at !== null && row.published_at !== undefined;
  const createdRecently = row.created_at && new Date(row.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

  console.log('Analysis:');
  console.log('');
  console.log(`  Status is "draft": ${isDraft ? 'YES' : 'NO'}`);
  console.log(`  Status is "published": ${isPublished ? 'YES' : 'NO'}`);
  console.log(`  Has published_at timestamp: ${hasPublishedAt ? 'YES' : 'NO'}`);
  console.log(`  Created within last 24h: ${createdRecently ? 'YES' : 'NO'}`);
  console.log('');

  if (isDraft && !hasPublishedAt) {
    console.log('CLASSIFICATION: SAVE_DRAFT_CREATED_ROW ✅');
    console.log('');
    console.log('Evidence:');
    console.log('  - Status is "draft"');
    console.log('  - published_at is NULL');
    console.log('  - Consistent with Save Draft operation');
    console.log('');
    console.log('Conclusion:');
    console.log('  This row was created by Save Draft, not Publish.');
    console.log('  Publish never completed successfully.');
  } else if (isPublished && hasPublishedAt) {
    console.log('CLASSIFICATION: PUBLISH_CREATED_ROW ⚠️');
    console.log('');
    console.log('Evidence:');
    console.log('  - Status is "published"');
    console.log('  - published_at has timestamp');
    console.log('');
    console.log('⚠️  WARNING: This contradicts the reported Publish failure.');
    console.log('   Either Publish succeeded after the error, or the error was');
    console.log('   from a subsequent operation.');
  } else if (isPublished && !hasPublishedAt) {
    console.log('CLASSIFICATION: INCONSISTENT_STATE ❌');
    console.log('');
    console.log('Evidence:');
    console.log('  - Status is "published"');
    console.log('  - published_at is NULL');
    console.log('');
    console.log('This is an inconsistent state. Status should not be published');
    console.log('without a published_at timestamp.');
  } else {
    console.log('CLASSIFICATION: OTHER_STATE');
    console.log('');
    console.log(`Status: ${row.status}`);
    console.log(`published_at: ${row.published_at}`);
  }

  section('PART 6: EXPECTED JAVA TOPIC ID');

  const expectedTopicId = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';
  const topicIdMatch = row.topic_id === expectedTopicId;

  console.log(`Expected topic_id: ${expectedTopicId}`);
  console.log(`Actual topic_id:   ${row.topic_id}`);
  console.log(`Match: ${topicIdMatch ? 'YES ✅' : 'NO ❌'}`);
  
  if (!topicIdMatch) {
    console.log('');
    console.log('⚠️  WARNING: topic_id does not match Java topic');
    console.log('   This row may be for a different topic.');
  }
}

main().catch(error => {
  console.error('');
  console.error('FORENSIC FAILED');
  console.error(error);
  process.exit(1);
});
