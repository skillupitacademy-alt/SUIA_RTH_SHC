/**
 * Tutorial Rich Document - Metadata
 * Document-level metadata (separate from tutorial_sections columns)
 */

/**
 * Document-level metadata
 * 
 * IMPORTANT: Do NOT duplicate fields that already exist as columns
 * in the tutorial_sections table (difficulty, section_type, etc.)
 */
export interface TutorialDocumentMetadata {
  /**
   * Estimated reading time in minutes
   */
  estimatedReadTime?: number;

  /**
   * Learning objectives for this content
   */
  learningObjectives?: string[];

  /**
   * Tags for content categorization
   */
  tags?: string[];

  /**
   * Prerequisites (references to other subtopics)
   */
  prerequisites?: string[];

  /**
   * Complexity level (1-10 scale)
   * Different from difficulty tier (simple/mixed/intermediate/expert)
   */
  complexityScore?: number;

  /**
   * Whether this content includes interactive elements
   */
  isInteractive?: boolean;

  /**
   * Target audience hints
   */
  audience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  /**
   * Custom metadata for specific use cases
   */
  custom?: Record<string, unknown>;
}
