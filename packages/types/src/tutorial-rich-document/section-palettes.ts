/**
 * Section Block Palettes - Which blocks are allowed per section type
 * 
 * This defines the "palette" of available blocks for each tutorial section.
 * Not all blocks make sense in all sections.
 */

import { TutorialSectionId } from '../tutorial-section-contracts';
import { BlockType } from './blocks';

/**
 * Block palette for each section type
 */
export const SECTION_BLOCK_PALETTES: Record<TutorialSectionId, readonly BlockType[]> = {
  overview: [
    'heading',
    'paragraph',
    'list',
    'two-column',
    'three-column',
    'card-grid',
  ] as const,

  notes: [
    'heading',
    'paragraph',
    'list',
    'table',
    'image',
    'code',
    'callout',
    'definition',
    'diagram',
    'two-column',
  ] as const,

  technical: [
    'heading',
    'paragraph',
    'code',
    'table',
    'diagram',
    'callout',
    'comparison',
    'two-column',
    'definition',
  ] as const,

  code: [
    'heading',
    'paragraph',
    'code',
    'callout',
    'example',
  ] as const,

  layman: [
    'heading',
    'paragraph',
    'list',
    'callout',
    'example',
    'quote',
    'image',
  ] as const,

  real_life: [
    'heading',
    'paragraph',
    'example',
    'quote',
    'callout',
    'timeline',
    'list',
  ] as const,

  visual: [
    'heading',
    'paragraph',
    'diagram',
    'image',
    'callout',
  ] as const,

  practice: [
    'heading',
    'paragraph',
    'example',
    'code',
  ] as const,

  quiz: [
    'heading',
    'paragraph',
  ] as const,

  assignment: [
    'heading',
    'paragraph',
    'list',
    'code',
    'callout',
  ] as const,

  project: [
    'heading',
    'paragraph',
    'list',
    'code',
    'callout',
    'timeline',
  ] as const,

  summary: [
    'heading',
    'paragraph',
    'list',
    'summary',
    'callout',
  ] as const,

  interview: [
    'heading',
    'paragraph',
    'example',
    'code',
    'callout',
  ] as const,

  ai_tutor: [
    'heading',
    'paragraph',
    'callout',
  ] as const,
};

/**
 * Get allowed blocks for a section type
 */
export function getAllowedBlocksForSection(sectionType: TutorialSectionId): readonly BlockType[] {
  return SECTION_BLOCK_PALETTES[sectionType];
}

/**
 * Check if a block type is allowed in a section
 */
export function isBlockAllowedInSection(blockType: BlockType, sectionType: TutorialSectionId): boolean {
  return SECTION_BLOCK_PALETTES[sectionType].includes(blockType);
}

/**
 * Validate that all blocks in an array are allowed for a section type
 */
export function validateBlocksForSection(
  blocks: { type: BlockType }[],
  sectionType: TutorialSectionId
): { valid: boolean; invalidBlocks: string[] } {
  const allowedBlocks = SECTION_BLOCK_PALETTES[sectionType];
  const invalidBlocks = blocks
    .filter((block) => !allowedBlocks.includes(block.type))
    .map((block) => block.type);

  return {
    valid: invalidBlocks.length === 0,
    invalidBlocks,
  };
}
