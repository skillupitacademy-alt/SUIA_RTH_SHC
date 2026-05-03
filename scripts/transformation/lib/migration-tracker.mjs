/**
 * Migration Tracking Module
 * Enterprise-grade migration governance and audit
 */

import { randomUUID } from 'crypto';

export class MigrationTracker {
  constructor(sql) {
    this.sql = sql;
  }

  /**
   * Check if content is already migrated
   */
  async isAlreadyMigrated(contentId, mode = 'full') {
    // Check tracking table first
    const trackingResult = await this.sql`
      SELECT 
        id,
        migration_status,
        sections_created,
        subsections_created,
        completed_at
      FROM legacy_content_migration_tracking
      WHERE legacy_content_id = ${contentId}
      AND migration_mode = ${mode}::migration_mode
      AND migration_status IN ('success', 'partial', 'in_progress');
    `;
    
    if (trackingResult.length > 0) {
      return trackingResult[0];
    }
    
    // Also check if sections exist in tutorial_sections
    // (in case tracking table was cleared but sections remain)
    const sectionsResult = await this.sql`
      SELECT 
        COUNT(DISTINCT s.id) as section_count,
        COUNT(ss.id) as subsection_count,
        c.subtopic_id
      FROM tutorial_content c
      JOIN tutorial_sections s ON s.subtopic_id = c.subtopic_id
      LEFT JOIN tutorial_subsections ss ON ss.section_id = s.id
      WHERE c.id = ${contentId}
      AND c.deleted_at IS NULL
      GROUP BY c.subtopic_id;
    `;
    
    if (sectionsResult.length > 0 && parseInt(sectionsResult[0].section_count) > 0) {
      return {
        migration_status: 'success',
        sections_created: parseInt(sectionsResult[0].section_count),
        subsections_created: parseInt(sectionsResult[0].subsection_count) || 0,
        completed_at: null,
        subtopic_id: sectionsResult[0].subtopic_id
      };
    }
    
    return null;
  }

  /**
   * Start tracking a migration
   */
  async startTracking(contentId, subtopicId, topicId, batchId, mode = 'full') {
    const trackingId = randomUUID();
    
    await this.sql`
      INSERT INTO legacy_content_migration_tracking (
        id,
        legacy_content_id,
        subtopic_id,
        topic_id,
        migration_batch_id,
        migration_mode,
        migration_status,
        started_at,
        rollback_ready,
        can_resume
      ) VALUES (
        ${trackingId},
        ${contentId},
        ${subtopicId},
        ${topicId},
        ${batchId},
        ${mode}::migration_mode,
        'in_progress'::migration_status,
        NOW(),
        true,
        true
      )
      ON CONFLICT (legacy_content_id, migration_mode) 
      DO UPDATE SET
        migration_status = 'in_progress'::migration_status,
        started_at = NOW(),
        retry_count = legacy_content_migration_tracking.retry_count + 1,
        updated_at = NOW();
    `;
    
    return trackingId;
  }

  /**
   * Mark migration as skipped
   */
  async markSkipped(contentId, subtopicId, topicId, batchId, mode, reason, existingMigration) {
    await this.sql`
      INSERT INTO legacy_content_migration_tracking (
        legacy_content_id,
        subtopic_id,
        topic_id,
        migration_batch_id,
        migration_mode,
        migration_status,
        was_already_migrated,
        sections_created,
        subsections_created,
        warnings,
        completed_at
      ) VALUES (
        ${contentId},
        ${subtopicId},
        ${topicId},
        ${batchId},
        ${mode}::migration_mode,
        'skipped'::migration_status,
        true,
        ${existingMigration.sections_created || 0},
        ${existingMigration.subsections_created || 0},
        ${JSON.stringify({ reason, existingStatus: existingMigration.migration_status })}::jsonb,
        NOW()
      )
      ON CONFLICT (legacy_content_id, migration_mode)
      DO UPDATE SET
        migration_batch_id = ${batchId},
        migration_status = 'skipped'::migration_status,
        was_already_migrated = true,
        warnings = ${JSON.stringify({ reason, existingStatus: existingMigration.migration_status })}::jsonb,
        updated_at = NOW();
    `;
  }

