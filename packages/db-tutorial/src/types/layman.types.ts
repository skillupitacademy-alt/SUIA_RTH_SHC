/**
 * Layman Section Types
 * Phase 2B - Backend Service Layer
 * ---------------------------------
 * Type definitions for Layman section operations
 */

import type { TutorialSection, PromptTemplate, EducationalArchitecture, UIArchitecture } from '../schema';

/**
 * Layman Section with Related Architectures
 */
export interface LaymanSectionWithArchitectures extends TutorialSection {
  educationalArchitecture?: EducationalArchitecture;
  uiArchitecture?: UIArchitecture;
  promptTemplate?: PromptTemplate;
}

/**
 * Layman Subsection Content Structure
 */
export interface LaymanSubsectionContent {
  analogy?: string;
  beginnerBreakdown?: string;
  mentalModel?: string;
  useCase?: string;
  faq?: Array<{ question: string; answer: string }>;
  summary?: string;
  motivation?: string;
}

/**
 * Layman Section Content
 */
export interface LaymanSectionContent {
  subsections: LaymanSubsectionContent;
  metadata?: {
    estimatedReadTime?: number;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    prerequisites?: string[];
  };
}

/**
 * Layman Section Status Lifecycle
 */
export type LaymanSectionStatus =
  | 'draft'
  | 'generating'
  | 'validating'
  | 'pending_review'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'deploying'
  | 'deployed'
  | 'archived';

/**
 * Layman Section Create Input
 */
export interface LaymanSectionCreateInput {
  subtopicId: string;
  brandId: string;
  educationalArchitectureName?: string;
  uiArchitectureName?: string;
  content?: LaymanSectionContent;
  createdBy: string;
  difficulty?: 'simple' | 'mixed' | 'intermediate' | 'expert';
}

/**
 * Layman Section Update Input
 */
export interface LaymanSectionUpdateInput {
  content?: LaymanSectionContent;
  status?: LaymanSectionStatus;
  educationalArchitectureId?: string;
  uiArchitectureId?: string;
  updatedBy?: string;
}

/**
 * Layman Section Query Filters
 */
export interface LaymanSectionQueryFilters {
  subtopicId?: string;
  brandId?: string;
  status?: LaymanSectionStatus;
  educationalArchitectureId?: string;
  uiArchitectureId?: string;
}

/**
 * Layman Generation Request
 */
export interface LaymanGenerationRequest {
  subtopicId: string;
  topicName: string;
  subtopicName?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  brandId: string;
  educationalArchitectureName?: string;
  promptTemplateName?: string;
  requestedBy: string;
}

/**
 * Layman Validation Result
 */
export interface LaymanValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingSubsections?: string[];
  architectureIssues?: string[];
}

/**
 * Layman Publish Options
 */
export interface LaymanPublishOptions {
  publishedBy: string;
  deploymentType?: 'full' | 'staged' | 'canary';
  skipValidation?: boolean;
}

/**
 * Layman Archive Options
 */
export interface LaymanArchiveOptions {
  archivedBy: string;
  reason?: string;
}
