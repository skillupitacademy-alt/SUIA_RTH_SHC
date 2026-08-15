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
 * 8. Definition Block (term + definition)
 */
export interface DefinitionBlock extends BaseBlock {
  type: 'definition';
  content: {
    term: string;
    definition: string;
    example?: string;
  };
}

/**
 * 9. Example Block (educational example with explanation)
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
