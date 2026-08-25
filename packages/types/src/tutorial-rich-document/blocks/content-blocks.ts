/**
 * Content Blocks - Core educational content building blocks
 * 
 * These blocks represent primary content: text, code, images, lists, tables, etc.
 * They contain NO React components, NO CSS, NO HTML markup.
 * Only pure semantic data.
 */

import { PresentationConfig } from '../presentation';

/**
 * Base structure for all blocks
 */
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
}

/**
 * 1. Heading Block (H1-H6)
 */
export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: {
    text: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
}

/**
 * 2. Paragraph Block
 * 
 * Note: Currently plain text. Future enhancement may support
 * rich inline formatting (bold, italic, code, links).
 */
export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: {
    text: string;
  };
}

/**
 * 3. List Block (ordered/unordered)
 */
export interface ListBlock extends BaseBlock {
  type: 'list';
  content: {
    style: 'ordered' | 'unordered';
    items: string[];
  };
}

/**
 * 4. Code Block
 */
export interface CodeBlock extends BaseBlock {
  type: 'code';
  content: {
    language: 'javascript' | 'typescript' | 'python' | 'sql' | 'scala' | 'java' | 'bash' | 'html' | 'css' | 'json' | 'plaintext';
    code: string;
    filename?: string;
    caption?: string;
    highlightLines?: number[];
  };
}

/**
 * 5. Table Block
 */
export interface TableBlock extends BaseBlock {
  type: 'table';
  content: {
    columns: Array<{
      key: string;
      label: string;
      alignment?: 'left' | 'center' | 'right';
    }>;
    rows: Array<Record<string, string>>;
    hasHeader?: boolean;
  };
}

/**
 * 6. Image Block
 */
export interface ImageBlock extends BaseBlock {
  type: 'image';
  content: {
    /**
     * Asset ID or URL
     */
    assetId: string;
    alt: string;
    caption?: string;
  };
}

/**
 * 7. Callout Block (info boxes, warnings, tips)
 */
export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  content: {
    variant: 'info' | 'warning' | 'tip' | 'important' | 'danger';
    title?: string;
    text: string;
  };
}

/**
 * 8. Definition Block
 * 
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
 * 9. Code Block (Version-aware)
 * 
 * Code C1 - Memory Model Structure
 * Historical CodeBlock memory visualization (from d01c5921)
 */
export interface CodeC1MemoryModelColumn {
  id: string;
  title: string;
  width?: string;
}

export interface CodeC1MemoryModelNode {
  id: string;
  label: string;
  column: string;
  row: number;
  variant?: string;
  monospace?: boolean;
}

export interface CodeC1MemoryModelConnection {
  id: string;
  from: string;
  to: string;
  type?: string;
  fromSide?: string;
  toSide?: string;
}

export interface CodeC1MemoryModel {
  type?: string;
  description?: string;
  layout?: {
    type: string;
  };
  columns?: CodeC1MemoryModelColumn[];
  nodes?: CodeC1MemoryModelNode[];
  connections?: CodeC1MemoryModelConnection[];
  columnHeaders?: Record<string, string>;
  rows?: Array<Record<string, string>>;
  note?: string;
}

/**
 * Code C1 - Page Structure
 * Author content contract for Code C1 version
 */
export interface CodeC1Page {
  type: 'code';
  title: string;
  introduction: string;
  language: string;
  code: string;
  filename?: string;
  explanation: Array<{
    focus: string;
    description: string;
  }>;
  output?: {
    value: string;
    description?: string;
  };
  takeaway: string;
  practiceHint?: string;
  memoryModel?: CodeC1MemoryModel;  // ✅ RESTORED from historical CodeBlock
}

/**
 * Code C1 - Author Content
 * Wraps page structure in content.page
 */
export interface CodeC1AuthorContent {
  page: CodeC1Page;
}

/**
 * Code C1 Block
 * Canonical block with version envelope
 */
export interface CodeC1Block extends BaseBlock {
  type: 'code';
  version: 'C1';
  content: CodeC1AuthorContent;
}

/**
 * Code Block (Version Union)
 * All Code block versions
 */
export type CodeBlockVersioned = CodeC1Block;
// Future versions:
// | CodeC2Block
// | CodeC3Block
// ...

/**
 * 10. Example Block (educational example with explanation)
 */
export interface ExampleBlock extends BaseBlock {
  type: 'example';
  content: {
    title?: string;
    explanation: string;
    code?: string;
    output?: string;
    notes?: string;
  };
}

/**
 * 10. Quote Block
 */
export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  content: {
    quote: string;
    attribution?: string;
  };
}

/**
 * 11. Summary Block (bullet point summary)
 */
export interface SummaryBlock extends BaseBlock {
  type: 'summary';
  content: {
    title?: string;
    points: string[];
  };
}
