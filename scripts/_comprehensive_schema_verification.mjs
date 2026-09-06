#!/usr/bin/env node
/**
 * COMPREHENSIVE DATABASE SCHEMA VERIFICATION
 * 
 * Verify actual PostgreSQL schema matches expected Tutorial V2 / ILS architecture
 * 
 * BEFORE PROVISIONING CONTENT - VERIFY:
 * 1. tutorial_sections table with navigation_node_id
 * 2. tutorial_navigation_progress table
 * 3. block_learning_state table with expected_time_sec
 * 4. All required indexes and constraints
 * 5. Migration state
 */

import { config } from 'dotenv';
import pkg from 'pg';

config({ path: '.env.local', override: true });

const { Client } = pkg;

async function verifySchema() {
  const connString = process.env.DATABASE_URL_TUTORIAL || process.env.DATABASE_DIRECT_URL_TUTORIAL;
  
  if (!connString) {
    console.log('❌ DATABASE_URL_TUTORIAL not configured');
    return false;
  }
  
  console.log('================================================================');
  console.log('COMPREHENSIVE DATABASE SCHEMA VERIFICATION');
  console.log('================================================================\n');
  console.log(`Database: tutorial_prod (from env)\n`);
  
  const client = new Client({ connectionString: connString });
  let allPassed = true;
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL connection established\n');
    
    // ========================================
    // 1. TUTORIAL_SECTIONS TABLE
    // ========================================
    console.log('─'.repeat(80));
    console.log('1. VERIFYING tutorial_sections TABLE');
    console.log('─'.repeat(80));
    
    const tutorialSectionsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tutorial_sections'
      ORDER BY ordinal_position
    `);
    
    if (tutorialSectionsColumns.rows.length === 0) {
      console.log('❌ tutorial_sections table NOT FOUND\n');
      allPassed = false;
    } else {
      console.log(`✅ tutorial_sections table EXISTS (${tutorialSectionsColumns.rows.length} columns)\n`);
      
      // Check critical columns
      const criticalColumns = {
        'id': 'uuid',
        'subtopic_id': 'uuid',
        'navigation_node_id': 'text',
        'brand_id': 'USER-DEFINED',
        'content': 'jsonb',
        'status': 'USER-DEFINED',
        'published_at': 'timestamp without time zone',
        'deleted_at': 'timestamp without time zone'
      };
      
      console.log('Critical Columns:');
      for (const [colName, expectedType] of Object.entries(criticalColumns)) {
        const col = tutorialSectionsColumns.rows.find(r => r.column_name === colName);
        if (col) {
          const typeMatch = col.data_type === expectedType || 
                           (expectedType === 'USER-DEFINED' && col.data_type === 'USER-DEFINED');
          console.log(`  ${typeMatch ? '✅' : '⚠️ '} ${colName}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        } else {
          console.log(`  ❌ ${colName}: MISSING`);
          allPassed = false;
        }
      }
      console.log();
      
      // Check indexes
      const sectionsIndexes = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'tutorial_sections'
        ORDER BY indexname
      `);
      
      console.log(`Indexes (${sectionsIndexes.rows.length}):`);
      sectionsIndexes.rows.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });
      console.log();
      
      // Check unique constraint on (subtopic_id, navigation_node_id, brand_id)
      const uniqueConstraint = sectionsIndexes.rows.find(idx => 
        idx.indexname.includes('identity') || 
        idx.indexdef?.includes('navigation_node_id')
      );
      
      if (uniqueConstraint) {
        console.log(`✅ Unique identity constraint found: ${uniqueConstraint.indexname}`);
      } else {
        console.log(`⚠️  Unique identity constraint not clearly identified`);
      }
      console.log();
    }
    
    // ========================================
    // 2. TUTORIAL_NAVIGATION_PROGRESS TABLE
    // ========================================
    console.log('─'.repeat(80));
    console.log('2. VERIFYING tutorial_navigation_progress TABLE');
    console.log('─'.repeat(80));
    
    const navProgressColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tutorial_navigation_progress'
      ORDER BY ordinal_position
    `);
    
    if (navProgressColumns.rows.length === 0) {
      console.log('❌ tutorial_navigation_progress table NOT FOUND\n');
      allPassed = false;
    } else {
      console.log(`✅ tutorial_navigation_progress table EXISTS (${navProgressColumns.rows.length} columns)\n`);
      
      const navCriticalColumns = {
        'id': 'uuid',
        'user_id': 'uuid',
        'navigation_node_id': 'text',
        'section_id': 'uuid',
        'subtopic_id': 'uuid',
        'status': 'USER-DEFINED',
        'completed_blocks': 'jsonb',
        'time_spent_active_sec': 'integer',
        'visit_count': 'integer',
        'last_session_id': 'text'
      };
      
      console.log('Critical Columns:');
      for (const [colName, expectedType] of Object.entries(navCriticalColumns)) {
        const col = navProgressColumns.rows.find(r => r.column_name === colName);
        if (col) {
          const typeMatch = col.data_type === expectedType || 
                           (expectedType === 'USER-DEFINED' && col.data_type === 'USER-DEFINED');
          console.log(`  ${typeMatch ? '✅' : '⚠️ '} ${colName}: ${col.data_type}`);
        } else {
          console.log(`  ❌ ${colName}: MISSING`);
          allPassed = false;
        }
      }
      console.log();
      
      // Check whatisjava progress rows
      const whatisjavaProgress = await client.query(`
        SELECT 
          id, user_id, visit_count, status, section_id,
          created_at
        FROM tutorial_navigation_progress
        WHERE navigation_node_id = 'whatisjava'
        ORDER BY visit_count DESC
      `);
      
      console.log(`whatisjava Progress Rows: ${whatisjavaProgress.rows.length}`);
      whatisjavaProgress.rows.forEach(row => {
        console.log(`  - user_id: ${row.user_id.substring(0, 8)}..., visit_count: ${row.visit_count}, section_id: ${row.section_id || 'null'}`);
      });
      console.log();
    }
    
    // ========================================
    // 3. BLOCK_LEARNING_STATE TABLE
    // ========================================
    console.log('─'.repeat(80));
    console.log('3. VERIFYING block_learning_state TABLE');
    console.log('─'.repeat(80));
    
    const blockStateColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'block_learning_state'
      ORDER BY ordinal_position
    `);
    
    if (blockStateColumns.rows.length === 0) {
      console.log('❌ block_learning_state table NOT FOUND\n');
      allPassed = false;
    } else {
      console.log(`✅ block_learning_state table EXISTS (${blockStateColumns.rows.length} columns)\n`);
      
      const blockCriticalColumns = {
        'id': 'uuid',
        'user_id': 'uuid',
        'navigation_node_id': 'text',
        'block_id': 'text',
        'block_version': 'text',
        'visit_count': 'integer',
        'revision_count': 'integer',
        'active_time_sec': 'integer',
        'expected_time_sec': 'integer',
        'first_viewed_at': 'timestamp without time zone',
        'last_viewed_at': 'timestamp without time zone',
        'completed_at': 'timestamp without time zone'
      };
      
      console.log('Critical Columns:');
      for (const [colName, expectedType] of Object.entries(blockCriticalColumns)) {
        const col = blockStateColumns.rows.find(r => r.column_name === colName);
        if (col) {
          const typeMatch = col.data_type === expectedType;
          console.log(`  ${typeMatch ? '✅' : '⚠️ '} ${colName}: ${col.data_type}`);
          
          // Special check for expected_time_sec
          if (colName === 'expected_time_sec') {
            console.log(`     ℹ️  This column stores expectedTimeSec from canonical TutorialDocument blocks`);
          }
        } else {
          console.log(`  ❌ ${colName}: MISSING`);
          allPassed = false;
        }
      }
      console.log();
      
      // Check unique constraint on (user_id, navigation_node_id, block_id, block_version)
      const blockIndexes = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'block_learning_state'
        ORDER BY indexname
      `);
      
      console.log(`Indexes (${blockIndexes.rows.length}):`);
      blockIndexes.rows.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });
      console.log();
      
      // Check data
      const blockCount = await client.query(`
        SELECT COUNT(*) as count
        FROM block_learning_state
      `);
      
      console.log(`Current Records: ${blockCount.rows[0].count} (expected 0 before content provisioning)`);
      console.log();
    }
    
    // ========================================
    // 4. TUTORIAL_SUBTOPICS TABLE
    // ========================================
    console.log('─'.repeat(80));
    console.log('4. VERIFYING tutorial_subtopics TABLE');
    console.log('─'.repeat(80));
    
    const subtopicsCheck = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'tutorial_subtopics'
      AND column_name IN ('id', 'external_id', 'name', 'slug')
      ORDER BY ordinal_position
    `);
    
    if (subtopicsCheck.rows.length > 0) {
      console.log(`✅ tutorial_subtopics table EXISTS\n`);
      
      // Check whatisjava subtopic
      const whatisjavaSubtopic = await client.query(`
        SELECT id, external_id, name, slug
        FROM tutorial_subtopics
        WHERE name = 'What is Java?'
          AND deleted_at IS NULL
        LIMIT 1
      `);
      
      if (whatisjavaSubtopic.rows.length > 0) {
        const sub = whatisjavaSubtopic.rows[0];
        console.log(`✅ What is Java? subtopic EXISTS:`);
        console.log(`   Internal ID: ${sub.id}`);
        console.log(`   External ID: ${sub.external_id}`);
        console.log(`   Slug: ${sub.slug}`);
        console.log();
      } else {
        console.log(`⚠️  What is Java? subtopic NOT FOUND\n`);
      }
    } else {
      console.log(`❌ tutorial_subtopics table NOT FOUND\n`);
      allPassed = false;
    }
    
    // ========================================
    // 5. TUTORIAL_PAGE_CONTENT_V2 (LEGACY CHECK)
    // ========================================
    console.log('─'.repeat(80));
    console.log('5. CHECKING tutorial_page_content_v2 (LEGACY)');
    console.log('─'.repeat(80));
    
    const legacyContent = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tutorial_page_content_v2'
      LIMIT 1
    `);
    
    if (legacyContent.rows.length > 0) {
      console.log(`ℹ️  tutorial_page_content_v2 table EXISTS (legacy)`);
      
      const legacyCount = await client.query(`
        SELECT COUNT(*) as count
        FROM tutorial_page_content_v2
      `);
      
      console.log(`   Records: ${legacyCount.rows[0].count}`);
      console.log(`   Status: IGNORED by current Tutorial V2 delivery\n`);
    } else {
      console.log(`ℹ️  tutorial_page_content_v2 table does not exist (expected for new deployments)\n`);
    }
    
    // ========================================
    // 6. MIGRATION STATE
    // ========================================
    console.log('─'.repeat(80));
    console.log('6. VERIFYING MIGRATION STATE');
    console.log('─'.repeat(80));
    
    try {
      const migrationTable = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = '__drizzle_migrations'
        LIMIT 1
      `);
      
      if (migrationTable.rows.length > 0) {
        const migrations = await client.query(`
          SELECT id, hash, created_at
          FROM __drizzle_migrations
          ORDER BY created_at DESC
          LIMIT 5
        `);
        
        console.log(`✅ Migration tracking EXISTS (__drizzle_migrations)`);
        console.log(`   Total migrations: ${migrations.rows.length}`);
        console.log(`   Latest migrations:`);
        migrations.rows.forEach(m => {
          console.log(`     - ${m.id} (${m.created_at.toISOString().split('T')[0]})`);
        });
        console.log();
      } else {
        console.log(`⚠️  __drizzle_migrations table NOT FOUND`);
        console.log(`   Tables exist but migration tracking not configured\n`);
      }
    } catch (migrationError) {
      console.log(`⚠️  __drizzle_migrations table NOT FOUND`);
      console.log(`   Tables exist but migration tracking not configured\n`);
    }
    
    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('================================================================');
    console.log('VERIFICATION SUMMARY');
    console.log('================================================================\n');
    
    if (allPassed) {
      console.log('✅ ALL CRITICAL TABLES AND COLUMNS VERIFIED');
      console.log('✅ Database schema matches expected Tutorial V2 / ILS architecture');
      console.log('✅ READY FOR CONTENT PROVISIONING\n');
    } else {
      console.log('❌ SCHEMA VERIFICATION FAILED');
      console.log('❌ Missing tables or columns detected');
      console.log('⚠️  DO NOT PROVISION CONTENT until schema is corrected\n');
    }
    
    return allPassed;
    
  } catch (error) {
    console.log(`\n❌ Database error: ${error.message}\n`);
    console.log(error.stack);
    return false;
  } finally {
    await client.end();
  }
}

const result = await verifySchema();
process.exit(result ? 0 : 1);
