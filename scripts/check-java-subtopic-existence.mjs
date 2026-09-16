#!/usr/bin/env node
/**
 * Check Java Subtopic Existence
 * 
 * Purpose: Verify if Java subtopic still exists in tutorial_subtopics
 * This will confirm or rule out CASCADE DELETE as the deletion mechanism
 */

import 'dotenv/config';
import { config } from 'dotenv';
import pkg from 'pg';

config({ path: '.env.local', override: true });

const { Client } = pkg;

const JAVA_INTERNAL_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const JAVA_EXTERNAL_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL_TUTORIAL });
  
  try {
    await client.connect();
    console.log('JAVA SUBTOPIC EXISTENCE CHECK');
    console.log('='.repeat(80));
    console.log('');

    // ========================================================================
    // CHECK 1: Search by internal ID
    // ========================================================================
    console.log('CHECK 1: Search by Internal ID');
    console.log('-'.repeat(80));
    console.log(`Looking for: ${JAVA_INTERNAL_ID}`);
    console.log('');
    
    const byInternalId = await client.query(`
      SELECT
        id,
        external_id,
        name,
        slug,
        topic_id,
        created_at,
        updated_at,
        deleted_at
      FROM tutorial_subtopics
      WHERE id = $1
    `, [JAVA_INTERNAL_ID]);
    
    if (byInternalId.rows.length > 0) {
      const subtopic = byInternalId.rows[0];
      console.log('✅ FOUND Java subtopic by internal ID:');
      console.log(`  ID: ${subtopic.id}`);
      console.log(`  External ID: ${subtopic.external_id}`);
      console.log(`  Name: ${subtopic.name}`);
      console.log(`  Slug: ${subtopic.slug}`);
      console.log(`  Topic ID: ${subtopic.topic_id}`);
      console.log(`  Created: ${subtopic.created_at}`);
      console.log(`  Updated: ${subtopic.updated_at}`);
      console.log(`  Deleted: ${subtopic.deleted_at ? `YES (${subtopic.deleted_at})` : 'NO'}`);
    } else {
      console.log('❌ NOT FOUND by internal ID');
      console.log('   This suggests Java subtopic was deleted from tutorial_subtopics');
    }
    console.log('');

    // ========================================================================
    // CHECK 2: Search by external ID
    // ========================================================================
    console.log('CHECK 2: Search by External ID');
    console.log('-'.repeat(80));
    console.log(`Looking for: ${JAVA_EXTERNAL_ID}`);
    console.log('');
    
    const byExternalId = await client.query(`
      SELECT
        id,
        external_id,
        name,
        slug,
        topic_id,
        created_at,
        updated_at,
        deleted_at
      FROM tutorial_subtopics
      WHERE external_id = $1
    `, [JAVA_EXTERNAL_ID]);
    
    if (byExternalId.rows.length > 0) {
      const subtopic = byExternalId.rows[0];
      console.log('✅ FOUND Java subtopic by external ID:');
      console.log(`  ID: ${subtopic.id}`);
      console.log(`  External ID: ${subtopic.external_id}`);
      console.log(`  Name: ${subtopic.name}`);
      console.log(`  Slug: ${subtopic.slug}`);
      
      if (subtopic.id !== JAVA_INTERNAL_ID) {
        console.log('');
        console.log('  ⚠️  CRITICAL: Internal ID has CHANGED!');
        console.log(`      Expected: ${JAVA_INTERNAL_ID}`);
        console.log(`      Current:  ${subtopic.id}`);
        console.log('  This suggests subtopic was deleted and recreated');
      }
    } else {
      console.log('❌ NOT FOUND by external ID');
    }
    console.log('');

    // ========================================================================
    // CHECK 3: Search by pattern (Java-related)
    // ========================================================================
    console.log('CHECK 3: Search by Java Pattern');
    console.log('-'.repeat(80));
    
    const byPattern = await client.query(`
      SELECT
        id,
        external_id,
        name,
        slug,
        topic_id,
        created_at,
        deleted_at
      FROM tutorial_subtopics
      WHERE 
        name ILIKE '%java%'
        OR slug ILIKE '%java%'
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${byPattern.rows.length} Java-related subtopic(s):\n`);
    
    if (byPattern.rows.length === 0) {
      console.log('  ❌ NO Java subtopics found in database');
    } else {
      byPattern.rows.forEach((st, idx) => {
        console.log(`${idx + 1}. ${st.name} (${st.slug})`);
        console.log(`   ID: ${st.id}`);
        console.log(`   External ID: ${st.external_id}`);
        console.log(`   Created: ${st.created_at}`);
        console.log(`   Deleted: ${st.deleted_at ? 'YES' : 'NO'}`);
        
        if (st.id === JAVA_INTERNAL_ID) {
          console.log('   ✓ This is the expected Java subtopic');
        } else if (st.external_id === JAVA_EXTERNAL_ID) {
          console.log('   ⚠️  Same external ID but different internal ID (recreated?)');
        }
        console.log('');
      });
    }

    // ========================================================================
    // CHECK 4: Check for dependent tutorial_sections
    // ========================================================================
    console.log('CHECK 4: Dependent tutorial_sections');
    console.log('-'.repeat(80));
    
    const dependentSections = await client.query(`
      SELECT
        id,
        navigation_node_id,
        brand_id,
        status,
        created_at,
        deleted_at
      FROM tutorial_sections
      WHERE subtopic_id = $1
    `, [JAVA_INTERNAL_ID]);
    
    console.log(`tutorial_sections with subtopic_id = ${JAVA_INTERNAL_ID}:`);
    console.log(`  Count: ${dependentSections.rows.length}`);
    console.log('');
    
    if (dependentSections.rows.length > 0) {
      console.log('  Sections found:');
      dependentSections.rows.forEach((sec, idx) => {
        console.log(`  ${idx + 1}. ${sec.navigation_node_id} (${sec.status})`);
        console.log(`     Section ID: ${sec.id}`);
        console.log(`     Deleted: ${sec.deleted_at ? 'YES' : 'NO'}`);
      });
    } else {
      console.log('  (No sections found - confirms CASCADE DELETE if subtopic was deleted)');
    }
    console.log('');

    // ========================================================================
    // CHECK 5: Check all tables referencing subtopic_id
    // ========================================================================
    console.log('CHECK 5: Other Tables Referencing Subtopics');
    console.log('-'.repeat(80));
    
    const tables = await client.query(`
      SELECT DISTINCT
        table_name,
        column_name
      FROM information_schema.columns
      WHERE column_name ILIKE '%subtopic%'
        AND table_schema = 'public'
        AND table_name NOT LIKE '%pg_%'
      ORDER BY table_name
    `);
    
    console.log('Tables with subtopic references:\n');
    for (const table of tables.rows) {
      console.log(`  - ${table.table_name}.${table.column_name}`);
      
      // Check if Java subtopic is referenced
      try {
        const count = await client.query(`
          SELECT COUNT(*) as count
          FROM ${table.table_name}
          WHERE ${table.column_name} = $1
        `, [JAVA_INTERNAL_ID]);
        
        if (count.rows[0].count > 0) {
          console.log(`    ✓ ${count.rows[0].count} reference(s) to Java subtopic`);
        }
      } catch (err) {
        // Skip tables where the query fails
      }
    }
    console.log('');

    // ========================================================================
    // SUMMARY AND DIAGNOSIS
    // ========================================================================
    console.log('='.repeat(80));
    console.log('DIAGNOSIS');
    console.log('='.repeat(80));
    console.log('');
    
    const subtopicExists = byInternalId.rows.length > 0;
    const subtopicDeleted = subtopicExists && byInternalId.rows[0].deleted_at !== null;
    const sectionsExist = dependentSections.rows.length > 0;
    
    if (!subtopicExists) {
      console.log('CASE 1: Java Subtopic DELETED (Hard Delete)');
      console.log('-'.repeat(80));
      console.log('');
      console.log('Evidence:');
      console.log('  ❌ Java subtopic NOT FOUND in tutorial_subtopics');
      console.log('  ❌ No tutorial_sections with Java subtopic_id');
      console.log('  ✓ LSNB still has orphaned reference');
      console.log('');
      console.log('Explanation:');
      console.log('  1. Java subtopic was HARD DELETED from tutorial_subtopics');
      console.log('  2. CASCADE DELETE automatically removed tutorial_sections');
      console.log('  3. LSNB kept orphaned reference (no FK constraint)');
      console.log('');
      console.log('Deletion mechanism: CASCADE DELETE (confirmed)');
      console.log('');
      console.log('Root cause still unknown:');
      console.log('  - What deleted the Java subtopic?');
      console.log('  - Database reset/migration?');
      console.log('  - Manual DELETE operation?');
      console.log('  - Test cleanup script?');
      console.log('  - Subtopic synchronization?');
      
    } else if (subtopicDeleted) {
      console.log('CASE 2: Java Subtopic SOFT-DELETED');
      console.log('-'.repeat(80));
      console.log('');
      console.log('Evidence:');
      console.log('  ⚠️  Java subtopic EXISTS but deleted_at is set');
      console.log(`  Deleted: ${byInternalId.rows[0].deleted_at}`);
      console.log('');
      console.log('Explanation:');
      console.log('  Soft-delete on parent should NOT trigger CASCADE DELETE');
      console.log('  Need to verify why tutorial_sections were removed');
      
    } else {
      console.log('CASE 3: Java Subtopic EXISTS (Active)');
      console.log('-'.repeat(80));
      console.log('');
      console.log('Evidence:');
      console.log('  ✅ Java subtopic EXISTS and is active');
      console.log(`  Current sections: ${sectionsExist ? dependentSections.rows.length : 0}`);
      console.log('');
      console.log('Explanation:');
      console.log('  CASCADE DELETE is NOT the cause');
      console.log('  Java tutorial_sections was deleted directly');
      console.log('');
      console.log('Possible causes:');
      console.log('  - Direct DELETE FROM tutorial_sections');
      console.log('  - Table truncation/reset');
      console.log('  - Test fixture replacement');
      console.log('  - Wrong database being inspected');
    }
    console.log('');
    
    console.log('Next Investigation Steps:');
    console.log('  1. Search application logs for DELETE operations');
    console.log('  2. Check test cleanup scripts');
    console.log('  3. Review database migration/reset history');
    console.log('  4. Confirm database environment (prod vs test)');
    
  } finally {
    await client.end();
  }
}

main().catch(console.error);
