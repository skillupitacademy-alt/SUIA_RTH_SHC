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

// Re-export individual block schemas
export * from './content-blocks.schema';
export * from './container-blocks.schema';

/**
 * Complete TutorialBlock schema with recursive support
 * This is the main schema used for validation
 */
export const TutorialBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion('type', [
    // Content blocks
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
    // Container blocks
    TwoColumnBlockSchema,
    ThreeColumnBlockSchema,
    CardGridBlockSchema,
    TimelineBlockSchema,
  ])
);
