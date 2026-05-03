/**
 * Phase 1 P0 Foundation - Gap Remediation Validation
 * Validates all gap remediation implementations
 */

import { db } from '../../db';
import { sql } from 'drizzle-orm';

interface ValidationResult {
  category: string;
  check: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: ValidationResult[] = [];

function addResult(category: string, check: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
  results.push({ category, check, status, message, details });
}

async function validateEnums() {
  console.log('\n🔍 Validating Enums (GAP 2 & GAP 4)...\n');
  
  try {
    // Check subsection_type enum
    const subsectionTypes = await db.execute(sql`
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = 'subsection_type'::regtype 
      ORDER BY enumsortorder
    `);
    
    const expectedSubsectionTypes = [
      'definition', 'concept', 'syntax', 'analogy',
      'example', 'visual', 'diagram', 'animation',
      'pitfall', 'antipattern', 'gotcha',
      'code', 'exercise', 'challenge', 'sandbox',
      'checklist', 'cheatsheet', 'faq', 'glossary',
      'interview_question', 'quiz_question',
      'project_step', 'project_milestone', 'project_deliverable'
    ];
    
    if (subsectionTypes.rows.length === expectedSubsectionTypes.length) {
      addResult('GAP 2', 'Subsection Type Enum', 'PASS', `All ${expectedSubsectionTypes.length} subsection types defined`);
    } else {
      addResult('GAP 2', 'Subsection Type Enum', 'FAIL', `Expected ${expectedSubsectionTypes.length} types, found ${subsectionTypes.rows.length}`);
    }
    
    // Check brand enum
    const brands = await db.execute(sql`
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = 'brand'::regtype 
      ORDER BY enumsortorder
    `);
    
    if (brands.rows.length === 3) {
      addResult('GAP 4', 'Brand Enum', 'PASS', 'All 3 brands defined (realtutorialhub, skillup, shared)');
    } else {
      addResult('GAP 4', 'Brand Enum', 'FAIL', `Expected 3 brands, found ${brands.rows.length}`);
    }
    
    // Check brand_visibility enum
    const brandVisibility = await db.execute(sql`
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = 'brand_visibility'::regtype 
      ORDER BY enumsortorder
    `);
    
    if (brandVisibility.rows.length === 3) {
      addResult('GAP 4', 'Brand Visibility Enum', 'PASS', 'All 3 visibility types defined');
    } else {
      addResult('GAP 4', 'Brand Visibility Enum', 'FAIL', `Expected 3 types, found ${brandVisibility.rows.length}`);
    }
    
  } catch (error: any) {
    addResult('GAP 2 & 4', 'Enum Validation', 'FAIL', `Error validating enums: ${error.message}`);
  }
}

async function validateFKConstraints() {
  console.log('\n🔍 Validating FK Constraints (GAP 3)...\n');
  
  try {
    // Check tutorial_sections_v2 FK constraints
    const sectionsFKs = await db.execute(sql`
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'tutorial_sections_v2'
    `);
    
    const expectedFKs = [
      'subtopic_id',
      'prompt_template_id',
      'educational_architecture_id',
      'ui_architecture_id'
    ];
    
    const foundFKColumns = sectionsFKs.rows.map((row: any) => row.column_name);
    const missingFKs = expectedFKs.filter(fk => !foundFKColumns.includes(fk));
    
    if (missingFKs.length === 0) {
      addResult('GAP 3', 'Tutorial Sections V2 FKs', 'PASS', `All ${expectedFKs.length} FK constraints present`);
    } else {
      addResult('GAP 3', 'Tutorial Sections V2 FKs', 'FAIL', `Missing FK constraints: ${missingFKs.join(', ')}`);
    }
    
    // Check ai_generation_orchestration_v2 FK constraints
    const orchestrationFKs = await db.execute(sql`
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'ai_generation_orchestration_v2'
    `);
    
    const orchestrationExpectedFKs = ['subtopic_id', 'educational_architecture_id'];
    const orchestrationFoundFKs = orchestrationFKs.rows.map((row: any) => row.column_name);
    const orchestrationMissingFKs = orchestrationExpectedFKs.filter(fk => !orchestrationFoundFKs.includes(fk));
    
    if (orchestrationMissingFKs.length === 0) {
      addResult('GAP 3', 'Orchestration V2 FKs', 'PASS', `All ${orchestrationExpectedFKs.length} FK constraints present`);
    } else {
      addResult('GAP 3', 'Orchestration V2 FKs', 'FAIL', `Missing FK constraints: ${orchestrationMissingFKs.join(', ')}`);
    }
    
  } catch (error: any) {
    addResult('GAP 3', 'FK Constraint Validation', 'FAIL', `Error validating FK constraints: ${error.message}`);
  }
}

async function validateBrandPartitioning() {
  console.log('\n🔍 Validating Brand Partitioning (GAP 4)...\n');
  
  try {
    // Check brand_id columns exist in V2 tables
    const v2Tables = [
      'tutorial_sections_v2',
      'tutorial_subsections_v2',
      'educational_architectures_v2',
      'ui_architectures_v2',
      'prompt_templates_v2',
      'ai_generation_orchestration_v2',
      'content_deployments_v2'
    ];
    
    for (const table of v2Tables) {
      const columns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${table}
          AND column_name = 'brand_id'
      `);
      
      if (columns.rows.length > 0) {
        addResult('GAP 4', `${table} Brand Column`, 'PASS', 'brand_id column exists');
      } else {
        addResult('GAP 4', `${table} Brand Column`, 'FAIL', 'brand_id column missing');
      }
    }
    
  } catch (error: any) {
    addResult('GAP 4', 'Brand Partitioning Validation', 'FAIL', `Error validating brand partitioning: ${error.message}`);
  }
}

async function validateAnalyticsTables() {
  console.log('\n🔍 Validating Analytics Tables (GAP 5)...\n');
  
  try {
    const analyticsTables = [
      'tutorial_learning_metrics',
      'subsection_engagement_metrics',
      'educational_architecture_performance',
      'ui_architecture_performance',
      'prompt_template_performance',
      'brand_performance_metrics',
      'deployment_cohort_metrics',
      'revenue_attribution_metrics'
    ];
    
    for (const table of analyticsTables) {
      const exists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = ${table}
        )
      `);
      
      if (exists.rows[0].exists) {
        addResult('GAP 5', `${table} Table`, 'PASS', 'Analytics table exists');
      } else {
        addResult('GAP 5', `${table} Table`, 'FAIL', 'Analytics table missing');
      }
    }
    
  } catch (error: any) {
    addResult('GAP 5', 'Analytics Tables Validation', 'FAIL', `Error validating analytics tables: ${error.message}`);
  }
}

