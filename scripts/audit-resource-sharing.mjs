#!/usr/bin/env node
/**
 * READ-ONLY Resource Sharing Architecture Audit
 * 
 * Purpose: Verify whether tutorial_sections resources are primarily:
 * - Shared (brand_id: 'shared')
 * - Brand-specific (brand_id: 'realtutorialhub' | 'skillup')
 * 
 * This helps determine if brand validation is a legitimate product boundary
 * or accidental coupling.
 * 
 * CRITICAL: This project has FOUR databases:
 * - tutorial_prod (tutorial content - SHARED across brands)
 * - quiz_platform_prod (central platform data)
 * - rth_prod (RTH brand-specific)
 * - skillup_prod (SkillUp brand-specific)
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const tutorialDb = process.env.DATABASE_URL_TUTORIAL;

if (!tutorialDb) {
  console.error('ERROR: DATABASE_URL_TUTORIAL not set');
  console.error('This is the database containing tutorial_sections');
  process.exit(1);
}

const tutorialPool = new Pool({ connectionString: tutorialDb });

async function auditResourceSharing() {
  console.log('='.repeat(80));
  console.log('RESOURCE SHARING ARCHITECTURE AUDIT');
  console.log('='.repeat(80));
  console.log();
  console.log('🔍 DATABASE: tutorial_prod (TUTORIAL CONTENT DATABASE)');
  console.log('   This is the canonical storage for tutorial_sections');
  console.log('='.repeat(80));
  console.log();

  // 1. Brand distribution in tutorial_sections
  console.log('📊 1. TUTORIAL SECTIONS BRAND DISTRIBUTION');
  console.log('-'.repeat(80));
  
  const brandDistribution = await tutorialPool.query(`
    SELECT 
      brand_id,
      COUNT(*) as section_count,
      ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage
    FROM tutorial_sections
    WHERE deleted_at IS NULL
    GROUP BY brand_id
    ORDER BY section_count DESC
  `);
  
  console.table(brandDistribution.rows);
  console.log();

  // 2. Sample of actual sections
  console.log('📋 2. SAMPLE TUTORIAL SECTIONS (Latest 10)');
  console.log('-'.repeat(80));
  
  const sampleSections = await tutorialPool.query(`
    SELECT 
      id,
      navigation_node_id,
      subtopic_id,
      brand_id,
      brand_visibility,
      status,
      created_at
    FROM tutorial_sections
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 10
  `);
  
  console.table(sampleSections.rows);
  console.log();

  // 3. Check the "What is Java" section detail
  console.log('🔍 3. WHAT IS JAVA SECTION DETAIL (whatisjava)');
  console.log('-'.repeat(80));
  
  const javaSection = await tutorialPool.query(`
    SELECT 
      id,
      navigation_node_id,
      subtopic_id,
      brand_id,
      brand_visibility,
      status,
      created_at,
      content
    FROM tutorial_sections
    WHERE navigation_node_id = 'whatisjava'
    AND deleted_at IS NULL
    LIMIT 1
  `);
  
  if (javaSection.rows.length > 0) {
    const section = javaSection.rows[0];
    console.log(`✅ "whatisjava" section found:`);
    console.log(`   ID: ${section.id}`);
    console.log(`   Navigation Node: ${section.navigation_node_id}`);
    console.log(`   Subtopic: ${section.subtopic_id}`);
    console.log(`   Brand: ${section.brand_id}`);
    console.log(`   Brand Visibility: ${section.brand_visibility}`);
    console.log(`   Status: ${section.status}`);
    console.log(`   Created: ${section.created_at}`);
    
    if (section.content?.blocks) {
      console.log(`   Blocks: ${section.content.blocks.length}`);
      section.content.blocks.forEach((block, idx) => {
        console.log(`     [${idx}] ${block.id} - expectedTimeSec: ${block.expectedTimeSec ?? 'NULL'}`);
      });
    }
  } else {
    console.log('❌ No sections found');
  }
  console.log();

  // 4. Check brand_visibility distribution
  console.log('👁️  4. BRAND VISIBILITY DISTRIBUTION');
  console.log('-'.repeat(80));
  
  const visibilityDist = await tutorialPool.query(`
    SELECT 
      brand_visibility,
      COUNT(*) as section_count
    FROM tutorial_sections
    WHERE deleted_at IS NULL
    GROUP BY brand_visibility
    ORDER BY section_count DESC
  `);
  
  console.table(visibilityDist.rows);
  console.log();

  // 5. Total statistics
  console.log('📈 5. OVERALL STATISTICS');
  console.log('-'.repeat(80));
  
  const totalStats = await tutorialPool.query(`
    SELECT 
      COUNT(*) as total_sections,
      COUNT(DISTINCT navigation_node_id) as unique_navigation_nodes,
      COUNT(DISTINCT subtopic_id) as unique_subtopics
    FROM tutorial_sections
    WHERE deleted_at IS NULL
  `);
  
  console.table(totalStats.rows);
  console.log();

  // 5. Summary and interpretation
  console.log('='.repeat(80));
  console.log('📈 INTERPRETATION');
  console.log('='.repeat(80));
  
  const sharedRow = brandDistribution.rows.find(row => row.brand_id === 'shared');
  const rthRow = brandDistribution.rows.find(row => row.brand_id === 'realtutorialhub');
  const skillupRow = brandDistribution.rows.find(row => row.brand_id === 'skillup');
  
  const sharedPct = sharedRow ? parseFloat(sharedRow.percentage) : 0;
  const rthPct = rthRow ? parseFloat(rthRow.percentage) : 0;
  const skillupPct = skillupRow ? parseFloat(skillupRow.percentage) : 0;
  const specificPct = rthPct + skillupPct;
  
  console.log();
  console.log(`Shared resources: ${sharedPct.toFixed(2)}%`);
  console.log(`RTH-specific: ${rthPct.toFixed(2)}%`);
  console.log(`SkillUp-specific: ${skillupPct.toFixed(2)}%`);
  console.log();
  
  if (sharedPct > 80) {
    console.log('✅ FINDING: Resources are PREDOMINANTLY SHARED');
    console.log('   - Shared resources represent majority of content');
    console.log('   - Architecture supports multi-brand shared content model');
    console.log('   - Brand appears to be presentation context, not resource ownership');
    console.log();
    console.log('⚠️  IMPLICATION FOR AUTHENTICATION:');
    console.log('   - Brand validation in requireStudentAuth() may be incorrect');
    console.log('   - If resources are shared, authentication should be brand-agnostic');
    console.log('   - Current SkillUp brand check could block valid students from shared content');
    console.log();
    console.log('🔍 NEXT STEP:');
    console.log('   - Check if JWT token has correct brand/platforms claims');
    console.log('   - Verify if user logged into RTH can have platforms: ["realtutorialhub", "skillup"]');
    console.log('   - Or if brand validation should check resource.brand_id === "shared"');
  } else if (specificPct > 80) {
    console.log('⚠️  FINDING: Resources are PREDOMINANTLY BRAND-SPECIFIC');
    console.log('   - Each brand has its own resource set');
    console.log('   - Architecture supports brand-separated content model');
    console.log('   - Brand appears to be resource ownership boundary');
    console.log();
    console.log('✅ IMPLICATION FOR AUTHENTICATION:');
    console.log('   - Brand validation in requireStudentAuth() is likely CORRECT');
    console.log('   - Brand determines resource access scope');
    console.log('   - Keep brand validation as security boundary');
  } else {
    console.log('📊 FINDING: MIXED MODEL');
    console.log('   - Both shared and brand-specific resources exist');
    console.log('   - Architecture supports hybrid content model');
    console.log('   - Brand may determine context AND resource scope');
    console.log();
    console.log('🤔 IMPLICATION FOR AUTHENTICATION:');
    console.log('   - Need to determine if brand validation should be:');
    console.log('     A) Resource-level (check brand_id match per resource)');
    console.log('     B) Context-level (allow any brand to access "shared" resources)');
    console.log('     C) Hybrid (validate only for brand-specific resources)');
    console.log();
    console.log('🔍 NEXT STEP:');
    console.log('   - Check service layer logic in getTutorialByPageIdentity()');
    console.log('   - Verify if it filters by brand or allows "shared"');
  }
  console.log();
  console.log('='.repeat(80));
}

auditResourceSharing()
  .then(() => {
    console.log('✅ Audit complete');
    tutorialPool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error);
    tutorialPool.end();
    process.exit(1);
  });
