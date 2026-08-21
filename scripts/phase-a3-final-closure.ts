/**
 * Phase A.3: Tutorial V2 Legacy Eradication - Final Shared Consumer & Orphan Dependency Closure
 * 
 * This final audit closes the remaining classification questions:
 * - A.3.1: prompt_templates - current V2 or legacy?
 * - A.3.2: subsection_engagement_metrics - legacy or current?
 * - A.3.3: tutorial_video_links - verify architecture document claim (removed)
 * - A.3.4: Final enum consumer matrix with all ??? resolved
 * 
 * CRITICAL: This is READ-ONLY. No destructive operations are performed.
 * 
 * Output: scripts/phase-a3-final-closure-report.json
 */

import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔍 Phase A.3: Tutorial V2 Legacy Eradication - Final Closure');
console.log('='.repeat(70));
console.log('');

const auditReport: any = {
  timestamp: new Date().toISOString(),
  phase: 'A.3 - Final Shared Consumer & Orphan Dependency Closure',
  findings: {},
};

/**
 * Recursively search for pattern in files
 */
function searchInFiles(
  dir: string,
  pattern: RegExp,
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx'],
  excludeDirs: string[] = ['node_modules', '.next', 'dist', 'build', '.git', '.turbo']
): string[] {
  const results: string[] = [];
  const fs = require('fs');
  const pathModule = require('path');
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = pathModule.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          results.push(...searchInFiles(fullPath, pattern, extensions, excludeDirs));
        }
      } else if (entry.isFile()) {
        const hasValidExtension = extensions.some((ext: string) => entry.name.endsWith(ext));
        if (hasValidExtension) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (pattern.test(content)) {
              results.push(pathModule.relative(process.cwd(), fullPath).replace(/\\/g, '/'));
            }
          } catch (err) {
            // Skip files that can't be read
          }
        }
      }
    }
  } catch (err) {
    // Skip directories that can't be read
  }
  
  return results;
}

