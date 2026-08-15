/**
 * Tutorial Rich Document - All Block Types
 * Discriminated union of all supported block types
 */

export * from './content';
export * from './container';

import type { ContentBlock } from './content';
import type { ContainerBlock } from './container';

/**
 * Discriminated union of ALL block types
 * This is the core type that everything else builds on
 */
export type TutorialBlock = ContentBlock | ContainerBlock;

/**
 * Extract block type from discriminated union
 */
export type BlockType = TutorialBlock['type'];

/**
 * Type guard to check if a block is a container block
 */
export function isContainerBlock(block: TutorialBlock): block is ContainerBlock {
  return (
    block.type === 'two-column' ||
    block.type === 'three-column' ||
    block.type === 'card-grid' ||
    block.type === 'timeline'
  );
}

/**
 * Type guard to check if a block is a content block
 */
export function isContentBlock(block: TutorialBlock): block is ContentBlock {
  return !isContainerBlock(block);
}

/**
 * Get all child blocks from a container block
 */
export function getChildBlocks(block: TutorialBlock): TutorialBlock[] {
  if (!isContainerBlock(block)) {
    return [];
  }

  switch (block.type) {
    case 'two-column':
      return [...block.content.left.blocks, ...block.content.right.blocks];
    case 'three-column':
      return block.content.columns.flatMap((col) => col.blocks);
    case 'card-grid':
      return block.content.cards.flatMap((card) => card.blocks);
    case 'timeline':
      return block.content.items.flatMap((item) => item.blocks || []);
    default:
      return [];
  }
}

/**
 * Get all blocks recursively (including nested)
 */
export function getAllBlocks(blocks: TutorialBlock[]): TutorialBlock[] {
  const result: TutorialBlock[] = [];

  for (const block of blocks) {
    result.push(block);
    if (isContainerBlock(block)) {
      result.push(...getAllBlocks(getChildBlocks(block)));
    }
  }

  return result;
}

/**
 * Calculate nesting depth of a block tree
 */
export function calculateNestingDepth(blocks: TutorialBlock[], currentDepth = 0): number {
  let maxDepth = currentDepth;

  for (const block of blocks) {
    if (isContainerBlock(block)) {
      const childDepth = calculateNestingDepth(getChildBlocks(block), currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    }
  }

  return maxDepth;
}
