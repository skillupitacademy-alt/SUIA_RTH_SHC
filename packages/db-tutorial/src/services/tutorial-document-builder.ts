/**
 * Tutorial Document Builder
 * Phase 1G: Composes canonical blocks into TutorialDocument
 * 
 * ARCHITECTURE:
 * - Takes one or more canonical blocks
 * - Wraps in TutorialDocument structure (schemaVersion + blocks)
 * - Does NOT add hierarchy (hierarchy stored in tutorial_sections.subtopic_id column)
 * - Does NOT add brand/theme (runtime resolution only)
 * 
 * STORAGE MODEL:
 * tutorial_sections table:
 *   - subtopic_id (UUID column) ← hierarchy reference
 *   - content (JSONB column) ← TutorialDocument { schemaVersion, blocks, metadata? }
 */

import type { TutorialDocument, TutorialBlock } from '@quiz/types';
import { CURRENT_SCHEMA_VERSION } from '@quiz/types';

/**
 * Build Tutorial Document
 * 
 * Composes canonical blocks into a TutorialDocument structure
 * 
 * @param blocks - Array of canonical blocks (DefinitionD1Block, etc.)
 * @param metadata - Optional document-level metadata
 * @returns TutorialDocument ready for JSONB storage
 */
export function buildTutorialDocument(
  blocks: TutorialBlock[],
  metadata?: TutorialDocument['metadata']
): TutorialDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    blocks,
    ...(metadata && { metadata }),
  };
}
