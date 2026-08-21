/**
 * Emergency Verification: Check Current Database State
 * 
 * Determines if tutorial_sections table still exists after Phase B.1
 */

import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyDatabaseState() {
  console.log('🔍 Emergency Verification: Current Database State');
  console.log('='.repeat(70));
  
  try {
    // Check if tutorial_sections exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_sections'
      ) as exists;
    `);
    
    const tutorialSectionsExists = tableCheck.rows[0]?.exists;
    
    console.log(`\ntutorial_sections table exists: ${tutorialSectionsExists ? '✅ YES' : '❌ NO'}`);
    
    if (tutorialSectionsExists) {
      // Check columns
      const columnsCheck = await db.execute(sql`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'tutorial_sections'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Current tutorial_sections columns:');
      columnsCheck.rows.forEach((row: any) => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.udt_name})`);
      });
      
      // Check for legacy columns
      const hasSectionType = columnsCheck.rows.some((r: any) => r.column_name === 'section_type');
      const hasDifficulty = columnsCheck.rows.some((r: any) => r.column_name === 'difficulty');
      
      console.log(`\n🔍 Legacy columns:`);
      console.log(`  - section_type: ${hasSectionType ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
      console.log(`  - difficulty: ${hasDifficulty ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
      
      // Check row count
      const rowCount = await db.execute(sql`SELECT COUNT(*) as count FROM tutorial_sections;`);
      console.log(`\n📊 Row count: ${rowCount.rows[0]?.count || 0}`);
    } else {
      console.log('\n🚨 CRITICAL: tutorial_sections table DOES NOT EXIST!');
      console.log('   This table is the CORE V2 architecture table and should exist!');
    }
    
    // Check other V2 tables
    console.log('\n📋 Other V2 table status:');
    const v2Tables = [
      'prompt_templates',
      'educational_architectures',
      'ui_architectures',
      'tutorial_sidebar_v2',
      'tutorial_page_content_v2'
    ];
    
    for (const table of v2Tables) {
      const exists = await db.execute(sql.raw(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        ) as exists;
      `));
      
      const status = exists.rows[0]?.exists ? '✅' : '❌';
      console.log(`  ${status} ${table}`);
    }
    
    // Check dropped legacy tables
    console.log('\n📋 Legacy table status (should NOT exist):');
    const legacyTables = [
      'tutorial_subsections',
      'tutorial_content',
      'tutorial_section_notes',
      'subsection_engagement_metrics'
    ];
    
    for (const table of legacyTables) {
      const exists = await db.execute(sql.raw(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        ) as exists;
      `));
      
      const status = exists.rows[0]?.exists ? '❌ STILL EXISTS' : '✅ DROPPED';
      console.log(`  ${status} ${table}`);
    }
    
    // Check enums
    console.log('\n📋 Enum status:');
    const enums = ['section_type', 'subsection_type', 'tutorial_difficulty'];
    
    for (const enumName of enums) {
      const exists = await db.execute(sql.raw(`
        SELECT EXISTS (
          SELECT FROM pg_type 
          WHERE typname = '${enumName}'
        ) as exists;
      `));
      
      const status = exists.rows[0]?.exists ? '✅ EXISTS' : '❌ DROPPED';
      console.log(`  ${status} ${enumName}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verifyDatabaseState();
