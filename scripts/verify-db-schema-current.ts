import { db } from '../packages/db-tutorial/src/db';

async function verifyCurrentSchema() {
  console.log('=== CURRENT DATABASE SCHEMA VERIFICATION ===\n');
  
  // Check tutorial_sections columns
  const columnsResult = await db.execute(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'tutorial_sections'
    AND column_name IN ('section_type', 'difficulty', 'subtopic_id', 'brand_id')
    ORDER BY column_name
  `);
  
  console.log('tutorial_sections columns:');
  console.log(JSON.stringify(columnsResult.rows, null, 2));
  
  // Check unique constraints
  const constraintsResult = await db.execute(`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'tutorial_sections'
    AND constraint_type = 'UNIQUE'
    ORDER BY constraint_name
  `);
  
  console.log('\ntutorial_sections unique constraints:');
  console.log(JSON.stringify(constraintsResult.rows, null, 2));
  
  // Check if legacy tables exist
  const tablesResult = await db.execute(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('tutorial_subsections', 'tutorial_content', 'tutorial_video_links')
    ORDER BY table_name
  `);
  
  console.log('\nLegacy tables (should be empty if V2):');
  console.log(JSON.stringify(tablesResult.rows, null, 2));
  
  process.exit(0);
}

verifyCurrentSchema().catch(console.error);
