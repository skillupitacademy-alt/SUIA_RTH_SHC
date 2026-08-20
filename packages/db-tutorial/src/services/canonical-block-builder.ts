/**
 * Canonical Block Builder
 * Phase 1G: Transforms validated AI author content into canonical blocks
 * 
 * ARCHITECTURE:
 * - Takes validated author content (already passed Zod validation)
 * - Adds system-controlled metadata (id, type, version)
 * - Returns canonical block ready for document composition
 * 
 * CRITICAL BOUNDARIES:
 * - Block does NOT contain hierarchy (subtopicId stored in table column)
 * - Block does NOT contain brand/theme (runtime resolution only)
 * - Block does NOT contain schemaVersion (document-level metadata)
 */

import type {
  DefinitionD1AuthorContent,
  DefinitionD1Block,
  CodeC1AuthorContent,
  CodeC1Block,
} from '@quiz/types';
import { randomUUID } from 'crypto';

/**
 * Build Canonical Definition D1 Block
 * 
 * Transforms validated AI author content into canonical block format
 * 
 * @param authorContent - Validated DefinitionD1AuthorContent (already passed Zod)
 * @param blockId - Optional UUID; if not provided, system generates one
 * @returns DefinitionD1Block with system metadata
 */
export function buildCanonicalDefinitionD1Block(
  authorContent: DefinitionD1AuthorContent,
  blockId?: string
): DefinitionD1Block {
  return {
    id: blockId || randomUUID(),
    type: 'definition',
    version: 'D1',
    content: authorContent,
  };
}

/**
 * Build Canonical Code C1 Block
 * Phase 2C: Code C1 - Basic Syntax
 * 
 * Transforms validated AI author content into canonical block format
 * 
 * SECURITY: Only extracts { page } from authorContent to prevent field injection
 * 
 * @param authorContent - Validated CodeC1AuthorContent (already passed Zod)
 * @param blockId - Optional UUID; if not provided, system generates one
 * @returns CodeC1Block with system metadata
 */
export function buildCanonicalCodeC1Block(
  authorContent: CodeC1AuthorContent,
  blockId?: string
): CodeC1Block {
  return {
    id: blockId || randomUUID(),
    type: 'code',
    version: 'C1',
    content: {
      page: authorContent.page,
    },
  };
}
