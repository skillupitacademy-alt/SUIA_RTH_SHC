/* istanbul ignore file */
/**
 * Modular Tutorial System Enums
 * Phase 1 P0 Foundation - Database Governance
 * Enhanced with Gap Remediation (GAP 2 & GAP 4)
 */

import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Section Types - 12 Universal Sections (IMMUTABLE CONSTITUTIONAL FRAMEWORK)
 */
export const sectionTypeEnum = pgEnum('section_type', [
  'overview',
  'notes',
  'layman',
  'visual',
  'real_life',
  'technical',
  'code',
  'practice',
  'assignment',
  'project',
  'quiz',
  'summary',
  'interview',
  'ai_tutor',
]);

/**
 * GAP 2: Subsection Taxonomy System
 * Granular subsection types for educational precision
 */
export const subsectionTypeEnum = pgEnum('subsection_type', [
  // Conceptual
  'definition',
  'concept',
  'syntax',
  'analogy',
  
  // Illustrative
  'example',
  'visual',
  'diagram',
  'animation',
  
  // Cautionary
  'pitfall',
  'antipattern',
  'gotcha',
  
  // Interactive
  'code',
  'exercise',
  'challenge',
  'sandbox',
  
  // Reference
  'checklist',
  'cheatsheet',
  'faq',
  'glossary',
  
  // Assessment
  'interview_question',
  'quiz_question',
  
  // Project
  'project_step',
  'project_milestone',
  'project_deliverable',
]);

/**
 * Section Status - Content Lifecycle
 */
export const sectionStatusEnum = pgEnum('section_status', [
  'draft',
  'generating',
  'validating',
  'pending_review',
  'in_review',
  'changes_requested',
  'approved',
  'deploying',
  'deployed',
  'archived',
]);

/**
 * Deployment Type
 */
export const deploymentTypeEnum = pgEnum('deployment_type', [
  'full',
  'staged',
  'canary',
  'ab_test',
  'dark_launch',
]);

/**
 * Orchestration Status
 */
export const orchestrationStatusEnum = pgEnum('orchestration_status', [
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled',
]);

/**
 * Job Status
 */
export const jobStatusEnum = pgEnum('job_status', [
  'pending',
  'running',
  'validating',
  'completed',
  'failed',
  'retrying',
]);

/**
 * Review Status
 */
export const reviewStatusEnum = pgEnum('review_status', [
  'pending_review',
  'in_review',
  'approved',
  'rejected',
  'changes_requested',
]);

/**
 * Priority Level
 */
export const priorityLevelEnum = pgEnum('priority_level', [
  'low',
  'normal',
  'high',
  'urgent',
]);

/**
 * GAP 4: Brand Identifier Enum
 * Multi-brand partitioning support
 */
export const brandEnum = pgEnum('brand', [
  'realtutorialhub',
  'skillup',
  'skillhubcore', // Central Content Factory
  'shared', // For shared/universal content
]);

/**
 * GAP 4: Brand Visibility Rules
 */
export const brandVisibilityEnum = pgEnum('brand_visibility', [
  'brand_exclusive',  // Only visible to specific brand
  'shared_visible',   // Visible across brands
  'white_label',      // Customizable per brand
]);
