/**
 * Check database schema - verify if tutorial_sections table exists
 */
import { db } from './db';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  try {
    console.log('Checking database schema...\n');

    // Check if tutorial_sections table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_sections'
      );
    `);
    
    console.log('✓ tutorial_sections table exists:', tableCheck.rows[0]?.exists);

    // Check if tutorial_content table exists (legacy)
    const legacyCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_content'
      );
    `);
    
    console.log('✓ tutorial_content table exists (legacy):', legacyCheck.rows[0]?.exists);

    // If tutorial_sections exists, check its structure
    if (tableCheck.rows[0]?.exists) {
      console.log('\nChecking tutorial_sections columns:');
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_sections'
        ORDER BY ordinal_position;
      `);
      
      console.table(columns.rows);

      // Check section_type enum values
      console.log('\nChecking section_type enum values:');
      const enumValues = await db.execute(sql`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'section_type'
        )
        ORDER BY enumsortorder;
      `);
      
      console.log('Section types:', enumValues.rows.map(r => r.enumlabel));

      // Count existing sections
      console.log('\nChecking existing data:');
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM tutorial_sections WHERE deleted_at IS NULL;
      `);
      console.log('Total sections (not deleted):', countResult.rows[0]?.count);

      // Check sections by type
      const byType = await db.execute(sql`
        SELECT section_type, difficulty, COUNT(*) as count
        FROM tutorial_sections 
        WHERE deleted_at IS NULL
        GROUP BY section_type, difficulty
        ORDER BY section_type, difficulty;
      `);
      
      console.log('\nSections by type and difficulty:');
      console.table(byType.rows);
    }

    console.log('\n✅ Schema check complete');
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
