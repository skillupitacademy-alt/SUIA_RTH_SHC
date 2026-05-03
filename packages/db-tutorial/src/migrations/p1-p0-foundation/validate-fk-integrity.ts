/**
 * Phase 1 P0 Foundation - FK Integrity Validator
 * Validates all foreign key relationships in modular schema
 */

import { db } from '../../db';
import { sql } from 'drizzle-orm';

interface FKValidationResult {
  table: string;
  column: string;
  referencedTable: string;
  orphanCount: number;
  isValid: boolean;
}

export async function validateFKIntegrity(): Promise<{
  success: boolean;
  results: FKValidationResult[];
  totalOrphans: number;
}> {
  console.log('🔍 Validating Foreign Key Integrity...\n');

  const validations: FKValidationResult[] = [];
  let totalOrphans = 0;

  // Validate tutorial_sections -> tutorial_subtopics
  const sectionsOrphans = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM tutorial_sections ts
    LEFT JOIN tutorial_subtopics tst ON ts.subtopic_id = tst.id
    WHERE tst.id IS NULL
  `);
  const sectionsOrphanCount = parseInt(String(sectionsOrphans.rows[0]?.count || '0'));
  validations.push({
    table: 'tutorial_sections',
    column: 'subtopic_id',
    referencedTable: 'tutorial_subtopics',
    orphanCount: sectionsOrphanCount,
    isValid: sectionsOrphanCount === 0,
  });
  totalOrphans += sectionsOrphanCount;

  // Validate tutorial_subsections -> tutorial_sections
  const subsectionsOrphans = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM tutorial_subsections tss
    LEFT JOIN tutorial_sections ts ON tss.section_id = ts.id
    WHERE ts.id IS NULL
  `);
  const subsectionsOrphanCount = parseInt(String(subsectionsOrphans.rows[0]?.count || '0'));
  validations.push({
    table: 'tutorial_subsections',
    column: 'section_id',
    referencedTable: 'tutorial_sections',
    orphanCount: subsectionsOrphanCount,
    isValid: subsectionsOrphanCount === 0,
  });
  totalOrphans += subsectionsOrphanCount;

  // Validate ai_section_generation_jobs -> ai_generation_orchestration
  const jobsOrphans = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM ai_section_generation_jobs asgj
    LEFT JOIN ai_generation_orchestration ago ON asgj.orchestration_id = ago.id
    WHERE ago.id IS NULL
  `);
  const jobsOrphanCount = parseInt(String(jobsOrphans.rows[0]?.count || '0'));
  validations.push({
    table: 'ai_section_generation_jobs',
    column: 'orchestration_id',
    referencedTable: 'ai_generation_orchestration',
    orphanCount: jobsOrphanCount,
    isValid: jobsOrphanCount === 0,
  });
  totalOrphans += jobsOrphanCount;

  // Validate content_deployments -> tutorial_sections
  const deploymentsOrphans = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM content_deployments cd
    LEFT JOIN tutorial_sections ts ON cd.section_id = ts.id
    WHERE ts.id IS NULL
  `);
  const deploymentsOrphanCount = parseInt(String(deploymentsOrphans.rows[0]?.count || '0'));
  validations.push({
    table: 'content_deployments',
    column: 'section_id',
    referencedTable: 'tutorial_sections',
    orphanCount: deploymentsOrphanCount,
    isValid: deploymentsOrphanCount === 0,
  });
  totalOrphans += deploymentsOrphanCount;

  // Print results
  console.log('Validation Results:');
  console.log('==================');
  validations.forEach((v) => {
    const status = v.isValid ? '✅' : '❌';
    console.log(`${status} ${v.table}.${v.column} -> ${v.referencedTable}: ${v.orphanCount} orphans`);
  });
  console.log('==================');
  console.log(`Total orphans: ${totalOrphans}\n`);

  const success = totalOrphans === 0;
  if (success) {
    console.log('✅ All foreign key relationships are valid\n');
  } else {
    console.log('❌ Foreign key integrity issues detected\n');
  }

  return {
    success,
    results: validations,
    totalOrphans,
  };
}

if (require.main === module) {
  validateFKIntegrity()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
