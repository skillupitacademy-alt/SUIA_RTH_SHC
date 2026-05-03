/**
 * validate-governance.ts
 * Phase 0.75 Governance Validation
 * ---------------------------------
 * Comprehensive validation of constitutional framework governance
 */

import dotenv from 'dotenv';
import path from 'path';
import { db } from './db';
import {
  tutorialSections,
  promptTemplates,
  educationalArchitectures,
  uiArchitectures,
} from './schema';
import { eq, isNull, sql } from 'drizzle-orm';

// Load environment variables
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
];

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath });
}

async function validateGovernance() {
  console.log('🔒 Phase 0.75 Governance Validation\n');
  console.log('=' .repeat(60));
  console.log('');

  let allPassed = true;

  try {
    // Check 1: Constitutional Framework Seeded
    console.log('✓ Check 1: Constitutional Framework Seeded');
    
    const ptCount = await db.select().from(promptTemplates);
    const eaCount = await db.select().from(educationalArchitectures);
    const uaCount = await db.select().from(uiArchitectures);

    console.log(`   - Prompt Templates: ${ptCount.length} (expected: ≥3)`);
    console.log(`   - Educational Architectures: ${eaCount.length} (expected: ≥5)`);
    console.log(`   - UI Architectures: ${uaCount.length} (expected: ≥4)`);

    if (ptCount.length < 3 || eaCount.length < 5 || uaCount.length < 4) {
      console.log('   ❌ FAILED: Insufficient constitutional framework data');
      allPassed = false;
    } else {
      console.log('   ✅ PASSED\n');
    }

    // Check 2: Brand Partitioning
    console.log('✓ Check 2: Brand Partitioning Integrity');
    
    const sectionsWithoutBrand = await db
      .select()
      .from(tutorialSections)
      .where(isNull(tutorialSections.brandId));

    console.log(`   - Sections without brand_id: ${sectionsWithoutBrand.length} (expected: 0)`);

    if (sectionsWithoutBrand.length > 0) {
      console.log('   ❌ FAILED: Brand partition violation detected');
      allPassed = false;
    } else {
      console.log('   ✅ PASSED\n');
    }

    // Check 3: FK Integrity for Layman Sections
    console.log('✓ Check 3: FK Integrity for Layman Sections');
    
    const orphanSections = await db.execute(sql`
      SELECT ts.id, ts.section_type, ts.brand_id, ts.status
      FROM tutorial_sections ts
      LEFT JOIN educational_architectures ea ON ts.educational_architecture_id = ea.id
      LEFT JOIN ui_architectures ua ON ts.ui_architecture_id = ua.id
      WHERE ts.section_type = 'layman'
        AND (ts.educational_architecture_id IS NULL OR
             ts.ui_architecture_id IS NULL)
    `);

    console.log(`   - Orphan layman sections: ${orphanSections.rows.length} (expected: 0)`);

    if (orphanSections.rows.length > 0) {
      console.log('   ❌ FAILED: FK integrity violation detected');
      console.log('   Run: pnpm db:migrate-orphans');
      allPassed = false;
    } else {
      console.log('   ✅ PASSED\n');
    }

    // Check 4: Active Templates
    console.log('✓ Check 4: Active Template Availability');
    
    const activePromptTemplates = ptCount.filter(t => t.isActive);
    const activeEducationalArchs = eaCount.filter(a => a.isActive);
    const activeUIArchs = uaCount.filter(u => u.isActive);

    console.log(`   - Active Prompt Templates: ${activePromptTemplates.length}`);
    console.log(`   - Active Educational Architectures: ${activeEducationalArchs.length}`);
    console.log(`   - Active UI Architectures: ${activeUIArchs.length}`);

    if (activePromptTemplates.length === 0 || activeEducationalArchs.length === 0 || activeUIArchs.length === 0) {
      console.log('   ❌ FAILED: No active templates available');
      allPassed = false;
    } else {
      console.log('   ✅ PASSED\n');
    }

    // Check 5: Layman Section Coverage
    console.log('✓ Check 5: Layman Section Coverage');
    
    const laymanSections = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.sectionType, 'layman'));

    console.log(`   - Total layman sections: ${laymanSections.length}`);
    console.log(`   - Sections with architectures: ${laymanSections.filter(s => s.educationalArchitectureId && s.uiArchitectureId).length}`);

    if (laymanSections.length > 0 && laymanSections.every(s => s.educationalArchitectureId && s.uiArchitectureId)) {
      console.log('   ✅ PASSED\n');
    } else if (laymanSections.length === 0) {
      console.log('   ⚠️  WARNING: No layman sections exist yet\n');
    } else {
      console.log('   ❌ FAILED: Some sections missing architecture links');
      allPassed = false;
    }

    // Final Summary
    console.log('=' .repeat(60));
    console.log('');
    
    if (allPassed) {
      console.log('🎉 GOVERNANCE VALIDATION: ALL CHECKS PASSED');
      console.log('');
      console.log('✅ Phase 0.75 Foundation Hardening Complete');
      console.log('✅ Constitutional Framework Operational');
      console.log('✅ Database Governance Compliant');
      console.log('');
      console.log('➡️  Ready for Phase 2B: Backend Service Development');
      console.log('   Next: Build LaymanService.ts');
      process.exit(0);
    } else {
      console.log('❌ GOVERNANCE VALIDATION: SOME CHECKS FAILED');
      console.log('');
      console.log('Please address the failures above before proceeding.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Validation error:', error);
    process.exit(1);
  }
}

validateGovernance();
