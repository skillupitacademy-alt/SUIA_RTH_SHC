/**
 * Tutorial Rich Document - Main Document Type
 * This is the canonical structure stored in tutorial_sections.content (JSONB)
 */

import type { TutorialBlock } from './blocks';
import type { TutorialDocumentMetadata } from './metadata';
import type { CURRENT_SCHEMA_VERSION } from './constants';

/**
 * Tutorial Rich Document
 * 
 * This is the complete document structure that will be stored in:
 * tutorial_sections.content (JSONB column)
 * 
 * IMPORTANT: Do NOT duplicate tutorial_sections table columns here
 * (subtopic_id, section_type, difficulty, status, version, etc.)
 */
export interface TutorialDocument {
  /**
   * Schema version for this document structure
   * Allows future evolution of the document format
   * This is DIFFERENT from tutorial_sections.version (content revision)
   */
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;

  /**
   * Ordered array of blocks that make up the document
   */
  blocks: TutorialBlock[];

  /**
   * Optional document-level metadata
   * (not stored in tutorial_sections columns)
   */
  metadata?: TutorialDocumentMetadata;
}

/**
 * Type guard to check if an object is a TutorialDocument
 */
export function isTutorialDocument(obj: unknown): obj is TutorialDocument {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const doc = obj as Partial<TutorialDocument>;

  return (
    typeof doc.schemaVersion === 'number' &&
    Array.isArray(doc.blocks)
  );
}