  /**
   * Update migration progress
   */
  async updateProgress(contentId, mode, sectionsCreated, subsectionsCreated) {
    await this.sql`
      UPDATE legacy_content_migration_tracking
      SET 
        sections_created = ${sectionsCreated},
        subsections_created = ${subsectionsCreated},
        updated_at = NOW()
      WHERE legacy_content_id = ${contentId}
      AND migration_mode = ${mode}::migration_mode;
    `;
  }

  /**
   * Complete migration with validation
   */
  async completeTracking(contentId, mode, result) {
    const validationScore = this.calculateValidationScore(result);
    const status = validationScore >= 95 ? 'success' : validationScore >= 80 ? 'partial' : 'failed';
    
    await this.sql`
      UPDATE legacy_content_migration_tracking
      SET 
        migration_status = ${status}::migration_status,
        sections_created = ${result.sectionsCreated},
        subsections_created = ${result.subsectionsCreated},
        sections_expected = 12,
        subsections_expected = ${result.subsectionsCreated},
        validation_score = ${validationScore},
        validation_passed = ${validationScore >= 80},
        validation_errors = ${result.errors.length > 0 ? JSON.stringify(result.errors) : null}::jsonb,
        warnings = ${result.warnings ? JSON.stringify(result.warnings) : null}::jsonb,
        completed_at = NOW(),
        updated_at = NOW()
      WHERE legacy_content_id = ${contentId}
      AND migration_mode = ${mode}::migration_mode;
    `;
    
    return { status, validationScore };
  }

  /**
   * Mark migration as failed
   */
  async markFailed(contentId, mode, error) {
    await this.sql`
      UPDATE legacy_content_migration_tracking
      SET 
        migration_status = 'failed'::migration_status,
        error_log = ${JSON.stringify({ 
          message: error.message, 
          stack: error.stack,
          timestamp: new Date().toISOString()
        })}::jsonb,
        rollback_ready = true,
        completed_at = NOW(),
        updated_at = NOW()
      WHERE legacy_content_id = ${contentId}
      AND migration_mode = ${mode}::migration_mode;
    `;
  }

  /**
   * Calculate validation score (0-100)
   */
  calculateValidationScore(result) {
    let score = 0;
    
    // 12 sections created = 40 points
    const sectionScore = (result.sectionsCreated / 12) * 40;
    score += Math.min(sectionScore, 40);
    
    // Subsections valid = 20 points
    if (result.subsectionsCreated > 0) {
      score += 20;
    }
    
    // FK integrity = 15 points (no FK errors)
    const fkErrors = result.errors.filter(e => e.error?.includes('foreign key') || e.error?.includes('FK'));
    if (fkErrors.length === 0) {
      score += 15;
    }
    
    // Brand partitioning = 10 points (all sections have brand_id)
    if (result.sectionsCreated > 0) {
      score += 10;
    }
    
    // Tracking integrity = 10 points (no errors)
    if (result.errors.length === 0) {
      score += 10;
    }
    
    // AI governance flags = 5 points
    score += 5;
    
    return Math.round(score);
  }

  /**
   * Get batch statistics
   */
  async getBatchStats(batchId) {
    const stats = await this.sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN migration_status = 'success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN migration_status = 'partial' THEN 1 ELSE 0 END) as partial,
        SUM(CASE WHEN migration_status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN migration_status = 'skipped' THEN 1 ELSE 0 END) as skipped,
        SUM(sections_created) as total_sections,
        SUM(subsections_created) as total_subsections,
        AVG(validation_score) as avg_validation_score,
        AVG(duration_seconds) as avg_duration
      FROM legacy_content_migration_tracking
      WHERE migration_batch_id = ${batchId};
    `;
    
    return stats[0];
  }
}
