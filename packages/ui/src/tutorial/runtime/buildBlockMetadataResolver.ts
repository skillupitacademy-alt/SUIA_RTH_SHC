/**
 * Block Metadata Resolver Builder - Phase 2B.18
 * 
 * PURPOSE:
 * Creates a block metadata resolver function from a TutorialDocument.
 * Used by InstructionalBlockCompletionOrchestrator to access block metadata.
 * 
 * ARCHITECTURE:
 * - Pure function (creates resolver closure)
 * - Maps block identity (blockId + blockVersion) to metadata (progressRole + expectedTimeSec)
 * - Uses Map for O(1) lookup performance
 * - Tolerant to missing fields (returns null if block not found)
 */

import type { TutorialBlock } from '@quiz/types';
import type { InstructionalBlockMetadata } from './instructionalBlockCompletion';

/**
 * Block metadata fragment required for completion evaluation
 */
export type BlockMetadataFragment = Pick<
  InstructionalBlockMetadata,
  'progressRole' | 'expectedTimeSec'
>;

/**
 * Block metadata resolver function type
 */
export type BlockMetadataResolver = (
  blockId: string,
  blockVersion: string
) => BlockMetadataFragment | null;

/**
 * Build a block metadata resolver from tutorial blocks
 * 
 * Creates a closure that provides O(1) lookup of block metadata
 * by (blockId + blockVersion) identity.
 * 
 * USAGE:
 * ```tsx
 * const tutorialDocument = await fetchTutorial();
 * const resolver = buildBlockMetadataResolver(tutorialDocument.blocks);
 * 
 * const metadata = resolver('block-uuid', 'D1');
 * // { progressRole: 'instructional', expectedTimeSec: 180 }
 * ```
 * 
 * TOLERANCE:
 * - Missing progressRole: defaults to 'instructional' (Phase 2B.13 contract)
 * - Missing expectedTimeSec: returns undefined (automatic completion disabled)
 * - Unknown blockId/blockVersion: returns null
 * 
 * @param blocks Array of blocks from TutorialDocument.blocks
 * @returns Resolver function for block metadata lookup
 */
export function buildBlockMetadataResolver(
  blocks: TutorialBlock[]
): BlockMetadataResolver {
  // Build lookup map: "blockId:blockVersion" → metadata
  const metadataMap = new Map<string, BlockMetadataFragment>();
  
  for (const block of blocks) {
    // Extract identity
    const blockId = block.id;
    const blockVersion = (block as any).version; // Not all block types have version at type level
    
    if (!blockId || !blockVersion) {
      console.warn('[BlockMetadataResolver] Skipping block with missing identity', {
        blockId,
        blockVersion,
        blockType: (block as any).type,
      });
      continue;
    }
    
    // Extract metadata (with defaults)
    const progressRole = (block as any).progressRole ?? 'instructional';
    const expectedTimeSec = (block as any).expectedTimeSec;
    
    // Build composite key
    const key = `${blockId}:${blockVersion}`;
    
    // Store in map
    metadataMap.set(key, {
      progressRole,
      expectedTimeSec,
    });
  }
  
  console.log('[BlockMetadataResolver] Built resolver', {
    totalBlocks: blocks.length,
    indexedBlocks: metadataMap.size,
  });
  
  // Return resolver closure
  return (blockId: string, blockVersion: string): BlockMetadataFragment | null => {
    const key = `${blockId}:${blockVersion}`;
    return metadataMap.get(key) ?? null;
  };
}
