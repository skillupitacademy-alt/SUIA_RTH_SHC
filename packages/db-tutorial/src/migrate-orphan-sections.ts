/**
 * migrate-orphan-sections.ts
 * Phase 0.75 Governance Remediation
 * ---------------------------------
 * Links orphan layman sections to default architectures
 * 
 * Problem:
 * - 2 existing layman sections have NULL educational_architecture_id and ui_architecture_id
 * - This violates FK integrity and governance rules
 * 
 * Solution:
 * - Assign default "Beginner-Friendly" educational architecture
 * - Assign default "Standard Interactive" UI architecture
 * - Validate all sections are properly linked
 */

import dotenv from 'dotenv';
import path from 'path';
import { db } from './db';
import {
  tutorialSections,
  educationalArchitectures,
  uiArchitectures,
} from './schema';
import { eq, isNull, and, sql } from 'drizzle-orm';

// Load environment variables
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
];

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath });
}

// --------------------------------------------------
// Migration Logic
// --------------------------------------------------

async function migrateOrphanSections() {
  console.log('🔧 Starting orphan section migration...\n');

  try {
    // Step 1: Find default architectures
    console.log('📋 Step 1: Finding default architectures...');
    
    const defaultEducationalArch = await db
      .select()
      .from(educationalArchitectures)
      .where(eq(educationalArchitectures.name, 'Beginner-Friendly'))
      .limit(1);

    const defaultUIArch = await db
      .select()
      .from(uiArchitectures)
      .where(eq(uiArchitectures.name, 'Standard Interactive'))
      .limit(1);

    if (defaultEducationalArch.length === 0) {
      throw new Error('Default educational architecture "Beginner-Friendly" not found. Run seed-layman-config.ts first.');
    }

    if (defaultUIArch.length === 0) {
      throw new Error('Default UI architecture "Standard Interactive" not found. Run seed-layman-config.ts first.');
    }

    const eduArchId = defaultEducationalArch[0].id;
    const uiArchId = defaultUIArch[0].id;

    console.log(`   ✅ Educational Architecture: ${defaultEducationalArch[0].name} (${eduArchId})`);
    console.log(`   ✅ UI Architecture: ${defaultUIArch[0].name} (${uiArchId})\n`);

    // Step 2: Find orphan sections
    console.log('📋 Step 2: Finding orphan layman sections...');
    
    const orphanSections = await db
      .select()
      .from(tutorialSections)
      .where(
        and(
          eq(tutorialSections.sectionType, 'layman'),
          isNull(tutorialSections.educationalArchitectureId)
        )
      );

    console.log(`   Found ${orphanSections.length} orphan sections\n`);

    if (orphanSections.length === 0) {
      console.log('✅ No orphan sections found. Migration not needed.');
      return;
    }

    // Step 3: Display orphan sections
    console.log('📋 Step 3: Orphan sections to migrate:');
    orphanSections.forEach((section, index) => {
      console.log(`   ${index + 1}. Section ID: ${section.id}`);
      console.log(`      - Type: ${section.sectionType}`);
      console.log(`      - Brand: ${section.brandId}`);
      console.log(`      - Status: ${section.status}`);
    });
    console.log('');

    // Step 4: Update orphan sections
    console.log('📋 Step 4: Updating orphan sections...');
    
    const updateResult = await db
      .update(tutorialSections)
      .set({
        educationalArchitectureId: eduArchId,
        uiArchitectureId: uiArchId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tutorialSections.sectionType, 'layman'),
          isNull(tutorialSections.educationalArchitectureId)
        )
      );

    console.log(`   ✅ Updated ${orphanSections.length} sections\n`);

    // Step 5: Validate FK integrity
    console.log('📋 Step 5: Validating FK integrity...');
    
    const remainingOrphans = await db.execute(sql`
      SELECT ts.id
      FROM tutorial_sections ts
      LEFT JOIN educational_architectures ea ON ts.educational_architecture_id = ea.id
      LEFT JOIN ui_architectures ua ON ts.ui_architecture_id = ua.id
      WHERE ts.section_type = 'layman'
        AND (ts.educational_architecture_id IS NULL OR
             ts.ui_architecture_id IS NULL)
    `);

    if (remainingOrphans.rows.length > 0) {
      throw new Error(`FK integrity validation failed: ${remainingOrphans.rows.length} orphan sections still exist`);
    }

    console.log('   ✅ FK integrity validation passed\n');

    // Step 6: Summary
    console.log('🎯 Migration Summary:');
    console.log(`   - Orphan sections found: ${orphanSections.length}`);
    console.log(`   - Sections migrated: ${orphanSections.length}`);
    console.log(`   - Default educational architecture: Beginner-Friendly`);
    console.log(`   - Default UI architecture: Standard Interactive`);
    console.log('');
    console.log('✅ Orphan section migration completed successfully!');
    console.log('✅ Governance hardening is now complete.');
    console.log('');
    console.log('➡️  Next step: Build LaymanService + API layer');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// --------------------------------------------------
// Rollback Function (if needed)
// --------------------------------------------------

async function rollbackMigration() {
  console.log('🔄 Rolling back orphan section migration...\n');

  try {
    const result = await db
      .update(tutorialSections)
      .set({
        educationalArchitectureId: null,
        uiArchitectureId: null,
        updatedAt: new Date(),
      })
      .where(eq(tutorialSections.sectionType, 'layman'));

    console.log('✅ Rollback completed. All layman sections unlinked from architectures.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

// --------------------------------------------------
// CLI Entry
// --------------------------------------------------

const command = process.argv[2];

if (command === 'rollback') {
  rollbackMigration();
} else {
  migrateOrphanSections();
}