async function validateIndexes() {
  console.log('\n🔍 Validating Indexes...\n');
  
  try {
    // Check critical indexes exist
    const criticalIndexes = [
      { table: 'tutorial_sections_v2', index: 'idx_sections_v2_brand' },
      { table: 'tutorial_sections_v2', index: 'idx_sections_v2_architecture' },
      { table: 'tutorial_subsections_v2', index: 'idx_subsections_v2_type' },
      { table: 'tutorial_subsections_v2', index: 'idx_subsections_v2_brand' },
      { table: 'prompt_templates_v2', index: 'idx_prompt_v2_subsection' },
      { table: 'tutorial_learning_metrics', index: 'idx_learning_brand' },
      { table: 'brand_performance_metrics', index: 'idx_brand_perf_brand' },
    ];
    
    for (const { table, index } of criticalIndexes) {
      const exists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE tablename = ${table}
            AND indexname = ${index}
        )
      `);
      
      if (exists.rows[0].exists) {
        addResult('Performance', `${index}`, 'PASS', 'Index exists');
      } else {
        addResult('Performance', `${index}`, 'WARN', 'Index missing - may impact performance');
      }
    }
    
  } catch (error: any) {
    addResult('Performance', 'Index Validation', 'FAIL', `Error validating indexes: ${error.message}`);
  }
}

async function validateConstitutionalNaming() {
  console.log('\n🔍 Validating Constitutional Section Naming (GAP 1)...\n');
  
  try {
    // Check section_type enum values
    const sectionTypes = await db.execute(sql`
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = 'section_type'::regtype 
      ORDER BY enumsortorder
    `);
    
    const constitutionalSections = [
      'notes', 'layman', 'visual', 'real_life', 'technical', 'code',
      'practice', 'assignment', 'project', 'quiz', 'summary', 'interview'
    ];
    
    const foundSections = sectionTypes.rows.map((row: any) => row.enumlabel);
    const invalidSections = foundSections.filter((s: string) => !constitutionalSections.includes(s));
    const missingSections = constitutionalSections.filter(s => !foundSections.includes(s));
    
    if (invalidSections.length === 0 && missingSections.length === 0) {
      addResult('GAP 1', 'Constitutional Section Names', 'PASS', 'All 12 universal sections correctly defined');
    } else {
      if (invalidSections.length > 0) {
        addResult('GAP 1', 'Constitutional Section Names', 'FAIL', `Invalid sections found: ${invalidSections.join(', ')}`);
      }
      if (missingSections.length > 0) {
        addResult('GAP 1', 'Constitutional Section Names', 'FAIL', `Missing sections: ${missingSections.join(', ')}`);
      }
    }
    
  } catch (error: any) {
    addResult('GAP 1', 'Constitutional Naming Validation', 'FAIL', `Error validating section names: ${error.message}`);
  }
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('GAP REMEDIATION VALIDATION RESULTS');
  console.log('='.repeat(80) + '\n');
  
  const categories = [...new Set(results.map(r => r.category))];
  
  for (const category of categories) {
    console.log(`\n📊 ${category}`);
    console.log('-'.repeat(80));
    
    const categoryResults = results.filter(r => r.category === category);
    
    for (const result of categoryResults) {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.check}: ${result.message}`);
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    }
  }
  
  // Summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`⚠️  Warnings: ${warned}/${total}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL GAP REMEDIATIONS VALIDATED SUCCESSFULLY!\n');
  } else {
    console.log('\n⚠️  VALIDATION FAILED - Please review failures above\n');
  }
  
  return failed === 0;
}

export async function validateGapRemediation() {
  console.log('🚀 Starting Gap Remediation Validation...\n');
  
  try {
    await validateConstitutionalNaming();
    await validateEnums();
    await validateFKConstraints();
    await validateBrandPartitioning();
    await validateAnalyticsTables();
    await validateIndexes();
    
    const success = printResults();
    return success;
    
  } catch (error) {
    console.error('❌ Validation failed with error:', error);
    return false;
  }
}

if (require.main === module) {
  validateGapRemediation()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Validation error:', error);
      process.exit(1);
    });
}
