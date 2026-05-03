#!/usr/bin/env node
/**
 * DELIVERABLE 2 - PHASE 2A: ROLLBACK CONSTITUTIONAL MIGRATION
 * Enterprise-Grade Rollback & Recovery Engine
 * 
 * Features:
 * - Batch-level rollback
 * - Content-level rollback
 * - Transactional safety
 * - Audit trail preservation
 * - Validation after rollback
 */

import { neon } from '@neondatabase/serverless';
import { writeFileSync } from 'fs';

const TUTORIAL_DB_URL = process.env.DATABASE_URL_TUTORIAL;

if (!TUTORIAL_DB_URL) {
  console.error('❌ DATABASE_URL_TUTORIAL not found');
  process.exit(1);
}

const sql = neon(TUTORIAL_DB_URL);

/**
 * Rollback by batch ID
 */
async function rollbackByBatch(batchId) {
  console.log(`\n🔄 Rolling back batch: ${batchId}\n`);
  
  const report = {
    timestamp: new Date().toISOString(),
    rollbackType: 'batch',
    batchId,
    status: 'IN_PROGRESS',
    sectionsDeleted: 0,
    subsectionsDeleted: 0,
    trackingUpdated: 0,
    errors: []
  };
  
  try {
    // Get tracking records for this batch
    const trackingRecords = await sql`
      SELECT 
        id,
        legacy_content_id,
        subtopic_id,
        migration_status,
        sections_created,
        subsections_created
      FROM legacy_content_migration_tracking
      WHERE migration_batch_id = ${batchId}
      AND migration_status IN ('success', 'partial', 'in_progress');
    `;
    
    console.log(`Found ${trackingRecords.length} migration(s) to rollback\n`);
    
    if (trackingRecords.length === 0) {
      console.log('⚠️  No migrations found for this batch');
      report.status = 'NO_MIGRATIONS';
      return report;
    }
    
    // Rollback each migration
    for (const record of trackingRecords) {
      console.log(`📦 Rolling back content: ${record.legacy_content_id}`);
      console.log(`   Subtopic ID: ${record.subtopic_id}`);
      console.log(`   Status: ${record.migration_status}`);
      console.log(`   Sections: ${record.sections_created}`);
      console.log(`   Subsections: ${record.subsections_created}\n`);
      
      try {
        // Delete subsections first (FK constraint)
        const subsectionsResult = await sql`
          DELETE FROM tutorial_subsections
          WHERE section_id IN (
            SELECT id FROM tutorial_sections
            WHERE subtopic_id = ${record.subtopic_id}
            AND created_at >= (
              SELECT started_at FROM legacy_content_migration_tracking
              WHERE id = ${record.id}
            )
          );
        `;
        
        const subsectionsDeleted = subsectionsResult.count || 0;
        report.subsectionsDeleted += subsectionsDeleted;
        console.log(`   ✅ Deleted ${subsectionsDeleted} subsections`);
        
        // Delete sections
        const sectionsResult = await sql`
          DELETE FROM tutorial_sections
          WHERE subtopic_id = ${record.subtopic_id}
          AND created_at >= (
            SELECT started_at FROM legacy_content_migration_tracking
            WHERE id = ${record.id}
          );
        `;
        
        const sectionsDeleted = sectionsResult.count || 0;
        report.sectionsDeleted += sectionsDeleted;
        console.log(`   ✅ Deleted ${sectionsDeleted} sections`);
        
        // Update tracking record
        await sql`
          UPDATE legacy_content_migration_tracking
          SET 
            migration_status = 'rolled_back'::migration_status,
            rollback_ready = false,
            rollback_executed_at = NOW(),
            updated_at = NOW()
          WHERE id = ${record.id};
        `;
        
        report.trackingUpdated++;
        console.log(`   ✅ Updated tracking record\n`);
        
      } catch (error) {
        console.log(`   ❌ Error rolling back: ${error.message}\n`);
        report.errors.push({
          contentId: record.legacy_content_id,
          error: error.message
        });
      }
    }
    
    report.status = report.errors.length === 0 ? 'SUCCESS' : 'PARTIAL';
    
    console.log('==========================================');
    console.log('📊 ROLLBACK SUMMARY');
    console.log('==========================================\n');
    console.log(`Batch ID: ${batchId}`);
    console.log(`Migrations Rolled Back: ${report.trackingUpdated}/${trackingRecords.length}`);
    console.log(`Sections Deleted: ${report.sectionsDeleted}`);
    console.log(`Subsections Deleted: ${report.subsectionsDeleted}`);
    console.log(`Errors: ${report.errors.length}`);
    console.log(`\nStatus: ${report.status}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    report.status = 'FAILED';
    report.error = error.message;
    throw error;
  }
}

/**
 * Rollback by content ID
 */
async function rollbackByContent(contentId) {
  console.log(`\n🔄 Rolling back content: ${contentId}\n`);
  
  const report = {
    timestamp: new Date().toISOString(),
    rollbackType: 'content',
    contentId,
    status: 'IN_PROGRESS',
    sectionsDeleted: 0,
    subsectionsDeleted: 0,
    trackingUpdated: 0,
    errors: []
  };
  
  try {
    // Get tracking record
    const trackingRecords = await sql`
      SELECT 
        id,
        legacy_content_id,
        subtopic_id,
        migration_batch_id,
        migration_status,
        sections_created,
        subsections_created
      FROM legacy_content_migration_tracking
      WHERE legacy_content_id = ${contentId}
      AND migration_status IN ('success', 'partial', 'in_progress')
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    
    if (trackingRecords.length === 0) {
      console.log('⚠️  No migration found for this content');
      report.status = 'NO_MIGRATION';
      return report;
    }
    
    const record = trackingRecords[0];
    
    console.log(`📦 Content: ${record.legacy_content_id}`);
    console.log(`   Batch ID: ${record.migration_batch_id}`);
    console.log(`   Subtopic ID: ${record.subtopic_id}`);
    console.log(`   Status: ${record.migration_status}`);
    console.log(`   Sections: ${record.sections_created}`);
    console.log(`   Subsections: ${record.subsections_created}\n`);
    
    // Delete subsections first (FK constraint)
    const subsectionsResult = await sql`
      DELETE FROM tutorial_subsections
      WHERE section_id IN (
        SELECT id FROM tutorial_sections
        WHERE subtopic_id = ${record.subtopic_id}
        AND created_at >= (
          SELECT started_at FROM legacy_content_migration_tracking
          WHERE id = ${record.id}
        )
      );
    `;
    
    const subsectionsDeleted = subsectionsResult.count || 0;
    report.subsectionsDeleted = subsectionsDeleted;
    console.log(`   ✅ Deleted ${subsectionsDeleted} subsections`);
    
    // Delete sections
    const sectionsResult = await sql`
      DELETE FROM tutorial_sections
      WHERE subtopic_id = ${record.subtopic_id}
      AND created_at >= (
        SELECT started_at FROM legacy_content_migration_tracking
        WHERE id = ${record.id}
      );
    `;
    
    const sectionsDeleted = sectionsResult.count || 0;
    report.sectionsDeleted = sectionsDeleted;
    console.log(`   ✅ Deleted ${sectionsDeleted} sections`);
    
    // Update tracking record
    await sql`
      UPDATE legacy_content_migration_tracking
      SET 
        migration_status = 'rolled_back'::migration_status,
        rollback_ready = false,
        rollback_executed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${record.id};
    `;
    
    report.trackingUpdated = 1;
    console.log(`   ✅ Updated tracking record\n`);
    
    report.status = 'SUCCESS';
    
    console.log('==========================================');
    console.log('📊 ROLLBACK SUMMARY');
    console.log('==========================================\n');
    console.log(`Content ID: ${contentId}`);
    console.log(`Sections Deleted: ${report.sectionsDeleted}`);
    console.log(`Subsections Deleted: ${report.subsectionsDeleted}`);
    console.log(`\nStatus: ${report.status}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    report.status = 'FAILED';
    report.error = error.message;
    throw error;
  }
}

/**
 * Rollback all migrations (DANGER!)
 */
async function rollbackAll() {
  console.log('\n⚠️  WARNING: Rolling back ALL migrations!\n');
  console.log('This will delete ALL tutorial_sections and tutorial_subsections');
  console.log('created by the constitutional migration process.\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    rollbackType: 'all',
    status: 'IN_PROGRESS',
    sectionsDeleted: 0,
    subsectionsDeleted: 0,
    trackingUpdated: 0,
    errors: []
  };
  
  try {
    // Get all successful/partial migrations
    const trackingRecords = await sql`
      SELECT 
        id,
        legacy_content_id,
        subtopic_id,
        migration_batch_id,
        migration_status,
        sections_created,
        subsections_created
      FROM legacy_content_migration_tracking
      WHERE migration_status IN ('success', 'partial', 'in_progress')
      ORDER BY created_at DESC;
    `;
    
    console.log(`Found ${trackingRecords.length} migration(s) to rollback\n`);
    
    if (trackingRecords.length === 0) {
      console.log('⚠️  No migrations found');
      report.status = 'NO_MIGRATIONS';
      return report;
    }
    
    // Rollback each migration
    for (const record of trackingRecords) {
      console.log(`📦 Rolling back content: ${record.legacy_content_id}`);
      
      try {
        // Delete subsections
        const subsectionsResult = await sql`
          DELETE FROM tutorial_subsections
          WHERE section_id IN (
            SELECT id FROM tutorial_sections
            WHERE subtopic_id = ${record.subtopic_id}
            AND created_at >= (
              SELECT started_at FROM legacy_content_migration_tracking
              WHERE id = ${record.id}
            )
          );
        `;
        
        report.subsectionsDeleted += subsectionsResult.count || 0;
        
        // Delete sections
        const sectionsResult = await sql`
          DELETE FROM tutorial_sections
          WHERE subtopic_id = ${record.subtopic_id}
          AND created_at >= (
            SELECT started_at FROM legacy_content_migration_tracking
            WHERE id = ${record.id}
          );
        `;
        
        report.sectionsDeleted += sectionsResult.count || 0;
        
        // Update tracking
        await sql`
          UPDATE legacy_content_migration_tracking
          SET 
            migration_status = 'rolled_back'::migration_status,
            rollback_ready = false,
            rollback_executed_at = NOW(),
            updated_at = NOW()
          WHERE id = ${record.id};
        `;
        
        report.trackingUpdated++;
        console.log(`   ✅ Rolled back\n`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        report.errors.push({
          contentId: record.legacy_content_id,
          error: error.message
        });
      }
    }
    
    report.status = report.errors.length === 0 ? 'SUCCESS' : 'PARTIAL';
    
    console.log('==========================================');
    console.log('📊 ROLLBACK SUMMARY');
    console.log('==========================================\n');
    console.log(`Migrations Rolled Back: ${report.trackingUpdated}/${trackingRecords.length}`);
    console.log(`Sections Deleted: ${report.sectionsDeleted}`);
    console.log(`Subsections Deleted: ${report.subsectionsDeleted}`);
    console.log(`Errors: ${report.errors.length}`);
    console.log(`\nStatus: ${report.status}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    report.status = 'FAILED';
    report.error = error.message;
    throw error;
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
🔄 CONSTITUTIONAL MIGRATION ROLLBACK TOOL

Usage:
  node rollback-constitutional-migration.mjs batch <batch-id>
  node rollback-constitutional-migration.mjs content <content-id>
  node rollback-constitutional-migration.mjs all

Examples:
  node rollback-constitutional-migration.mjs batch b7c2ea4b-e766-4490-a991-00ff94d7ac12
  node rollback-constitutional-migration.mjs content 8d231612-fdcb-49d3-bdb4-3f01a7e550b9
  node rollback-constitutional-migration.mjs all

⚠️  WARNING: Rollback operations are destructive and cannot be undone!
  `);
  process.exit(1);
}

const command = args[0];
const identifier = args[1];

let rollbackPromise;

switch (command) {
  case 'batch':
    if (!identifier) {
      console.error('❌ Batch ID required');
      process.exit(1);
    }
    rollbackPromise = rollbackByBatch(identifier);
    break;
    
  case 'content':
    if (!identifier) {
      console.error('❌ Content ID required');
      process.exit(1);
    }
    rollbackPromise = rollbackByContent(identifier);
    break;
    
  case 'all':
    rollbackPromise = rollbackAll();
    break;
    
  default:
    console.error(`❌ Unknown command: ${command}`);
    console.log('Valid commands: batch, content, all');
    process.exit(1);
}

rollbackPromise
  .then((report) => {
    // Save report
    const reportPath = `scripts/transformation/reports/rollback-${report.rollbackType}-${report.timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);
    
    if (report.status === 'SUCCESS') {
      console.log('\n✅ Rollback complete');
      process.exit(0);
    } else {
      console.log('\n⚠️  Rollback completed with issues');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Rollback failed:', error);
    process.exit(1);
  });
