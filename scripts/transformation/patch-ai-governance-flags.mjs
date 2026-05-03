#!/usr/bin/env node
/**
 * DELIVERABLE 2 - PHASE 2A: PATCH AI GOVERNANCE FLAGS
 * Update existing sections to reflect AI-restructured content
 */

import { neon } from '@neondatabase/serverless';

const TUTORIAL_DB_URL = process.env.DATABASE_URL_TUTORIAL;

if (!TUTORIAL_DB_URL) {
  console.error('❌ DATABASE_URL_TUTORIAL not found');
  process.exit(1);
}

const sql = neon(TUTORIAL_DB_URL);

console.log('🔧 PATCHING AI GOVERNANCE FLAGS');
console.log('==========================================\n');

try {
  // Get current state
  const beforeStats = await sql`
    SELECT 
      COUNT(*) as total_sections,
      COUNT(CASE WHEN generated_by_ai = true THEN 1 END) as ai_generated,
      COUNT(CASE WHEN generated_by_ai = false THEN 1 END) as manual
    FROM tutorial_sections;
  `;
  
  console.log('📊 Current State:');
  console.log(`   Total Sections: ${beforeStats[0].total_sections}`);
  console.log(`   AI Generated: ${beforeStats[0].ai_generated}`);
  console.log(`   Manual: ${beforeStats[0].manual}\n`);
  
  // Update all sections to generated_by_ai = true
  // Reason: Legacy transformed content is now AI-restructured content
  const updateResult = await sql`
    UPDATE tutorial_sections
    SET 
      generated_by_ai = true,
      updated_at = NOW()
    WHERE generated_by_ai = false;
  `;
  
  console.log(`✅ Updated ${updateResult.count || 0} sections\n`);
  
  // Get updated state
  const afterStats = await sql`
    SELECT 
      COUNT(*) as total_sections,
      COUNT(CASE WHEN generated_by_ai = true THEN 1 END) as ai_generated,
      COUNT(CASE WHEN generated_by_ai = false THEN 1 END) as manual
    FROM tutorial_sections;
  `;
  
  console.log('📊 Updated State:');
  console.log(`   Total Sections: ${afterStats[0].total_sections}`);
  console.log(`   AI Generated: ${afterStats[0].ai_generated}`);
  console.log(`   Manual: ${afterStats[0].manual}\n`);
  
  console.log('✅ AI Governance Flags Patched Successfully');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Patch failed:', error.message);
  process.exit(1);
}
