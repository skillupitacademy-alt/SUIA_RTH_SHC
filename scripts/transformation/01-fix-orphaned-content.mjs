#!/usr/bin/env node
/**
 * DELIVERABLE 2 - PHASE 1: DATA INTEGRITY REMEDIATION
 * Fix Orphaned Content Items
 * 
 * Purpose: Resolve subtopic_id references that point to external_id instead of id
 * Priority: P0 - BLOCKING
 */

import { neon } from '@neondatabase/serverless';
import { writeFileSync } from 'fs';

const TUTORIAL_DB_URL = process.env.DATABASE_URL_TUTORIAL;

if (!TUTORIAL_DB_URL) {
  console.error('❌ DATABASE_URL_TUTORIAL not found');
  process.exit(1);
}

const sql = neon(TUTORIAL_DB_URL);

async function fixOrphanedContent() {
  console.log('🔧 DELIVERABLE 2 - PHASE 1: FIX ORPHANED CONTENT');
  console.log('==========================================\n');

  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    deliverable: 'DELIVERABLE_2',
    phase: 'PHASE_1_DATA_INTEGRITY_REMEDIATION',
    status: 'IN_PROGRESS',
    orphanedContent: [],
    mappings: [],
    fixes: [],
    errors: []
  };

  try {
    // ========================================
    // STEP 1: IDENTIFY ORPHANED CONTENT
    // ========================================
    console.log('📊 STEP 1: Identifying Orphaned Content');
    console.log('------------------------------------------\n');

    const orphanedContent = await sql`
      SELECT 
        c.id,
        c.subtopic_id,
        c.difficulty,
        c.content_type,
        c.is_published,
        c.generated_by_ai,
        c.created_at
      FROM tutorial_content c
      LEFT JOIN tutorial_subtopics s ON c.subtopic_id = s.id
      WHERE s.id IS NULL
      AND c.deleted_at IS NULL;
    `;

    console.log(`Found ${orphanedContent.length} orphaned content items\n`);

    if (orphanedContent.length === 0) {
      console.log('✅ No orphaned content found. Data integrity is good!');
      report.status = 'SUCCESS';
      report.message = 'No orphaned content to fix';
      
      const reportPath = `scripts/transformation/reports/fix-orphaned-content-${timestamp.replace(/:/g, '-')}.json`;
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      return report;
    }

    report.orphanedContent = orphanedContent.map(c => ({
      id: c.id,
      subtopicId: c.subtopic_id,
      difficulty: c.difficulty,
      contentType: c.content_type,
      isPublished: c.is_published,
      generatedByAi: c.generated_by_ai,
      createdAt: c.created_at
    }));

    // ========================================
    // STEP 2: FIND CORRECT SUBTOPIC MAPPINGS
    // ========================================
    console.log('📊 STEP 2: Finding Correct Subtopic Mappings');
    console.log('------------------------------------------\n');

    // Get all subtopics with their external_ids
    const subtopics = await sql`
      SELECT 
        id,
        external_id,
        name,
        slug,
        topic_id,
        difficulty_levels
      FROM tutorial_subtopics
      WHERE deleted_at IS NULL;
    `;

    console.log(`Available subtopics: ${subtopics.length}\n`);

    // Create mapping: external_id → id
    const externalIdToIdMap = new Map();
    subtopics.forEach(s => {
      externalIdToIdMap.set(s.external_id, s.id);
    });

    // Try to map orphaned content to correct subtopics
    for (const content of orphanedContent) {
      console.log(`Analyzing content ${content.id}:`);
      console.log(`  Current subtopic_id: ${content.subtopic_id}`);
      
      // Check if subtopic_id is actually an external_id
      if (externalIdToIdMap.has(content.subtopic_id)) {
        const correctId = externalIdToIdMap.get(content.subtopic_id);
        const subtopic = subtopics.find(s => s.id === correctId);
        
        console.log(`  ✅ Found mapping: external_id → id`);
        console.log(`     Subtopic: ${subtopic.name}`);
        console.log(`     Correct ID: ${correctId}`);
        
        report.mappings.push({
          contentId: content.id,
          oldSubtopicId: content.subtopic_id,
          newSubtopicId: correctId,
          subtopicName: subtopic.name,
          mappingMethod: 'external_id_lookup'
        });
      } else {
        console.log(`  ⚠️  No direct mapping found`);
        console.log(`     Will attempt difficulty-based matching...`);
        
        // Try to match by difficulty
        const matchingSubtopics = subtopics.filter(s => {
          const diffLevels = Array.isArray(s.difficulty_levels) ? s.difficulty_levels : [];
          return diffLevels.includes(content.difficulty);
        });

        if (matchingSubtopics.length > 0) {
          // Use the first matching subtopic
          const match = matchingSubtopics[0];
          console.log(`  ✅ Found difficulty-based match: ${match.name}`);
          
          report.mappings.push({
            contentId: content.id,
            oldSubtopicId: content.subtopic_id,
            newSubtopicId: match.id,
            subtopicName: match.name,
            mappingMethod: 'difficulty_match',
            confidence: 'medium'
          });
        } else {
          console.log(`  ❌ No suitable match found`);
          report.errors.push({
            contentId: content.id,
            error: 'No suitable subtopic mapping found',
            recommendation: 'Manual review required'
          });
        }
      }
      console.log('');
    }

    console.log(`\nMappings found: ${report.mappings.length}/${orphanedContent.length}`);
    console.log(`Errors: ${report.errors.length}\n`);

    // ========================================
    // STEP 3: APPLY FIXES
    // ========================================
    console.log('📊 STEP 3: Applying Fixes');
    console.log('------------------------------------------\n');

    for (const mapping of report.mappings) {
      try {
        console.log(`Updating content ${mapping.contentId}...`);
        console.log(`  Old subtopic_id: ${mapping.oldSubtopicId}`);
        console.log(`  New subtopic_id: ${mapping.newSubtopicId}`);
        console.log(`  Subtopic: ${mapping.subtopicName}`);
        
        // Update the content record
        await sql`
          UPDATE tutorial_content
          SET 
            subtopic_id = ${mapping.newSubtopicId},
            updated_at = NOW()
          WHERE id = ${mapping.contentId};
        `;
        
        console.log(`  ✅ Updated successfully\n`);
        
        report.fixes.push({
          contentId: mapping.contentId,
          status: 'SUCCESS',
          oldSubtopicId: mapping.oldSubtopicId,
          newSubtopicId: mapping.newSubtopicId,
          subtopicName: mapping.subtopicName
        });
      } catch (error) {
        console.log(`  ❌ Update failed: ${error.message}\n`);
        
        report.errors.push({
          contentId: mapping.contentId,
          error: error.message,
          mapping
        });
      }
    }

    // ========================================
    // STEP 4: VALIDATION
    // ========================================
    console.log('📊 STEP 4: Validation');
    console.log('------------------------------------------\n');

    const remainingOrphans = await sql`
      SELECT COUNT(*) as count
      FROM tutorial_content c
      LEFT JOIN tutorial_subtopics s ON c.subtopic_id = s.id
      WHERE s.id IS NULL
      AND c.deleted_at IS NULL;
    `;

    const orphanCount = parseInt(remainingOrphans[0].count);
    console.log(`Remaining orphaned content: ${orphanCount}`);

    if (orphanCount === 0) {
      console.log('✅ All orphaned content fixed!');
      report.status = 'SUCCESS';
    } else {
      console.log('⚠️  Some orphaned content remains');
      report.status = 'PARTIAL';
    }

    // Verify FK integrity
    const fkViolations = await sql`
      SELECT 
        c.id,
        c.subtopic_id
      FROM tutorial_content c
      WHERE c.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM tutorial_subtopics s 
        WHERE s.id = c.subtopic_id 
        AND s.deleted_at IS NULL
      );
    `;

    console.log(`FK violations: ${fkViolations.length}`);

    if (fkViolations.length === 0) {
      console.log('✅ FK integrity validated');
    } else {
      console.log('❌ FK integrity issues remain');
      report.status = 'FAILED';
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n==========================================');
    console.log('📊 REMEDIATION SUMMARY');
    console.log('==========================================\n');

    console.log(`Orphaned Content Found: ${orphanedContent.length}`);
    console.log(`Mappings Identified: ${report.mappings.length}`);
    console.log(`Fixes Applied: ${report.fixes.length}`);
    console.log(`Errors: ${report.errors.length}`);
    console.log(`Remaining Orphans: ${orphanCount}`);
    console.log(`FK Violations: ${fkViolations.length}`);
    console.log(`\nStatus: ${report.status}`);

    report.summary = {
      orphanedFound: orphanedContent.length,
      mappingsIdentified: report.mappings.length,
      fixesApplied: report.fixes.length,
      errors: report.errors.length,
      remainingOrphans: orphanCount,
      fkViolations: fkViolations.length
    };

    // Save report
    const reportPath = `scripts/transformation/reports/fix-orphaned-content-${timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);

    return report;

  } catch (error) {
    console.error('❌ Remediation failed:', error.message);
    report.status = 'FAILED';
    report.error = error.message;
    
    const reportPath = `scripts/transformation/reports/fix-orphaned-content-${timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    throw error;
  }
}

// Execute
fixOrphanedContent()
  .then((report) => {
    if (report.status === 'SUCCESS') {
      console.log('\n✅ Data integrity remediation complete');
      process.exit(0);
    } else {
      console.log('\n⚠️  Data integrity remediation completed with issues');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Data integrity remediation failed:', error);
    process.exit(1);
  });
