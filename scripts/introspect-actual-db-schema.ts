import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_DIRECT_URL_TUTORIAL || '');

async function introspectDatabase() {
  console.log('🔍 Introspecting Actual Database Schema...\n');
  
  try {
    // Get all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log(`📊 Total Tables: ${tables.length}\n`);
    
    // Check for user interaction tables
    console.log('🔍 Checking for User Interaction Tables:\n');
    const interactionTables = ['quiz_answers', 'practice_test_answers', 'code_interactions', 'visual_interactions', 'section_completions'];
    
    for (const tableName of interactionTables) {
      const exists = tables.some((t: any) => t.table_name === tableName);
      if (exists) {
        console.log(`   ✅ ${tableName} - EXISTS`);
        
        // Get columns for this table
        const columns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
          ORDER BY ordinal_position;
        `;
        
        console.log(`      Columns (${columns.length}):`);
        columns.forEach((col: any) => {
          console.log(`         - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
        });
        console.log('');
      } else {
        console.log(`   ❌ ${tableName} - DOES NOT EXIST\n`);
      }
    }
    
    // Check tutorial_sections table structure
    console.log('\n🔍 Checking tutorial_sections table structure:\n');
    const sectionColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'tutorial_sections'
      ORDER BY ordinal_position;
    `;
    
    console.log(`   Columns (${sectionColumns.length}):`);
    sectionColumns.forEach((col: any) => {
      console.log(`      - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    // Check tutorial_subtopics table structure
    console.log('\n\n🔍 Checking tutorial_subtopics table structure:\n');
    const subtopicColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'tutorial_subtopics'
      ORDER BY ordinal_position;
    `;
    
    console.log(`   Columns (${subtopicColumns.length}):`);
    subtopicColumns.forEach((col: any) => {
      console.log(`      - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    // Check all enums
    console.log('\n\n🔍 Checking ENUM types in database:\n');
    const enums = await sql`
      SELECT t.typname as enum_name, 
             array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `;
    
    console.log(`   Total ENUMs: ${enums.length}\n`);
    enums.forEach((e: any) => {
      console.log(`   ${e.enum_name}:`);
      console.log(`      Values: ${e.enum_values.join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error introspecting database:', error);
    throw error;
  }
}

// Run introspection
introspectDatabase();