async function main() {
  const cwd = process.cwd();

  // ===== A.3.1: prompt_templates Classification =====
  console.log('📊 A.3.1: Classifying prompt_templates...');
  console.log('');

  try {
    // Get actual schema
    const schemaResult = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'prompt_templates'
      ORDER BY ordinal_position
    `);

    console.log('   Schema columns:');
    schemaResult.rows.forEach((col: any) => {
      const typeInfo = col.udt_name === col.data_type ? col.data_type : `${col.data_type} (${col.udt_name})`;
      console.log(`      ${col.column_name}: ${typeInfo}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    console.log('');

    // Get row count
    const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM prompt_templates`);
    const rowCount = parseInt(countResult.rows[0].count);
    console.log(`   Row count: ${rowCount}`);
    console.log('');

    // Get FK relationships
    const fksOut = await db.execute(sql`
      SELECT 
        ccu.table_name AS references_table,
        ccu.column_name AS references_column,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = 'prompt_templates'
    `);

    const fksIn = await db.execute(sql`
      SELECT 
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_name = 'prompt_templates'
    `);

    console.log(`   Outgoing FKs: ${fksOut.rows.length}`);
    fksOut.rows.forEach((fk: any) => {
      console.log(`      ${fk.column_name} → ${fk.references_table}.${fk.references_column}`);
    });
    console.log('');

    console.log(`   Incoming FKs: ${fksIn.rows.length}`);
    fksIn.rows.forEach((fk: any) => {
      console.log(`      ${fk.table_name}.${fk.column_name} → prompt_templates`);
    });
    console.log('');

    // Get indexes
    const indexesResult = await db.execute(sql`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'prompt_templates'
    `);

    console.log(`   Indexes: ${indexesResult.rows.length}`);
    indexesResult.rows.forEach((idx: any) => {
      console.log(`      ${idx.indexname}`);
    });
    console.log('');

    // Get sample data if exists
    let sampleData: any[] = [];
    if (rowCount > 0) {
      const sampleResult = await db.execute(sql`
        SELECT 
          id,
          section_type,
          subsection_type,
          name,
          version,
          is_active,
          usage_count,
          created_at
        FROM prompt_templates
        ORDER BY created_at DESC
        LIMIT 5
      `);
      sampleData = sampleResult.rows;

      console.log('   Sample records:');
      sampleData.forEach((rec: any) => {
        console.log(`      ${rec.name} (v${rec.version})`);
        console.log(`         section_type: ${rec.section_type || 'null'}`);
        console.log(`         subsection_type: ${rec.subsection_type || 'null'}`);
        console.log(`         is_active: ${rec.is_active}`);
        console.log(`         usage_count: ${rec.usage_count}`);
      });
      console.log('');
    }

    // Search for application references
    console.log('   Searching application code...');
    const promptTemplatesRefs = searchInFiles(cwd, /prompt_templates|promptTemplates|PromptTemplate/i, ['.ts', '.tsx']);
    const sectionTypeInPromptContext = searchInFiles(cwd, /prompt.*section_type|section_type.*prompt/i, ['.ts', '.tsx']);
    const subsectionTypeInPromptContext = searchInFiles(cwd, /prompt.*subsection_type|subsection_type.*prompt/i, ['.ts', '.tsx']);

    console.log(`      Files referencing prompt_templates: ${promptTemplatesRefs.length}`);
    console.log(`      Files with prompt + section_type: ${sectionTypeInPromptContext.length}`);
    console.log(`      Files with prompt + subsection_type: ${subsectionTypeInPromptContext.length}`);
    console.log('');

    // Determine classification
    let classification = 'UNKNOWN';
    let reason = '';
    let v2_required = null;
    let section_type_decision = 'INVESTIGATE';
    let subsection_type_decision = 'INVESTIGATE';

    // Check if this appears to be V2 current based on evidence
    const hasV2Indicators = 
      indexesResult.rows.some((idx: any) => idx.indexname.includes('brand')) ||
      schemaResult.rows.some((col: any) => col.column_name === 'brand_id') ||
      promptTemplatesRefs.length > 5 ||
      rowCount > 0;

    const referencesLegacyTutorialSections = fksOut.rows.some((fk: any) => 
      fk.references_table === 'tutorial_sections'
    );

    if (referencesLegacyTutorialSections) {
      classification = 'LEGACY';
      reason = 'Has FK to legacy tutorial_sections table';
      v2_required = false;
      section_type_decision = 'DROP_AFTER_TABLE_DROP';
      subsection_type_decision = 'DROP_AFTER_TABLE_DROP';
    } else if (hasV2Indicators) {
      classification = 'CURRENT_V2';
      reason = 'Has V2 indicators (brand_id, active usage, application references)';
      v2_required = true;
      section_type_decision = 'KEEP';
      subsection_type_decision = 'KEEP';
    } else if (rowCount === 0 && promptTemplatesRefs.length === 0) {
      classification = 'LEGACY_UNUSED';
      reason = 'Empty table with no application references';
      v2_required = false;
      section_type_decision = 'DROP_AFTER_TABLE_DROP';
      subsection_type_decision = 'DROP_AFTER_TABLE_DROP';
    } else {
      classification = 'UNKNOWN';
      reason = 'Insufficient evidence to classify';
      v2_required = null;
      section_type_decision = 'MANUAL_REVIEW';
      subsection_type_decision = 'MANUAL_REVIEW';
    }

    auditReport.findings.prompt_templates = {
      exists: true,
      row_count: rowCount,
      classification,
      reason,
      v2_required,
      schema: schemaResult.rows,
      outgoing_fks: fksOut.rows,
      incoming_fks: fksIn.rows,
      indexes: indexesResult.rows.map((idx: any) => idx.indexname),
      sample_data: sampleData,
      application_references: {
        total: promptTemplatesRefs.length,
        files: promptTemplatesRefs.slice(0, 10), // First 10
        section_type_context: sectionTypeInPromptContext.length,
        subsection_type_context: subsectionTypeInPromptContext.length
      },
      enum_decisions: {
        section_type: section_type_decision,
        subsection_type: subsection_type_decision
      }
    };

    console.log(`   Classification: ${classification}`);
    console.log(`   V2 required: ${v2_required === null ? 'UNKNOWN' : v2_required ? 'YES' : 'NO'}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   section_type enum: ${section_type_decision}`);
    console.log(`   subsection_type enum: ${subsection_type_decision}`);
    console.log('');

  } catch (error: any) {
    auditReport.findings.prompt_templates = {
      exists: false,
      error: error.message,
      classification: 'ERROR',
      enum_decisions: {
        section_type: 'INVESTIGATE',
        subsection_type: 'INVESTIGATE'
      }
    };
    console.log(`   ❌ Error: ${error.message}`);
    console.log('');
  }

  // ===== A.3.2: subsection_engagement_metrics Classification =====
  console.log('📊 A.3.2: Classifying subsection_engagement_metrics...');
  console.log('');

  try {
    // Check if table exists
    const existsResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'subsection_engagement_metrics'
      ) as exists
    `);

    const exists = existsResult.rows[0]?.exists;

    if (!exists) {
      auditReport.findings.subsection_engagement_metrics = {
        exists: false,
        classification: 'TABLE_NOT_FOUND',
        action: 'NO_ACTION_NEEDED',
        blocks_tutorial_subsections_drop: false
      };
      console.log('   ✅ Table not found (safe for tutorial_subsections drop)');
      console.log('');
    } else {
      // Get row count
      const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM subsection_engagement_metrics`);
      const rowCount = parseInt(countResult.rows[0].count);

      // Get schema
      const schemaResult = await db.execute(sql`
        SELECT 
          column_name,
          data_type,
          udt_name,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'subsection_engagement_metrics'
        ORDER BY ordinal_position
      `);

      // Get FKs
      const fksOut = await db.execute(sql`
        SELECT 
          ccu.table_name AS references_table,
          ccu.column_name AS references_column,
          kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = 'subsection_engagement_metrics'
      `);

      const referencesSubsections = fksOut.rows.some((fk: any) => 
        fk.references_table === 'tutorial_subsections'
      );

      // Search for application references
      const appRefs = searchInFiles(cwd, /subsection_engagement_metrics|subsectionEngagementMetrics/i, ['.ts', '.tsx']);

      // Classify
      let classification = 'UNKNOWN';
      let reason = '';
      let action = '';
      let blocksSubsectionsDrop = false;

      if (rowCount === 0 && appRefs.length === 0) {
        classification = 'LEGACY_EMPTY_UNUSED';
        reason = 'Empty with no application references';
        action = 'DROP_BEFORE_TUTORIAL_SUBSECTIONS';
        blocksSubsectionsDrop = true;
      } else if (rowCount > 0) {
        classification = 'CONTAINS_DATA';
        reason = `Contains ${rowCount} rows`;
        action = 'INVESTIGATE_DATA';
        blocksSubsectionsDrop = true;
      } else if (appRefs.length > 0) {
        classification = 'EMPTY_BUT_REFERENCED';
        reason = 'Empty but has application references';
        action = 'INVESTIGATE_USAGE';
        blocksSubsectionsDrop = true;
      } else {
        classification = 'UNKNOWN';
        reason = 'Insufficient evidence';
        action = 'MANUAL_REVIEW';
        blocksSubsectionsDrop = true;
      }

      auditReport.findings.subsection_engagement_metrics = {
        exists: true,
        row_count: rowCount,
        classification,
        reason,
        action,
        blocks_tutorial_subsections_drop: blocksSubsectionsDrop,
        references_tutorial_subsections: referencesSubsections,
        schema: schemaResult.rows,
        outgoing_fks: fksOut.rows,
        application_references: {
          count: appRefs.length,
          files: appRefs.slice(0, 5)
        }
      };

      console.log(`   Row count: ${rowCount}`);
      console.log(`   Classification: ${classification}`);
      console.log(`   References tutorial_subsections: ${referencesSubsections ? 'YES' : 'NO'}`);
      console.log(`   Application references: ${appRefs.length}`);
      console.log(`   Action: ${action}`);
      console.log(`   Blocks tutorial_subsections drop: ${blocksSubsectionsDrop ? 'YES ⚠️' : 'NO ✅'}`);
      console.log('');
    }

  } catch (error: any) {
    auditReport.findings.subsection_engagement_metrics = {
      exists: false,
      error: error.message,
      classification: 'ERROR',
      blocks_tutorial_subsections_drop: null
    };
    console.log(`   ❌ Error: ${error.message}`);
    console.log('');
  }

  // ===== A.3.3: tutorial_video_links Classification =====
  console.log('📊 A.3.3: Classifying tutorial_video_links (architecture says REMOVED)...');
  console.log('');

  try {
    // Get row count
    const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM tutorial_video_links`);
    const rowCount = parseInt(countResult.rows[0].count);

    // Get schema
    const schemaResult = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tutorial_video_links'
      ORDER BY ordinal_position
    `);

    // Get FKs
    const fksOut = await db.execute(sql`
      SELECT 
        ccu.table_name AS references_table,
        ccu.column_name AS references_column,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = 'tutorial_video_links'
    `);

    // Search for application references
    const appRefs = searchInFiles(cwd, /tutorial_video_links|tutorialVideoLinks|VideoLink/i, ['.ts', '.tsx']);

    // Classify based on architecture document claim + evidence
    let classification = 'UNKNOWN';
    let reason = '';
    let action = '';
    let architecture_document_says_removed = true;

    if (rowCount === 0 && appRefs.length === 0) {
      classification = 'LEGACY_REMOVED';
      reason = 'Empty, no application references, architecture doc says REMOVED';
      action = 'DROP_TABLE';
    } else if (rowCount > 0) {
      classification = 'CONTAINS_DATA_CONFLICTS_ARCHITECTURE';
      reason = `Contains ${rowCount} rows but architecture says REMOVED`;
      action = 'INVESTIGATE_DATA';
    } else if (appRefs.length > 0) {
      classification = 'EMPTY_BUT_REFERENCED_CONFLICTS_ARCHITECTURE';
      reason = 'Empty but has application references, architecture says REMOVED';
      action = 'INVESTIGATE_REFERENCES';
    } else {
      classification = 'UNKNOWN';
      reason = 'Insufficient evidence';
      action = 'MANUAL_REVIEW';
    }

    const hasAssignmentDifficulty = schemaResult.rows.some((col: any) => 
      col.column_name === 'assignment_difficulty' && col.udt_name === 'tutorial_difficulty'
    );

    auditReport.findings.tutorial_video_links = {
      exists: true,
      row_count: rowCount,
      classification,
      reason,
      action,
      architecture_document_says_removed,
      has_assignment_difficulty_column: hasAssignmentDifficulty,
      assignment_difficulty_enum_impact: hasAssignmentDifficulty 
        ? (classification === 'LEGACY_REMOVED' ? 'CAN_REMOVE_CONSUMER' : 'INVESTIGATE')
        : 'NO_IMPACT',
      schema: schemaResult.rows,
      outgoing_fks: fksOut.rows,
      application_references: {
        count: appRefs.length,
        files: appRefs.slice(0, 5)
      }
    };

    console.log(`   Row count: ${rowCount}`);
    console.log(`   Classification: ${classification}`);
    console.log(`   Architecture document: REMOVED ✅`);
    console.log(`   Has assignment_difficulty column: ${hasAssignmentDifficulty ? 'YES' : 'NO'}`);
    console.log(`   Application references: ${appRefs.length}`);
    console.log(`   Action: ${action}`);
    console.log(`   tutorial_difficulty enum impact: ${auditReport.findings.tutorial_video_links.assignment_difficulty_enum_impact}`);
    console.log('');

  } catch (error: any) {
    auditReport.findings.tutorial_video_links = {
      exists: false,
      error: error.message,
      classification: 'TABLE_NOT_FOUND',
      action: 'NO_ACTION_NEEDED',
      assignment_difficulty_enum_impact: 'NO_IMPACT'
    };
    console.log(`   ❌ Table not found or error: ${error.message}`);
    console.log('');
  }

  // ===== A.3.4: Final Enum Consumer Matrix =====
  console.log('📊 A.3.4: Final enum consumer matrix...');
  console.log('');

  const enumMatrix = {
    tutorial_difficulty: {
      consumers: [] as any[],
      decision: 'UNKNOWN',
      evidence: '',
      action: ''
    },
    section_type: {
      consumers: [] as any[],
      decision: 'UNKNOWN',
      evidence: '',
      action: ''
    },
    subsection_type: {
      consumers: [] as any[],
      decision: 'UNKNOWN',
      evidence: '',
      action: ''
    }
  };

  // tutorial_difficulty consumers
  const difficultyConsumers = [
    { table: 'tutorial_sections', column: 'difficulty', classification: 'LEGACY', action: 'REMOVE' },
    { table: 'tutorial_content', column: 'difficulty', classification: 'LEGACY', action: 'REMOVE' },
    { table: 'tutorial_video_links', column: 'assignment_difficulty', classification: auditReport.findings.tutorial_video_links?.classification || 'UNKNOWN', action: auditReport.findings.tutorial_video_links?.action || 'INVESTIGATE' },
    { table: 'assignment_progress', column: 'difficulty', classification: 'ASSESSMENT', action: 'KEEP' },
    { table: 'tutorial_assignments', column: 'difficulty', classification: 'ASSESSMENT', action: 'KEEP' },
    { table: 'tutorial_project_submissions', column: 'difficulty', classification: 'ASSESSMENT', action: 'KEEP' },
    { table: 'ai_generation_orchestration', column: 'difficulty', classification: 'AI_GENERATION', action: 'KEEP' },
    { table: 'ai_section_generation_jobs', column: 'difficulty', classification: 'LEGACY', action: 'DROP_WITH_TABLE' },
    { table: 'content_generation_jobs', column: 'difficulty', classification: 'AI_GENERATION', action: 'KEEP' },
  ];

  enumMatrix.tutorial_difficulty.consumers = difficultyConsumers;

  const keepCount = difficultyConsumers.filter(c => c.action === 'KEEP').length;
  const removeCount = difficultyConsumers.filter(c => c.action === 'REMOVE' || c.action === 'DROP_WITH_TABLE').length;
  const investigateCount = difficultyConsumers.filter(c => c.action.includes('INVESTIGATE')).length;

  if (investigateCount > 0) {
    enumMatrix.tutorial_difficulty.decision = 'INVESTIGATE';
    enumMatrix.tutorial_difficulty.evidence = `${keepCount} KEEP, ${removeCount} REMOVE, ${investigateCount} INVESTIGATE`;
    enumMatrix.tutorial_difficulty.action = 'Resolve investigation items before deciding';
  } else if (keepCount > 0) {
    enumMatrix.tutorial_difficulty.decision = 'KEEP';
    enumMatrix.tutorial_difficulty.evidence = `${keepCount} consumers require enum (assessments, AI generation)`;
    enumMatrix.tutorial_difficulty.action = 'Remove tutorial_sections.difficulty and tutorial_content.difficulty only';
  } else {
    enumMatrix.tutorial_difficulty.decision = 'DROP';
    enumMatrix.tutorial_difficulty.evidence = 'No consumers require enum';
    enumMatrix.tutorial_difficulty.action = 'Drop enum after removing all columns';
  }

  // section_type consumers
  const sectionTypeConsumers = [
    { table: 'tutorial_sections', column: 'section_type', classification: 'LEGACY', action: 'REMOVE' },
    { table: 'ai_section_generation_jobs', column: 'section_type', classification: 'LEGACY', action: 'DROP_WITH_TABLE' },
    { table: 'prompt_templates', column: 'section_type', classification: auditReport.findings.prompt_templates?.classification || 'UNKNOWN', action: auditReport.findings.prompt_templates?.enum_decisions?.section_type || 'INVESTIGATE' },
  ];

  enumMatrix.section_type.consumers = sectionTypeConsumers;

  const sectionTypeKeep = sectionTypeConsumers.filter(c => c.action === 'KEEP').length;
  const sectionTypeInvestigate = sectionTypeConsumers.filter(c => c.action.includes('INVESTIGATE') || c.action.includes('MANUAL_REVIEW')).length;

  if (sectionTypeInvestigate > 0) {
    enumMatrix.section_type.decision = 'INVESTIGATE';
    enumMatrix.section_type.evidence = 'prompt_templates classification unresolved';
    enumMatrix.section_type.action = 'Resolve prompt_templates classification before deciding';
  } else if (sectionTypeKeep > 0) {
    enumMatrix.section_type.decision = 'KEEP';
    enumMatrix.section_type.evidence = 'prompt_templates requires enum (V2 current)';
    enumMatrix.section_type.action = 'Remove tutorial_sections.section_type, drop ai_section_generation_jobs, keep enum';
  } else {
    enumMatrix.section_type.decision = 'DROP';
    enumMatrix.section_type.evidence = 'All consumers are legacy';
    enumMatrix.section_type.action = 'Drop enum after removing all columns and tables';
  }

  // subsection_type consumers
  const subsectionTypeConsumers = [
    { table: 'tutorial_subsections', column: 'subsection_type', classification: 'LEGACY', action: 'DROP_WITH_TABLE' },
    { table: 'prompt_templates', column: 'subsection_type', classification: auditReport.findings.prompt_templates?.classification || 'UNKNOWN', action: auditReport.findings.prompt_templates?.enum_decisions?.subsection_type || 'INVESTIGATE' },
  ];

  enumMatrix.subsection_type.consumers = subsectionTypeConsumers;

  const subsectionTypeKeep = subsectionTypeConsumers.filter(c => c.action === 'KEEP').length;
  const subsectionTypeInvestigate = subsectionTypeConsumers.filter(c => c.action.includes('INVESTIGATE') || c.action.includes('MANUAL_REVIEW')).length;

  if (subsectionTypeInvestigate > 0) {
    enumMatrix.subsection_type.decision = 'INVESTIGATE';
    enumMatrix.subsection_type.evidence = 'prompt_templates classification unresolved';
    enumMatrix.subsection_type.action = 'Resolve prompt_templates classification before deciding';
  } else if (subsectionTypeKeep > 0) {
    enumMatrix.subsection_type.decision = 'KEEP';
    enumMatrix.subsection_type.evidence = 'prompt_templates requires enum (V2 current)';
    enumMatrix.subsection_type.action = 'Drop tutorial_subsections, keep enum for prompt_templates';
  } else {
    enumMatrix.subsection_type.decision = 'DROP';
    enumMatrix.subsection_type.evidence = 'All consumers are legacy';
    enumMatrix.subsection_type.action = 'Drop enum after dropping tutorial_subsections';
  }

  auditReport.findings.enum_consumer_matrix = enumMatrix;

  console.log('   tutorial_difficulty:');
  console.log(`      Decision: ${enumMatrix.tutorial_difficulty.decision}`);
  console.log(`      Evidence: ${enumMatrix.tutorial_difficulty.evidence}`);
  console.log(`      Consumers:`);
  enumMatrix.tutorial_difficulty.consumers.forEach((c: any) => {
    console.log(`         ${c.table}.${c.column}: ${c.classification} → ${c.action}`);
  });
  console.log('');

  console.log('   section_type:');
  console.log(`      Decision: ${enumMatrix.section_type.decision}`);
  console.log(`      Evidence: ${enumMatrix.section_type.evidence}`);
  console.log(`      Consumers:`);
  enumMatrix.section_type.consumers.forEach((c: any) => {
    console.log(`         ${c.table}.${c.column}: ${c.classification} → ${c.action}`);
  });
  console.log('');

  console.log('   subsection_type:');
  console.log(`      Decision: ${enumMatrix.subsection_type.decision}`);
  console.log(`      Evidence: ${enumMatrix.subsection_type.evidence}`);
  console.log(`      Consumers:`);
  enumMatrix.subsection_type.consumers.forEach((c: any) => {
    console.log(`         ${c.table}.${c.column}: ${c.classification} → ${c.action}`);
  });
  console.log('');

  // ===== Final Executive Summary =====
  const allResolved = 
    auditReport.findings.prompt_templates?.classification !== 'UNKNOWN' &&
    auditReport.findings.prompt_templates?.classification !== 'ERROR' &&
    auditReport.findings.subsection_engagement_metrics?.classification !== 'UNKNOWN' &&
    auditReport.findings.subsection_engagement_metrics?.classification !== 'ERROR' &&
    auditReport.findings.tutorial_video_links?.classification !== 'UNKNOWN' &&
    auditReport.findings.tutorial_video_links?.classification !== 'ERROR' &&
    enumMatrix.tutorial_difficulty.decision !== 'INVESTIGATE' &&
    enumMatrix.section_type.decision !== 'INVESTIGATE' &&
    enumMatrix.subsection_type.decision !== 'INVESTIGATE';

  const blockers: string[] = [];

  if (auditReport.findings.prompt_templates?.classification === 'UNKNOWN' || 
      auditReport.findings.prompt_templates?.classification === 'ERROR') {
    blockers.push('prompt_templates classification incomplete');
  }

  if (auditReport.findings.subsection_engagement_metrics?.blocks_tutorial_subsections_drop) {
    blockers.push('subsection_engagement_metrics blocks tutorial_subsections drop');
  }

  if (auditReport.findings.tutorial_video_links?.classification?.includes('CONFLICTS')) {
    blockers.push('tutorial_video_links has data/references conflicting with architecture document');
  }

  if (enumMatrix.tutorial_difficulty.decision === 'INVESTIGATE') {
    blockers.push('tutorial_difficulty enum has unresolved consumers');
  }

  if (enumMatrix.section_type.decision === 'INVESTIGATE') {
    blockers.push('section_type enum has unresolved consumers');
  }

  if (enumMatrix.subsection_type.decision === 'INVESTIGATE') {
    blockers.push('subsection_type enum has unresolved consumers');
  }

  auditReport.executive_summary = {
    phase_a3_status: allResolved ? 'COMPLETE' : 'REQUIRES_MANUAL_REVIEW',
    all_resolved: allResolved,
    safe_for_phase_b: allResolved && blockers.length === 0,
    blockers,
    classifications: {
      prompt_templates: auditReport.findings.prompt_templates?.classification || 'UNKNOWN',
      subsection_engagement_metrics: auditReport.findings.subsection_engagement_metrics?.classification || 'UNKNOWN',
      tutorial_video_links: auditReport.findings.tutorial_video_links?.classification || 'UNKNOWN'
    },
    enum_decisions: {
      tutorial_difficulty: enumMatrix.tutorial_difficulty.decision,
      section_type: enumMatrix.section_type.decision,
      subsection_type: enumMatrix.subsection_type.decision
    }
  };

  // Write report
  const reportPath = 'scripts/phase-a3-final-closure-report.json';
  writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));

  // ===== Final Output =====
  console.log('');
  console.log('='.repeat(70));
  console.log('🎯 PHASE A FINAL STATUS');
  console.log('='.repeat(70));
  console.log('');
  console.log('Classifications:');
  console.log(`  prompt_templates:                  ${auditReport.findings.prompt_templates?.classification || 'UNKNOWN'}`);
  console.log(`  subsection_engagement_metrics:     ${auditReport.findings.subsection_engagement_metrics?.classification || 'UNKNOWN'}`);
  console.log(`  tutorial_video_links:              ${auditReport.findings.tutorial_video_links?.classification || 'UNKNOWN'}`);
  console.log('');
  console.log('Enum Final Decisions:');
  console.log(`  tutorial_difficulty:               ${enumMatrix.tutorial_difficulty.decision}`);
  console.log(`  section_type:                      ${enumMatrix.section_type.decision}`);
  console.log(`  subsection_type:                   ${enumMatrix.subsection_type.decision}`);
  console.log('');
  console.log('='.repeat(70));
  console.log('PHASE A STATUS:                      ' + auditReport.executive_summary.phase_a3_status);
  console.log('SAFE FOR PHASE B:                    ' + (auditReport.executive_summary.safe_for_phase_b ? 'YES ✅' : 'NO ❌'));
  console.log('='.repeat(70));
  console.log('');

  if (blockers.length > 0) {
    console.log('⚠️  BLOCKERS:');
    blockers.forEach((blocker: string) => {
      console.log(`   - ${blocker}`);
    });
    console.log('');
  }

  if (auditReport.executive_summary.safe_for_phase_b) {
    console.log('✅ Phase A fully complete. All classifications resolved. Ready for Phase B approval.');
  } else {
    console.log('🟡 Phase A requires manual review of remaining items.');
  }

  console.log('');
  console.log('🔴 USER APPROVAL REQUIRED BEFORE PHASE B');
  console.log('='.repeat(70));
  console.log('');
  console.log(`✅ Phase A.3 final closure complete`);
  console.log(`📄 Report saved to: ${reportPath}`);
  console.log('');

  process.exit(auditReport.executive_summary.safe_for_phase_b ? 0 : 1);
}

main().catch((error) => {
  console.error('\n❌ Fatal error during Phase A.3 final closure:', error);
  process.exit(1);
});
