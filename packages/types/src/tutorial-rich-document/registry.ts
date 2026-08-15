/**
 * Tutorial Rich Document - Block Registry
 * Central registry of all block types with metadata
 */

import type { BlockType } from './blocks';

/**
 * Block category for organization
 */
export type BlockCategory = 
  | 'text'           // Heading, Paragraph
  | 'list'           // List
  | 'code'           // Code, Example
  | 'media'          // Image, Diagram
  | 'structure'      // Table, Comparison
  | 'emphasis'       // Callout, Quote
  | 'educational'    // Definition, Summary
  | 'layout';        // TwoColumn, ThreeColumn, CardGrid, Timeline

/**
 * Block registry entry with metadata
 */
export interface BlockRegistryEntry {
  type: BlockType;
  label: string;
  description: string;
  category: BlockCategory;
  icon?: string;
  supportsChildren: boolean;
  maxChildren?: number;
  allowedChildTypes?: BlockType[];
  isExperimental?: boolean;
  tags?: string[];
}

/**
 * Complete block registry
 * This defines all available block types and their properties
 */
export const BLOCK_REGISTRY: Record<BlockType, BlockRegistryEntry> = {
  // TEXT BLOCKS
  heading: {
    type: 'heading',
    label: 'Heading',
    description: 'Section heading (H1-H6)',
    category: 'text',
    icon: 'Heading',
    supportsChildren: false,
    tags: ['text', 'title', 'structure'],
  },
  paragraph: {
    type: 'paragraph',
    label: 'Paragraph',
    description: 'Text paragraph',
    category: 'text',
    icon: 'Type',
    supportsChildren: false,
    tags: ['text', 'content'],
  },

  // LIST BLOCKS
  list: {
    type: 'list',
    label: 'List',
    description: 'Ordered or unordered list',
    category: 'list',
    icon: 'List',
    supportsChildren: false, // List items can nest, but list block itself doesn't contain blocks
    tags: ['list', 'bullets', 'ordered', 'unordered'],
  },

  // CODE BLOCKS
  code: {
    type: 'code',
    label: 'Code',
    description: 'Code block with syntax highlighting',
    category: 'code',
    icon: 'Code',
    supportsChildren: false,
    tags: ['code', 'programming', 'syntax'],
  },
  example: {
    type: 'example',
    label: 'Example',
    description: 'Code example with explanation',
    category: 'code',
    icon: 'FileCode',
    supportsChildren: false,
    tags: ['code', 'example', 'tutorial'],
  },

  // MEDIA BLOCKS
  image: {
    type: 'image',
    label: 'Image',
    description: 'Image with caption',
    category: 'media',
    icon: 'Image',
    supportsChildren: false,
    tags: ['media', 'image', 'visual'],
  },
  diagram: {
    type: 'diagram',
    label: 'Diagram',
    description: 'Diagram or flowchart',
    category: 'media',
    icon: 'Network',
    supportsChildren: false,
    tags: ['diagram', 'visual', 'mermaid', 'flowchart'],
  },

  // STRUCTURE BLOCKS
  table: {
    type: 'table',
    label: 'Table',
    description: 'Data table',
    category: 'structure',
    icon: 'Table',
    supportsChildren: false,
    tags: ['table', 'data', 'grid'],
  },
  comparison: {
    type: 'comparison',
    label: 'Comparison',
    description: 'Feature comparison table',
    category: 'structure',
    icon: 'ArrowLeftRight',
    supportsChildren: false,
    tags: ['comparison', 'vs', 'table'],
  },

  // EMPHASIS BLOCKS
  callout: {
    type: 'callout',
    label: 'Callout',
    description: 'Important notice or tip',
    category: 'emphasis',
    icon: 'AlertCircle',
    supportsChildren: false,
    tags: ['callout', 'alert', 'notice', 'warning', 'tip'],
  },
  quote: {
    type: 'quote',
    label: 'Quote',
    description: 'Quotation block',
    category: 'emphasis',
    icon: 'Quote',
    supportsChildren: false,
    tags: ['quote', 'citation'],
  },

  // EDUCATIONAL BLOCKS
  definition: {
    type: 'definition',
    label: 'Definition',
    description: 'Term definition',
    category: 'educational',
    icon: 'BookOpen',
    supportsChildren: false,
    tags: ['definition', 'term', 'glossary'],
  },
  summary: {
    type: 'summary',
    label: 'Summary',
    description: 'Key points summary',
    category: 'educational',
    icon: 'ListChecks',
    supportsChildren: false,
    tags: ['summary', 'recap', 'key-points'],
  },

  // LAYOUT BLOCKS
  'two-column': {
    type: 'two-column',
    label: 'Two Column',
    description: 'Two-column layout',
    category: 'layout',
    icon: 'Columns',
    supportsChildren: true,
    tags: ['layout', 'columns', 'grid'],
  },
  'three-column': {
    type: 'three-column',
    label: 'Three Column',
    description: 'Three-column layout',
    category: 'layout',
    icon: 'Columns',
    supportsChildren: true,
    tags: ['layout', 'columns', 'grid'],
  },
  'card-grid': {
    type: 'card-grid',
    label: 'Card Grid',
    description: 'Grid of cards',
    category: 'layout',
    icon: 'LayoutGrid',
    supportsChildren: true,
    maxChildren: 20,
    tags: ['layout', 'cards', 'grid'],
  },
  timeline: {
    type: 'timeline',
    label: 'Timeline',
    description: 'Timeline with events',
    category: 'layout',
    icon: 'GitBranch',
    supportsChildren: true,
    maxChildren: 50,
    tags: ['timeline', 'chronology', 'sequence'],
  },
};

/**
 * Get block registry entry by type
 */
export function getBlockInfo(type: BlockType): BlockRegistryEntry | undefined {
  return BLOCK_REGISTRY[type];
}

/**
 * Get all block types by category
 */
export function getBlocksByCategory(category: BlockCategory): BlockRegistryEntry[] {
  return Object.values(BLOCK_REGISTRY).filter((entry) => entry.category === category);
}

/**
 * Get all container block types
 */
export function getContainerBlocks(): BlockRegistryEntry[] {
  return Object.values(BLOCK_REGISTRY).filter((entry) => entry.supportsChildren);
}

/**
 * Get all content block types
 */
export function getContentBlocks(): BlockRegistryEntry[] {
  return Object.values(BLOCK_REGISTRY).filter((entry) => !entry.supportsChildren);
}

/**
 * Search blocks by tag
 */
export function searchBlocksByTag(tag: string): BlockRegistryEntry[] {
  return Object.values(BLOCK_REGISTRY).filter(
    (entry) => entry.tags?.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
  );
}
