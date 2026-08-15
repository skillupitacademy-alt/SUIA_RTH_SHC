/**
 * Execute Layman Table Removal Migration
 * Backs up and drops tutorial_section_layman table
 */

import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('🚀 Starting Layman Table Removal Migration...\n');

  try {
    // Step 1: Create backup table
    console.log('📦 Step 1: Creating backup table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tutorial_section_layman_backup_20260815 AS
      SELECT * FROM tutorial_section_layman;
    `);
    console.log('✅ Backup table created: tutorial_section_layman_backup_20260815\n');

    // Step 2: Backup related tutorial_sections records
    console.log('📦 Step 2: Creating backup of tutorial_sections (layman type)...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tutorial_sections_layman_backup_20260815 AS
      SELECT * FROM tutorial_sections
      WHERE section_type = 'layman';
    `);
    console.log('✅ Backup table created: tutorial_sections_layman_backup_20260815\n');

    // Step 3: Get record counts
    console.log('📊 Step 3: Verifying backup record counts...');
    const laymanCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM tutorial_section_layman_backup_20260815;
    `);
    const sectionsCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM tutorial_sections_layman_backup_20260815;
    `);

    console.log(`   - tutorial_section_layman records backed up: ${laymanCount.rows[0]?.count || 0}`);
    console.log(`   - tutorial_sections (layman type) records backed up: ${sectionsCount.rows[0]?.count || 0}\n`);

    // Step 4: Drop the layman table
    console.log('🗑️  Step 4: Dropping tutorial_section_layman table...');
    await db.execute(sql`
      DROP TABLE IF EXISTS tutorial_section_layman CASCADE;
    `);
    console.log('✅ Table dropped: tutorial_section_layman\n');

    // Step 5: Verify table is dropped
    console.log('✅ Step 5: Verifying table removal...');
    try {
      await db.execute(sql`SELECT 1 FROM tutorial_section_layman LIMIT 1;`);
      console.error('❌ ERROR: Table still exists!');
      process.exit(1);
    } catch (error: any) {
      const errorMsg = error.message || error.cause?.message || '';
      if (errorMsg.includes('does not exist') || (errorMsg.includes('relation') && errorMsg.includes('does not exist'))) {
        console.log('✅ Confirmed: tutorial_section_layman table successfully removed\n');
      } else {
        throw error;
      }
    }

    // Final summary
    console.log('═'.repeat(60));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`   - Backup table created: tutorial_section_layman_backup_20260815`);
    console.log(`   - Records backed up: ${laymanCount.rows[0]?.count || 0}`);
    console.log(`   - Original table dropped: tutorial_section_layman`);
    console.log(`   - Related sections backed up: ${sectionsCount.rows[0]?.count || 0}`);
    console.log('\n📝 Next Steps:');
    console.log('   1. Test the application');
    console.log('   2. Verify removed routes return 404');
    console.log('   3. Check content-manager still works');
    console.log('   4. Merge branch to main if all good\n');
    console.log('🔄 Restoration:');
    console.log('   - See BACKUP-README.md for restoration instructions\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n🔄 The database should still be intact.');
    console.error('   Check if backup tables were created:');
    console.error('   SELECT * FROM tutorial_section_layman_backup_20260815 LIMIT 1;\n');
    process.exit(1);
  }
}

main();
