/**
 * Tutorial Rich Document - Content Blocks
 * These blocks represent educational content (cannot contain child blocks)
 */

import type { CodeLanguage } from '../constants';
import type { PresentationConfig } from '../presentation';

/**
 * Base properties for all blocks
 */
export interface BaseBlock {
  /**
   * Unique block identifier within the document
   * Must be stable across edits for tracking and review
   */
  id: string;

  /**
   * Presentation configuration (semantic, not React/CSS)
   */
  presentation?: PresentationConfig;
}

/**
 * Heading block (H1-H6)
 */
export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: {
    text: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
}

/**
 * Paragraph block
 * TODO: Consider rich inline formatting (bold, italic, code, links) in future version
 */
export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: {
    text: string;
  };
}

/**
 * List block (ordered or unordered)
 */
export interface ListBlock extends BaseBlock {
  type: 'list';
  content: {
    style: 'ordered' | 'unordered';
    items: ListItem[];
  };
}

/**
 * List item (can be nested)
 */
export interface ListItem {
  text: string;
  children?: ListItem[];
}

/**
 * Code block with syntax highlighting
 */
export interface CodeBlock extends BaseBlock {
  type: 'code';
  content: {
    language: CodeLanguage;
    code: string;
    filename?: string;
    caption?: string;
    highlightLines?: number[];
    showLineNumbers?: boolean;
  };
}

/**
 * Table block
 */
export interface TableBlock extends BaseBlock {
  type: 'table';
  content: {
    columns: TableColumn[];
    rows: TableRow[];
    hasHeader?: boolean;
    caption?: string;
  };
}

export interface TableColumn {
  id: string;
  label: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface TableRow {
  id: string;
  cells: TableCell[];
}

export interface TableCell {
  columnId: string;
  value: string;
}

/**
 * Image block (references asset, does NOT store binary data)
 */
export interface ImageBlock extends BaseBlock {
  type: 'image';
  content: {
    /**
     * Reference to asset in asset storage system
     */
    assetId: string;

    /**
     * Alternative text for accessibility
     */
    alt: string;

    /**
     * Optional caption
     */
    caption?: string;

    /**
     * Optional aspect ratio hint
     */
    aspectRatio?: string;
  };
}

/**
 * Callout block for important information
 */
export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  content: {
    variant: 'info' | 'warning' | 'tip' | 'important' | 'success' | 'danger';
    title?: string;
    text: string;
  };
}

/**
 * Definition D1 - Page Structure
 * Author content contract for Definition D1 version
 */
export interface DefinitionD1Page {
  type: 'definition';
  category: string;
  title: string;
  intro: string;
  definition: string;
  explanation: string[];
  example: {
    language: string;
    code: string;
  };
  characteristics: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  takeaway: string;
}

/**
 * Definition D1 - Author Content
 * Wraps page structure in content.page
 */
export interface DefinitionD1AuthorContent {
  page: DefinitionD1Page;
}

/**
 * Definition D1 Block
 * Canonical block with version envelope
 */
export interface DefinitionD1Block extends BaseBlock {
  type: 'definition';
  version: 'D1';
  content: DefinitionD1AuthorContent;
}

/**
 * Definition Block (Version Union)
 * All Definition block versions
 */
export type DefinitionBlock = DefinitionD1Block;
// Future versions:
// | DefinitionD2Block
// | DefinitionD3Block
// ...

/**
 * Example block
 */
export interface ExampleBlock extends BaseBlock {
  type: 'example';
  content: {
    title?: string;
    explanation: string;
    code?: string;
    codeLanguage?: CodeLanguage;
    expectedOutput?: string;
    notes?: string;
  };
}

/**
 * Quote block
 */
export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  content: {
    text: string;
    attribution?: string;
    source?: string;
  };
}

/**
 * Summary block
 */
export interface SummaryBlock extends BaseBlock {
  type: 'summary';
  content: {
    title?: string;
    points: string[];
  };
}

/**
 * Diagram block (Mermaid or asset reference)
 */
export interface DiagramBlock extends BaseBlock {
  type: 'diagram';
  content: {
    diagramType: 'mermaid' | 'asset' | 'svg';
    /**
     * For Mermaid: the mermaid definition string
     * For asset: the asset ID
     * For svg: inline SVG string (use sparingly)
     */
    diagramData: string;
    caption?: string;
    alt?: string;
  };
}

/**
 * Comparison block (structured comparison table)
 */
export interface ComparisonBlock extends BaseBlock {
  type: 'comparison';
  content: {
    title?: string;
    entities: string[]; // e.g., ["JavaScript", "Java"]
    features: ComparisonFeature[];
    recommendation?: string;
    notes?: string;
  };
}

export interface ComparisonFeature {
  name: string;
  values: string[]; // One value per entity
}

/**
 * Union type for all content blocks
 */
export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | CodeBlock
  | TableBlock
  | ImageBlock
  | CalloutBlock
  | DefinitionBlock
  | ExampleBlock
  | QuoteBlock
  | SummaryBlock
  | DiagramBlock
  | ComparisonBlock;

// Import CodeBlockVersioned from content-blocks for version-specific Code blocks
import type { CodeBlockVersioned } from './content-blocks';

/**
 * Extended ContentBlock including versioned blocks
 * This allows TutorialBlock to include both legacy and versioned blocks
 */
export type ContentBlockExtended = ContentBlock | CodeBlockVersioned;
