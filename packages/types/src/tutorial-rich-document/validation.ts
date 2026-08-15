/**
 * Tutorial Rich Document - Section-Specific Validation
 * Defines which blocks are allowed for each of the 14 section types
 */

import type { BlockType } from './blocks';
import type { TutorialDocument } from './document';
import { calculateNestingDepth } from './blocks';
import { MAX_NESTING_DEPTH } from './constants';

/**
 * Section type from tutorial_sections table
 */
export type SectionType =
  | 'overview'
  | 'notes'
  | 'layman'
  | 'visual'
  | 'real_life'
  | 'technical'
  | 'code'
  | 'practice'
  | 'assignment'
  | 'project'
  | 'quiz'
  | 'summary'
  | 'interview'
  | 'ai_tutor';

/**
 * Section block palette - defines allowed blocks per section type
 */
export const SECTION_BLOCK_PALETTES: Record<SectionType, BlockType[]> = {
  overview: [
    'heading',
    'paragraph',
    'list',
    'image',
    'card-grid',
    'timeline',
  ],

  notes: [
    'heading',
    'paragraph',
    'list',
    'code',
    'table',
    'image',
    'diagram',
    'callout',
    'definition',
    'example',
    'summary',
    'two-column',
    'card-grid',
  ],

  layman: [
    'heading',
    'paragraph',
    'list',
    'image',
    'callout',
    'example',
    'quote',
    'definition',
    'two-column',
  ],

  visual: [
    'heading',
    'paragraph',
    'diagram',
    'image',
    'callout',
    'two-column',
    'three-column',
    'card-grid',
  ],

  real_life: [
    'heading',
    'paragraph',
    'list',
    'image',
    'example',
    'callout',
    'two-column',
    'quote',
  ],

  technical: [
    'heading',
    'paragraph',
    'list',
    'code',
    'table',
    'diagram',
    'callout',
    'definition',
    'comparison',
    'two-column',
    'example',
  ],

  code: [
    'heading',
    'paragraph',
    'code',
    'example',
    'callout',
    'list',
  ],

  practice: [
    'heading',
    'paragraph',
    'list',
    'code',
    'example',
    'callout',
  ],

  assignment: [
    'heading',
    'paragraph',
    'list',
    'code',
    'example',
    'callout',
    'timeline',
  ],

  project: [
    'heading',
    'paragraph',
    'list',
    'code',
    'timeline',
    'card-grid',
    'callout',
    'table',
  ],

  quiz: [
    'heading',
    'paragraph',
    'code',
    'image',
    'callout',
    // Note: Quiz may need specialized assessment blocks in future
  ],

  summary: [
    'heading',
    'paragraph',
    'list',
    'summary',
    'callout',
    'card-grid',
  ],

  interview: [
    'heading',
    'paragraph',
    'code',
    'example',
    'callout',
    'quote',
    'list',
  ],

  ai_tutor: [
    'heading',
    'paragraph',
    'callout',
    'code',
    'example',
    // Note: AI Tutor may need specialized interactive blocks
  ],
};

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  code: string;
  message: string;
  blockId?: string;
  path?: string;
}

/**
 * Validate document against section type constraints
 */
export function validateDocumentForSection(
  document: TutorialDocument,
  sectionType: SectionType
): ValidationResult {
  const errors: ValidationError[] = [];
  const allowedBlocks = SECTION_BLOCK_PALETTES[sectionType];

  // Check nesting depth
  const depth = calculateNestingDepth(document.blocks);
  if (depth > MAX_NESTING_DEPTH) {
    errors.push({
      code: 'MAX_NESTING_EXCEEDED',
      message: `Nesting depth ${depth} exceeds maximum ${MAX_NESTING_DEPTH}`,
    });
  }

  // Check block IDs are unique
  const blockIds = new Set<string>();
  function checkBlockIds(blocks: any[], path = 'blocks') {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (blockIds.has(block.id)) {
        errors.push({
          code: 'DUPLICATE_BLOCK_ID',
          message: `Duplicate block ID: ${block.id}`,
          blockId: block.id,
          path: `${path}[${i}]`,
        });
      }
      blockIds.add(block.id);

      // Check if block type is allowed for this section
      if (!allowedBlocks.includes(block.type)) {
        errors.push({
          code: 'BLOCK_NOT_ALLOWED',
          message: `Block type '${block.type}' is not allowed in section type '${sectionType}'`,
          blockId: block.id,
          path: `${path}[${i}]`,
        });
      }

      // Recursively check children for container blocks
      if (block.type === 'two-column') {
        checkBlockIds(block.content.left.blocks, `${path}[${i}].content.left.blocks`);
        checkBlockIds(block.content.right.blocks, `${path}[${i}].content.right.blocks`);
      } else if (block.type === 'three-column') {
        block.content.columns.forEach((col: any, colIdx: number) => {
          checkBlockIds(col.blocks, `${path}[${i}].content.columns[${colIdx}].blocks`);
        });
      } else if (block.type === 'card-grid') {
        block.content.cards.forEach((card: any, cardIdx: number) => {
          checkBlockIds(card.blocks, `${path}[${i}].content.cards[${cardIdx}].blocks`);
        });
      } else if (block.type === 'timeline') {
        block.content.items.forEach((item: any, itemIdx: number) => {
          if (item.blocks) {
            checkBlockIds(item.blocks, `${path}[${i}].content.items[${itemIdx}].blocks`);
          }
        });
      }
    }
  }

  checkBlockIds(document.blocks);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a block type is allowed for a section type
 */
export function isBlockAllowedInSection(
  blockType: BlockType,
  sectionType: SectionType
): boolean {
  return SECTION_BLOCK_PALETTES[sectionType].includes(blockType);
}

/**
 * Get all allowed blocks for a section type
 */
export function getAllowedBlocksForSection(sectionType: SectionType): BlockType[] {
  return SECTION_BLOCK_PALETTES[sectionType];
}
