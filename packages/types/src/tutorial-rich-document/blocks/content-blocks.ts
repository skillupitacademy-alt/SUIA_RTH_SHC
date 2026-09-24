/**
 * Content Blocks - Core educational content building blocks
 * 
 * These blocks represent primary content: text, code, images, lists, tables, etc.
 * They contain NO React components, NO CSS, NO HTML markup.
 * Only pure semantic data.
 */

import { PresentationConfig } from '../presentation';

/**
 * Learning Progress Role
 * 
 * Determines how a block participates in progress tracking:
 * 
 * - 'instructional': Counted toward page R/Y/G progress (D1, C1, I1, S1, O1, V1, etc.)
 * - 'structural': Content organization, no completion semantics (heading, paragraph, list)
 * - 'assessment': Has completion but tracked separately from page progress (Q, EX, T, etc.)
 * - 'media': Passive content, no interaction required (image, video, diagram)
 * 
 * DEFAULT BEHAVIOR:
 * - Versioned blocks (D1, C1, I1, S1, etc.): Default to 'instructional'
 * - Base content blocks: Default to 'structural'
 * - Quiz/exercise blocks: Explicitly 'assessment'
 * - Media blocks: Default to 'media'
 */
export type BlockProgressRole = 
  | 'instructional'
  | 'structural'
  | 'assessment'
  | 'media'
  ;

/**
 * Base structure for all blocks
 */
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
  
  /**
   * Expected time for learner to complete this block (in seconds)
   * 
   * SEMANTIC SCOPE: Instructional blocks only (D1, C1, S1, I1, O1)
   * - AI-generated at content authoring time
   * - Composer-validated and author-reviewable
   * - Published TutorialDocument is authoritative
   * - ILS compares actual vs expected time
   * 
   * STRUCTURAL BLOCKS: Field inherited but semantically not applicable.
   * Runtime validation (Zod schemas) determines which blocks accept this field.
   * 
   * @example
   * expectedTimeSec: 180  // 3 minutes
   */
  expectedTimeSec?: number;
  
  /**
   * Learning progress role
   * 
   * Determines how this block participates in progress tracking.
   * See BlockProgressRole documentation for semantic meanings.
   * 
   * DEFAULT RULES:
   * - Versioned instructional blocks (D1, C1, I1, S1): Default 'instructional' (can be omitted)
   * - Structural blocks (heading, paragraph, list): Default 'structural' (can be omitted)
   * - Assessment blocks (Q, EX, T): Must explicitly declare 'assessment'
   * - Media blocks (image, video): Default 'media' (can be omitted)
   * 
   * @example
   * progressRole: 'instructional'
   */
  progressRole?: BlockProgressRole;
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
 * 
 * Summary S1 - Author Content
 */
export interface SummaryS1AuthorContent {
  title?: string;
  points: string[];
}

/**
 * Summary S1 Block
 * Canonical block with version envelope
 */
export interface SummaryS1Block extends BaseBlock {
  type: 'summary';
  version: 'S1';
  content: SummaryS1AuthorContent;
}

/**
 * Summary Block (Version Union)
 * All Summary block versions
 */
export type SummaryBlock = SummaryS1Block;
// Future versions:
// | SummaryS2Block
// | SummaryS3Block
// ...

/**
 * 12. Introduction Block - Icon Registry
 * Controlled set of approved Lucide icons for I1
 */
export type IntroductionIconKey =
  | 'book-open'
  | 'target'
  | 'lightbulb'
  | 'route'
  | 'code'
  | 'layers'
  | 'check-circle'
  | 'arrow-right'
  | 'graduation-cap'
  | 'rocket'
  | 'wrench'
  | 'globe'
  | 'zap'
  | 'star'
  | 'box';

/**
 * Introduction I1 - Page Structure
 * Author content contract for Introduction I1 version
 * 
 * Provides comprehensive roadmap-style overview with 9 sections:
 * 1. Hero (badge, title, subtitle, motto)
 * 2. Learning Goal
 * 3. The Topic
 * 4. Where Does It Fit? (flow cards)
 * 5. The Solution (code example)
 * 6. Where Is It Used? (use cases)
 * 7. What Will You Learn? (roadmap)
 * 8. Why This Matters (benefits)
 * 9. Key Takeaway
 */
export interface IntroductionI1Page {
  // Hero Section
  badge: string;
  title: string;
  subtitle: string;
  
  // Mountain Roadmap - Handwritten motto (4 lines)
  motto: {
    lines: [string, string, string, string];
  };
  
  // Learning Goal
  learningGoal: string;
  
  // Section 1: The Topic
  topic: {
    title: string;
    description: string;
    quote: string;
  };
  
  // Section 2: Where Does It Fit?
  whereFit: {
    title: string;
    description: string;
    flowCards: Array<{
      title: string;
      subtitle: string;
      icon: IntroductionIconKey;
      highlight?: boolean;
    }>;
  };
  
  // Section 3: The Solution
  solution: {
    title: string;
    description: string;
    code: {
      language: string;
      code: string;
    };
  };
  
  // Section 4: Where Is It Used?
  whereUsed: {
    title: string;
    description: string;
    useCases: Array<{
      title: string;
      description: string;
      icon: IntroductionIconKey;
      highlight?: boolean;
    }>;
  };
  
  // Section 5: What Will You Learn?
  roadmap: {
    title: string;
    description: string;
    steps: Array<{
      title: string;
      subtitle: string;
    }>;
  };
  
  // Section 6: Why This Matters
  whyMatters: {
    title: string;
    benefits: Array<{
      title: string;
      subtitle: string;
      icon: IntroductionIconKey;
    }>;
  };
  
  // Key Takeaway
  keyTakeaway: string;
}

/**
 * Introduction I1 - Author Content
 * Wraps page structure in content.page
 */
export interface IntroductionI1AuthorContent {
  page: IntroductionI1Page;
}

/**
 * Introduction I1 Block
 * Canonical block with version envelope
 */
export interface IntroductionI1Block extends BaseBlock {
  type: 'introduction';
  version: 'I1';
  content: IntroductionI1AuthorContent;
}

/**
 * Introduction Block (Version Union)
 * All Introduction block versions
 */
export type IntroductionBlock = IntroductionI1Block;
// Future versions:
// | IntroductionI2Block
// | IntroductionI3Block
// ...
