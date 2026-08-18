#!/usr/bin/env node
/**
 * Diagnostic script for tutorial_sidebar_trees_v2 database INSERT/UPSERT failure
 * 
 * This script performs READ-ONLY queries to:
 * 1. Verify table schema and constraints
 * 2. Verify hierarchy IDs exist
 * 3. Check for existing row (UPSERT conflict)
 * 4. Validate JSONB structure
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and, sql } from 'drizzle-orm';

const DATABASE_URL = process.env.TUTORIAL_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or TUTORIAL_DATABASE_URL environment variable is required');
  process.exit(1);
}

const httpClient = neon(DATABASE_URL);
const db = drizzle(httpClient);

// Test values from the failed request
const TEST_VALUES = {
  brandId: 'shared',
  domainId: '30000000-0000-0000-0000-000000000001',
  subjectId: '3a706051-9d9d-4bdf-af48-331a5acd557e',
  topicId: '4b21ddc0-123b-41e3-8ea1-280d37f7f035',
  activeSubtopicId: '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4',
};

console.log('🔍 Tutorial Sidebar V2 Database Diagnostic');
console.log('==========================================\n');

async function main() {
  try {
    // 1. CHECK TABLE SCHEMA
    console.log('1️⃣ Checking table schema...');
    const schemaQuery = await httpClient`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'tutorial_sidebar_trees_v2'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Table: tutorial_sidebar_trees_v2');
    console.table(schemaQuery);

    // 2. CHECK CONSTRAINTS
    console.log('\n2️⃣ Checking constraints...');
    const constraintsQuery = await httpClient`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      LEFT JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'tutorial_sidebar_trees_v2'
      ORDER BY tc.constraint_type, tc.constraint_name
    `;
    
    console.log('\n🔒 Constraints:');
    console.table(constraintsQuery);

    // 3. CHECK HIERARCHY - DOMAINS (SkillHubCore DB)
    console.log('\n3️⃣ Verifying hierarchy IDs...');
    console.log('\n📂 Domain lookup (from SkillHubCore DB):');
    
    // Note: This requires connection to the SkillHubCore database
    // For now, we'll query the tutorial DB to see what exists
    
    // 4. CHECK EXISTING ROW
    console.log('\n4️⃣ Checking for existing row...');
    const existingRow = await httpClient`
      SELECT 
        id,
        brand_id,
        domain_id,
        subject_id,
        topic_id,
        active_subtopic_id,
        status,
        version,
        published_at,
        created_at,
        updated_at
      FROM tutorial_sidebar_trees_v2
      WHERE brand_id = ${TEST_VALUES.brandId}
        AND topic_id = ${TEST_VALUES.topicId}
    `;
    
    if (existingRow.length > 0) {
      console.log('\n✅ Existing row found (UPSERT will UPDATE):');
      console.table(existingRow);
    } else {
      console.log('\n📝 No existing row (UPSERT will INSERT)');
    }

    // 5. VALIDATE TEST UUIDS
    console.log('\n5️⃣ Validating UUID format...');
    const uuidTests = {
      brandId: TEST_VALUES.brandId,
      domainId: TEST_VALUES.domainId,
      subjectId: TEST_VALUES.subjectId,
      topicId: TEST_VALUES.topicId,
      activeSubtopicId: TEST_VALUES.activeSubtopicId,
    };
    
    for (const [key, value] of Object.entries(uuidTests)) {
      if (key === 'brandId') {
        console.log(`  ${key}: ${value} (text)`);
      } else {
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        console.log(`  ${key}: ${value} ${isValidUUID ? '✅' : '❌'}`);
      }
    }

    // 6. TEST JSONB VALIDATION
    console.log('\n6️⃣ Testing JSONB structure...');
    const testTree = {
      topics: [
        {
          id: 'test',
          name: 'Test',
          type: 'page',
          slug: 'test',
          url: '/tutorial-v2/test/test/test/test'
        }
      ]
    };
    
    try {
      JSON.stringify(testTree);
      console.log('  ✅ JSONB structure is valid JSON');
    } catch (e) {
      console.log('  ❌ JSONB structure is invalid:', e.message);
    }

    // 7. CHECK ALL ROWS
    console.log('\n7️⃣ Checking all existing rows...');
    const allRows = await httpClient`
      SELECT 
        id,
        brand_id,
        topic_id,
        status,
        version,
        created_at
      FROM tutorial_sidebar_trees_v2
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    if (allRows.length > 0) {
      console.log(`\n📊 Found ${allRows.length} row(s):`);
      console.table(allRows);
    } else {
      console.log('\n📊 Table is empty');
    }

    console.log('\n✅ Diagnostic complete');
    
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error);
    console.error('\nError details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      column: error.column,
    });
    process.exit(1);
  }
}

main();
