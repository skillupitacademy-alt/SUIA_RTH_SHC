#!/usr/bin/env tsx
/**
 * Check Tutorial DB for Brand Restrictions
 * Checks if tutorial_sections table has brand-based access control
 */

import dotenv from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkTutorialDBBrandRestrictions() {
  console.log('\n🔍 Checking Tutorial DB Brand Restrictions\n');
  console.log('='.repeat(60));

  const tutorialDbUrl = process.env.DATABASE_URL_TUTORIAL!;

  try {
    const sql = neon(tutorialDbUrl);

    // Check tutorial_sections table structure
    console.log('📋 Checking tutorial_sections table structure...\n');
    
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tutorial_sections'
      AND column_name LIKE '%brand%'
      ORDER BY ordinal_position
    `;

    if (columns.length === 0) {
      console.log('✅ NO brand-related columns found');
      console.log('   → Tutorial DB is brand-agnostic');
      console.log('   → Both RTH and SkillUp admins should have access\n');
    } else {
      console.log(`⚠️  Found ${columns.length} brand-related column(s):\n`);
      columns.forEach(col => {
        console.log(`   Column: ${col.column_name}`);
        console.log(`   Type: ${col.data_type}`);
        console.log(`   Nullable: ${col.is_nullable}`);
        console.log(`   Default: ${col.column_default || 'none'}`);
        console.log('');
      });
    }

    // Check if there are any sections
    const sectionCount = await sql`
      SELECT COUNT(*) as count FROM tutorial_sections
    `;
    
    console.log(`📊 Total sections in tutorial_db: ${sectionCount[0].count}`);

    // Check brand distribution if brand_id exists
    if (columns.length > 0) {
      console.log('\n📊 Brand distribution:');
      const brandDist = await sql`
        SELECT brand_id, COUNT(*) as count
        FROM tutorial_sections
        GROUP BY brand_id
      `;
      
      brandDist.forEach(row => {
        console.log(`   ${row.brand_id}: ${row.count} sections`);
      });
    }

    // Check layman_audit_logs table
    console.log('\n📋 Checking layman_audit_logs table...\n');
    
    const auditColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'layman_audit_logs'
      AND column_name LIKE '%brand%'
    `;

    if (auditColumns.length > 0) {
      console.log(`⚠️  Audit logs have brand tracking:`);
      auditColumns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('✅ Audit logs are brand-agnostic');
    }

  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Check complete\n');
}

checkTutorialDBBrandRestrictions();
