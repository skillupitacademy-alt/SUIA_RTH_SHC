/**
 * Tutorial Rich Document - Block Zod Schemas (Main Export)
 * Combines content and container block schemas with recursive support
 */

import { z } from 'zod';
import {
  ContentBlockSchema,
  HeadingBlockSchema,
  ParagraphBlockSchema,
  ListBlockSchema,
  CodeBlockSchema,
  TableBlockSchema,
  ImageBlockSchema,
  CalloutBlockSchema,
  DefinitionBlockSchema,
  ExampleBlockSchema,
  QuoteBlockSchema,
  SummaryBlockSchema,
  DiagramBlockSchema,
  ComparisonBlockSchema,
} from './content-blocks.schema';
import {
  ContainerBlockSchema,
  TwoColumnBlockSchema,
  ThreeColumnBlockSchema,
  CardGridBlockSchema,
  TimelineBlockSchema,
} from './container-blocks.schema';
import { CodeC1BlockSchema } from './code-c1.schema';

// Re-export individual block schemas
export * from './content-blocks.schema';
export * from './container-blocks.schema';
export * from './code-c1.schema';

/**
 * Union of Code blocks: legacy CodeBlock + versioned CodeC1Block
 */
const CodeBlockUnionSchema = z.union([CodeBlockSchema, CodeC1BlockSchema]);

/**
 * Complete TutorialBlock schema with recursive support
 * This is the main schema used for validation
 */
export const TutorialBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    // Type-based blocks
    HeadingBlockSchema,
    ParagraphBlockSchema,
    ListBlockSchema,
    TableBlockSchema,
    ImageBlockSchema,
    CalloutBlockSchema,
    DefinitionBlockSchema,
    ExampleBlockSchema,
    QuoteBlockSchema,
    SummaryBlockSchema,
    DiagramBlockSchema,
    ComparisonBlockSchema,
    // Code blocks (legacy + versioned)
    CodeBlockUnionSchema,
    // Container blocks
    TwoColumnBlockSchema,
    ThreeColumnBlockSchema,
    CardGridBlockSchema,
    TimelineBlockSchema,
  ])
);
