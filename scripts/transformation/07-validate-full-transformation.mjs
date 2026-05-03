#!/usr/bin/env node
/**
 * DELIVERABLE 2 - PHASE 2A: VALIDATE FULL TRANSFORMATION
 * Enterprise-Grade Validation & Quality Assurance
 * 
 * Validates:
 * - All content migrated
 * - 12 sections per content item
 * - Subsection integrity
 * - FK relationships
 * - Brand partitioning
 * - AI governance flags
 * - Tracking integrity
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
 * Validate transformation completeness
 */
async function validateTransformation() {
  console.log('🔍 DELIVERABLE 2 - PHASE 2A: TRANSFORMATION VALIDATION');
  console.log('==========================================\n');
  
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    deliverable: 'DELIVERABLE_2',
    phase: 'PHASE_2A_VALIDATION',
    status: 'IN_PROGRESS',
    validations: [],
    summary: {},
    score: 0
  };
  
  let totalScore = 0;
  const maxScore = 100;
  
  try {
    // VALIDATION 1: Content Migration Completeness (15 points)
    console.log('📊 Validation 1: Content Migration Completeness...');
    const contentStats = await sql`
      SELECT 
        COUNT(DISTINCT c.id) as total_content,
        COUNT(DISTINCT t.legacy_content_id) as migrated_content,
        COUNT(DISTINCT CASE WHEN t.migration_status = 'success' THEN t.legacy_content_id END) as successful_migrations,
        COUNT(DISTINCT CASE WHEN t.migration_status = 'partial' THEN t.legacy_content_id END) as partial_migrations,
        COUNT(DISTINCT CASE WHEN t.migration_status = 'failed' THEN t.legacy_content_id END) as failed_migrations
      FROM tutorial_content c
      LEFT JOIN legacy_content_migration_tracking t ON c.id = t.legacy_content_id
      WHERE c.deleted_at IS NULL;
    `;
    
    const contentCompletion = contentStats[0];
    const migrationRate = (parseInt(contentCompletion.migrated_content) / parseInt(contentCompletion.total_content)) * 100;
    const successRate = (parseInt(contentCompletion.successful_migrations) / parseInt(contentCompletion.total_content)) * 100;
    
    const validation1 = {
      name: 'Content Migration Completeness',
      maxPoints: 15,
      points: 0,
      status: 'PENDING',
      details: {
        totalContent: parseInt(contentCompletion.total_content),
        migratedContent: parseInt(contentCompletion.migrated_content),
        successfulMigrations: parseInt(contentCompletion.successful_migrations),
        partialMigrations: parseInt(contentCompletion.partial_migrations),
        failedMigrations: parseInt(contentCompletion.failed_migrations),
        migrationRate: Math.round(migrationRate),
        successRate: Math.round(successRate)
      }
    };
    
    if (migrationRate === 100 && successRate === 100) {
      validation1.points = 15;
      validation1.status = 'PASS';
    } else if (migrationRate >= 80) {
      validation1.points = 10;
      validation1.status = 'PARTIAL';
    } else {
      validation1.points = 0;
      validation1.status = 'FAIL';
    }
    
    totalScore += validation1.points;
    report.validations.push(validation1);
    
    console.log(`   Total Content: ${validation1.details.totalContent}`);
    console.log(`   Migrated: ${validation1.details.migratedContent} (${validation1.details.migrationRate}%)`);
    console.log(`   Successful: ${validation1.details.successfulMigrations} (${validation1.details.successRate}%)`);
    console.log(`   Status: ${validation1.status} (${validation1.points}/${validation1.maxPoints} points)\n`);
    
    // VALIDATION 2: Constitutional Section Coverage (20 points)
    console.log('📊 Validation 2: Constitutional Section Coverage...');
    const sectionStats = await sql`
      SELECT 
        COUNT(DISTINCT s.id) as total_sections,
        COUNT(DISTINCT CASE WHEN s.section_type = 'layman' THEN s.subtopic_id END) as has_layman,
        COUNT(DISTINCT CASE WHEN s.section_type = 'notes' THEN s.subtopic_id END) as has_notes,
        COUNT(DISTINCT CASE WHEN s.section_type = 'technical' THEN s.subtopic_id END) as has_technical,
        COUNT(DISTINCT CASE WHEN s.section_type = 'code' THEN s.subtopic_id END) as has_code,
        COUNT(DISTINCT CASE WHEN s.section_type = 'real_life' THEN s.subtopic_id END) as has_real_life,
        COUNT(DISTINCT CASE WHEN s.section_type = 'visual' THEN s.subtopic_id END) as has_visual,
        COUNT(DISTINCT CASE WHEN s.section_type = 'practice' THEN s.subtopic_id END) as has_practice,
        COUNT(DISTINCT CASE WHEN s.section_type = 'assignment' THEN s.subtopic_id END) as has_assignment,
        COUNT(DISTINCT CASE WHEN s.section_type = 'project' THEN s.subtopic_id END) as has_project,
        COUNT(DISTINCT CASE WHEN s.section_type = 'quiz' THEN s.subtopic_id END) as has_quiz,
        COUNT(DISTINCT CASE WHEN s.section_type = 'summary' THEN s.subtopic_id END) as has_summary,
        COUNT(DISTINCT CASE WHEN s.section_type = 'interview' THEN s.subtopic_id END) as has_interview,
        COUNT(DISTINCT s.subtopic_id) as subtopics_with_sections
      FROM tutorial_sections s;
    `;
    
    const sectionCoverage = sectionStats[0];
    
    // Get unique subtopics (CORRECT: subtopics, not content items)
    const uniqueSubtopicStats = await sql`
      SELECT COUNT(DISTINCT subtopic_id) as unique_subtopics
      FROM tutorial_content
      WHERE deleted_at IS NULL;
    `;
    const expectedSubtopics = parseInt(uniqueSubtopicStats[0].unique_subtopics);
    
    const sectionTypes = [
      'layman', 'notes', 'technical', 'code', 'real_life', 'visual',
      'practice', 'assignment', 'project', 'quiz', 'summary', 'interview'
    ];
    
    const sectionCoverageRate = sectionTypes.reduce((sum, type) => {
      return sum + (parseInt(sectionCoverage[`has_${type}`]) / expectedSubtopics);
    }, 0) / 12 * 100;
    
    const validation2 = {
      name: 'Constitutional Section Coverage',
      maxPoints: 20,
      points: 0,
      status: 'PENDING',
      details: {
        totalSections: parseInt(sectionCoverage.total_sections),
        subtopicsWithSections: parseInt(sectionCoverage.subtopics_with_sections),
        expectedSubtopics,
        sectionCoverageRate: Math.round(sectionCoverageRate),
        sectionTypeDistribution: {}
      }
    };
    
    sectionTypes.forEach(type => {
      validation2.details.sectionTypeDistribution[type] = parseInt(sectionCoverage[`has_${type}`]);
    });
    
    if (sectionCoverageRate >= 95) {
      validation2.points = 20;
      validation2.status = 'PASS';
    } else if (sectionCoverageRate >= 80) {
      validation2.points = 15;
      validation2.status = 'PARTIAL';
    } else {
      validation2.points = 0;
      validation2.status = 'FAIL';
    }
    
    totalScore += validation2.points;
    report.validations.push(validation2);
    
    console.log(`   Total Sections: ${validation2.details.totalSections}`);
    console.log(`   Subtopics with Sections: ${validation2.details.subtopicsWithSections}/${expectedSubtopics}`);
    console.log(`   Coverage Rate: ${validation2.details.sectionCoverageRate}%`);
    console.log(`   Status: ${validation2.status} (${validation2.points}/${validation2.maxPoints} points)\n`);
    
    // VALIDATION 3: Subsection Integrity (15 points)
    console.log('📊 Validation 3: Subsection Integrity...');
    const subsectionStats = await sql`
      SELECT 
        COUNT(*) as total_subsections,
        COUNT(DISTINCT section_id) as sections_with_subsections,
        AVG(subsection_count) as avg_subsections_per_section
      FROM (
        SELECT 
          section_id,
          COUNT(*) as subsection_count
        FROM tutorial_subsections
        GROUP BY section_id
      ) sub;
    `;
    
    const subsectionIntegrity = subsectionStats[0];
    const sectionsWithSubsections = parseInt(subsectionIntegrity.sections_with_subsections);
    const totalSections = parseInt(sectionCoverage.total_sections);
    const subsectionRate = (sectionsWithSubsections / totalSections) * 100;
    
    const validation3 = {
      name: 'Subsection Integrity',
      maxPoints: 15,
      points: 0,
      status: 'PENDING',
      details: {
        totalSubsections: parseInt(subsectionIntegrity.total_subsections),
        sectionsWithSubsections,
        totalSections,
        subsectionRate: Math.round(subsectionRate),
        avgSubsectionsPerSection: parseFloat(subsectionIntegrity.avg_subsections_per_section).toFixed(2)
      }
    };
    
    if (subsectionRate === 100) {
      validation3.points = 15;
      validation3.status = 'PASS';
    } else if (subsectionRate >= 90) {
      validation3.points = 10;
      validation3.status = 'PARTIAL';
    } else {
      validation3.points = 0;
      validation3.status = 'FAIL';
    }
    
    totalScore += validation3.points;
    report.validations.push(validation3);
    
    console.log(`   Total Subsections: ${validation3.details.totalSubsections}`);
    console.log(`   Sections with Subsections: ${sectionsWithSubsections}/${totalSections} (${validation3.details.subsectionRate}%)`);
    console.log(`   Avg Subsections/Section: ${validation3.details.avgSubsectionsPerSection}`);
    console.log(`   Status: ${validation3.status} (${validation3.points}/${validation3.maxPoints} points)\n`);
    
    // VALIDATION 4: FK Relationship Integrity (15 points)
    console.log('📊 Validation 4: FK Relationship Integrity...');
    const fkStats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM tutorial_sections WHERE subtopic_id NOT IN (SELECT id FROM tutorial_subtopics)) as orphaned_sections,
        (SELECT COUNT(*) FROM tutorial_subsections WHERE section_id NOT IN (SELECT id FROM tutorial_sections)) as orphaned_subsections,
        (SELECT COUNT(*) FROM legacy_content_migration_tracking WHERE subtopic_id NOT IN (SELECT id FROM tutorial_subtopics)) as orphaned_tracking
      ;
    `;
    
    const fkIntegrity = fkStats[0];
    const totalOrphans = parseInt(fkIntegrity.orphaned_sections) + 
                        parseInt(fkIntegrity.orphaned_subsections) + 
                        parseInt(fkIntegrity.orphaned_tracking);
    
    const validation4 = {
      name: 'FK Relationship Integrity',
      maxPoints: 15,
      points: 0,
      status: 'PENDING',
      details: {
        orphanedSections: parseInt(fkIntegrity.orphaned_sections),
        orphanedSubsections: parseInt(fkIntegrity.orphaned_subsections),
        orphanedTracking: parseInt(fkIntegrity.orphaned_tracking),
        totalOrphans
      }
    };
    
    if (totalOrphans === 0) {
      validation4.points = 15;
      validation4.status = 'PASS';
    } else {
      validation4.points = 0;
      validation4.status = 'FAIL';
    }
    
    totalScore += validation4.points;
    report.validations.push(validation4);
    
    console.log(`   Orphaned Sections: ${validation4.details.orphanedSections}`);
    console.log(`   Orphaned Subsections: ${validation4.details.orphanedSubsections}`);
    console.log(`   Orphaned Tracking: ${validation4.details.orphanedTracking}`);
    console.log(`   Total Orphans: ${totalOrphans}`);
    console.log(`   Status: ${validation4.status} (${validation4.points}/${validation4.maxPoints} points)\n`);
    
    // VALIDATION 5: Brand Partitioning (10 points)
    console.log('📊 Validation 5: Brand Partitioning...');
    const brandStats = await sql`
      SELECT 
        COUNT(*) as total_sections,
        COUNT(CASE WHEN brand_id IS NULL THEN 1 END) as sections_without_brand,
        COUNT(CASE WHEN brand_visibility IS NULL THEN 1 END) as sections_without_visibility
      FROM tutorial_sections;
    `;
    
    const brandIntegrity = brandStats[0];
    const sectionsWithoutBrand = parseInt(brandIntegrity.sections_without_brand);
    const sectionsWithoutVisibility = parseInt(brandIntegrity.sections_without_visibility);
    
    const validation5 = {
      name: 'Brand Partitioning',
      maxPoints: 10,
      points: 0,
      status: 'PENDING',
      details: {
        totalSections: parseInt(brandIntegrity.total_sections),
        sectionsWithoutBrand,
        sectionsWithoutVisibility
      }
    };
    
    if (sectionsWithoutBrand === 0 && sectionsWithoutVisibility === 0) {
      validation5.points = 10;
      validation5.status = 'PASS';
    } else {
      validation5.points = 0;
      validation5.status = 'FAIL';
    }
    
    totalScore += validation5.points;
    report.validations.push(validation5);
    
    console.log(`   Total Sections: ${validation5.details.totalSections}`);
    console.log(`   Sections without Brand: ${sectionsWithoutBrand}`);
    console.log(`   Sections without Visibility: ${sectionsWithoutVisibility}`);
    console.log(`   Status: ${validation5.status} (${validation5.points}/${validation5.maxPoints} points)\n`);
    
    // VALIDATION 6: AI Governance Flags (10 points)
    console.log('📊 Validation 6: AI Governance Flags...');
    const aiStats = await sql`
      SELECT 
        COUNT(*) as total_sections,
        COUNT(CASE WHEN generated_by_ai IS NULL THEN 1 END) as sections_without_ai_flag,
        COUNT(CASE WHEN generated_by_ai = true THEN 1 END) as ai_generated_sections
      FROM tutorial_sections;
    `;
    
    const aiGovernance = aiStats[0];
    const sectionsWithoutAiFlag = parseInt(aiGovernance.sections_without_ai_flag);
    
    const validation6 = {
      name: 'AI Governance Flags',
      maxPoints: 10,
      points: 0,
      status: 'PENDING',
      details: {
        totalSections: parseInt(aiGovernance.total_sections),
        sectionsWithoutAiFlag,
        aiGeneratedSections: parseInt(aiGovernance.ai_generated_sections)
      }
    };
    
    if (sectionsWithoutAiFlag === 0) {
      validation6.points = 10;
      validation6.status = 'PASS';
    } else {
      validation6.points = 0;
      validation6.status = 'FAIL';
    }
    
    totalScore += validation6.points;
    report.validations.push(validation6);
    
    console.log(`   Total Sections: ${validation6.details.totalSections}`);
    console.log(`   Sections without AI Flag: ${sectionsWithoutAiFlag}`);
    console.log(`   AI Generated Sections: ${validation6.details.aiGeneratedSections}`);
    console.log(`   Status: ${validation6.status} (${validation6.points}/${validation6.maxPoints} points)\n`);
    
    // VALIDATION 7: Tracking Integrity (10 points)
    console.log('📊 Validation 7: Tracking Integrity...');
    const trackingStats = await sql`
      SELECT 
        COUNT(*) as total_tracking,
        COUNT(CASE WHEN migration_status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN migration_status = 'partial' THEN 1 END) as partial,
        COUNT(CASE WHEN migration_status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN validation_score >= 95 THEN 1 END) as high_quality,
        AVG(validation_score) as avg_validation_score
      FROM legacy_content_migration_tracking
      WHERE migration_status IN ('success', 'partial', 'failed');
    `;
    
    const trackingIntegrity = trackingStats[0];
    const avgValidationScore = parseFloat(trackingIntegrity.avg_validation_score) || 0;
    
    const validation7 = {
      name: 'Tracking Integrity',
      maxPoints: 10,
      points: 0,
      status: 'PENDING',
      details: {
        totalTracking: parseInt(trackingIntegrity.total_tracking),
        successful: parseInt(trackingIntegrity.successful),
        partial: parseInt(trackingIntegrity.partial),
        failed: parseInt(trackingIntegrity.failed),
        highQuality: parseInt(trackingIntegrity.high_quality),
        avgValidationScore: Math.round(avgValidationScore)
      }
    };
    
    if (avgValidationScore >= 95) {
      validation7.points = 10;
      validation7.status = 'PASS';
    } else if (avgValidationScore >= 80) {
      validation7.points = 7;
      validation7.status = 'PARTIAL';
    } else {
      validation7.points = 0;
      validation7.status = 'FAIL';
    }
    
    totalScore += validation7.points;
    report.validations.push(validation7);
    
    console.log(`   Total Tracking Records: ${validation7.details.totalTracking}`);
    console.log(`   Successful: ${validation7.details.successful}`);
    console.log(`   Partial: ${validation7.details.partial}`);
    console.log(`   Failed: ${validation7.details.failed}`);
    console.log(`   Avg Validation Score: ${validation7.details.avgValidationScore}/100`);
    console.log(`   Status: ${validation7.status} (${validation7.points}/${validation7.maxPoints} points)\n`);
    
    // VALIDATION 8: Data Preservation (5 points)
    console.log('📊 Validation 8: Data Preservation...');
    const preservationStats = await sql`
      SELECT 
        COUNT(*) as total_legacy_content,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_content
      FROM tutorial_content;
    `;
    
    const preservation = preservationStats[0];
    const deletedContent = parseInt(preservation.deleted_content);
    
    const validation8 = {
      name: 'Data Preservation',
      maxPoints: 5,
      points: 0,
      status: 'PENDING',
      details: {
        totalLegacyContent: parseInt(preservation.total_legacy_content),
        deletedContent
      }
    };
    
    if (deletedContent === 0) {
      validation8.points = 5;
      validation8.status = 'PASS';
    } else {
      validation8.points = 0;
      validation8.status = 'FAIL';
    }
    
    totalScore += validation8.points;
    report.validations.push(validation8);
    
    console.log(`   Total Legacy Content: ${validation8.details.totalLegacyContent}`);
    console.log(`   Deleted Content: ${deletedContent}`);
    console.log(`   Status: ${validation8.status} (${validation8.points}/${validation8.maxPoints} points)\n`);
    
    // Calculate final score and status
    report.score = totalScore;
    report.maxScore = maxScore;
    report.percentage = Math.round((totalScore / maxScore) * 100);
    
    if (report.percentage >= 95) {
      report.status = 'EXCELLENT';
      report.certification = 'PRODUCTION_READY';
    } else if (report.percentage >= 80) {
      report.status = 'GOOD';
      report.certification = 'CONDITIONAL_GO';
    } else if (report.percentage >= 60) {
      report.status = 'FAIR';
      report.certification = 'NEEDS_IMPROVEMENT';
    } else {
      report.status = 'POOR';
      report.certification = 'NOT_READY';
    }
    
    report.summary = {
      totalValidations: report.validations.length,
      passed: report.validations.filter(v => v.status === 'PASS').length,
      partial: report.validations.filter(v => v.status === 'PARTIAL').length,
      failed: report.validations.filter(v => v.status === 'FAIL').length,
      score: totalScore,
      maxScore,
      percentage: report.percentage,
      status: report.status,
      certification: report.certification
    };
    
    console.log('==========================================');
    console.log('📊 VALIDATION SUMMARY');
    console.log('==========================================\n');
    console.log(`Total Validations: ${report.summary.totalValidations}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Partial: ${report.summary.partial}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`\nScore: ${report.score}/${report.maxScore} (${report.percentage}%)`);
    console.log(`Status: ${report.status}`);
    console.log(`Certification: ${report.certification}`);
    
    // Save report
    const reportPath = `scripts/transformation/reports/validation-full-transformation-${timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    report.status = 'FAILED';
    report.error = error.message;
    
    const reportPath = `scripts/transformation/reports/validation-full-transformation-${timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    throw error;
  }
}

// Execute
validateTransformation()
  .then((report) => {
    if (report.certification === 'PRODUCTION_READY' || report.certification === 'CONDITIONAL_GO') {
      console.log('\n✅ Validation complete - System ready');
      process.exit(0);
    } else {
      console.log('\n⚠️  Validation complete - Issues found');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  });
