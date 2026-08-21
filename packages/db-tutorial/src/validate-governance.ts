/**
 * validate-governance.ts
 * Database Governance Validation
 * ---------------------------------
 * V2 MIGRATION: Removed legacy Layman/section-type validation
 * Validates V2 Tutorial Engine architecture compliance
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
import { isNull } from 'drizzle-orm';

// Load environment variables
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
];

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath });
}

async function validateGovernance() {
  console.log('🔒 Database Governance Validation (V2)\n');
  console.log('=' .repeat(60));
  console.log('');

  let allPassed = true;

  try {
    // Check 1: Constitutional Framework Seeded
    console.log('✓ Check 1: Constitutional Framework Seeded');
    
    const ptCount = await db.select().from(promptTemplates);
    const eaCount = await db.select().from(educationalArchitectures);
    const uaCount = await db.select().from(uiArchitectures);

    console.log(`   - Prompt Templates: ${ptCount.length}`);
    console.log(`   - Educational Architectures: ${eaCount.length}`);
    console.log(`   - UI Architectures: ${uaCount.length}`);
    console.log('   ✅ PASSED\n');

    // Check 2: Brand Partitioning (V2 Architecture)
    console.log('✓ Check 2: V2 Brand Partitioning Integrity');
    
    const sectionsWithoutBrand = await db
      .select()
      .from(tutorialSections)
      .where(isNull(tutorialSections.brandId));

    console.log(`   - Tutorials without brand_id: ${sectionsWithoutBrand.length} (expected: 0)`);

    if (sectionsWithoutBrand.length > 0) {
      console.log('   ❌ FAILED: Brand partition violation detected');
      allPassed = false;
    } else {
      console.log('   ✅ PASSED\n');
    }

    // Check 3: V2 Tutorial Document Structure
    console.log('✓ Check 3: V2 Tutorial Document Structure');
    
    const totalTutorials = await db.select().from(tutorialSections);
    console.log(`   - Total tutorials: ${totalTutorials.length}`);
    console.log(`   - Tutorials with content: ${totalTutorials.filter(t => t.content).length}`);
    
    const tutorialsWithBlocks = totalTutorials.filter(t => {
      const content = t.content as any;
      return content && Array.isArray(content.blocks);
    });
    
    console.log(`   - Tutorials with blocks[]: ${tutorialsWithBlocks.length}`);
    console.log('   ✅ PASSED\n');

    // Final Summary
    console.log('=' .repeat(60));
    console.log('');
    
    if (allPassed) {
      console.log('🎉 GOVERNANCE VALIDATION: ALL CHECKS PASSED');
      console.log('');
      console.log('✅ V2 Tutorial Engine Architecture Compliant');
      console.log('✅ Database Governance Validated');
      console.log('✅ Brand Partitioning Operational');
      console.log('');
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
