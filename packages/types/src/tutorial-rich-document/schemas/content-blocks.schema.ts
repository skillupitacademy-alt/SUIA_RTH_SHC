/**
 * Tutorial Rich Document - Content Block Schemas
 * Runtime validation for content blocks (non-container blocks)
 */

import { z } from 'zod';
import {
  MIN_BLOCK_ID_LENGTH,
  MAX_BLOCK_ID_LENGTH,
  MAX_LIST_ITEMS,
  MAX_TABLE_COLUMNS,
  MAX_TABLE_ROWS,
  SUPPORTED_CODE_LANGUAGES,
} from '../constants';
import { PresentationConfigSchema } from './presentation.schema';

// Base block ID schema
export const BlockIdSchema = z.string().min(MIN_BLOCK_ID_LENGTH).max(MAX_BLOCK_ID_LENGTH);

// Code language schema
export const CodeLanguageSchema = z.enum(SUPPORTED_CODE_LANGUAGES);

// ============================================================
// CONTENT BLOCKS
// ============================================================

export const HeadingBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('heading'),
  content: z.object({
    text: z.string().min(1).max(500),
    level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  }),
  presentation: PresentationConfigSchema,
});

export const ParagraphBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('paragraph'),
  content: z.object({
    text: z.string().min(1),
  }),
  presentation: PresentationConfigSchema,
});

// List item (recursive)
const ListItemSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    text: z.string().min(1),
    children: z.array(ListItemSchema).max(MAX_LIST_ITEMS).optional(),
  })
);

export const ListBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('list'),
  content: z.object({
    style: z.enum(['ordered', 'unordered']),
    items: z.array(ListItemSchema).min(1).max(MAX_LIST_ITEMS),
  }),
  presentation: PresentationConfigSchema,
});

export const CodeBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('code'),
  content: z.object({
    language: CodeLanguageSchema,
    code: z.string().min(1),
    filename: z.string().max(200).optional(),
    caption: z.string().max(500).optional(),
    highlightLines: z.array(z.number().int().positive()).optional(),
    showLineNumbers: z.boolean().optional(),
  }),
  presentation: PresentationConfigSchema,
});

const TableColumnSchema = z.object({
  id: z.string().min(1).max(50),
  label: z.string().min(1).max(200),
  alignment: z.enum(['left', 'center', 'right']).optional(),
});

const TableCellSchema = z.object({
  columnId: z.string().min(1).max(50),
  value: z.string(),
});

const TableRowSchema = z.object({
  id: z.string().min(1).max(50),
  cells: z.array(TableCellSchema).min(1),
});

export const TableBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('table'),
  content: z.object({
    columns: z.array(TableColumnSchema).min(1).max(MAX_TABLE_COLUMNS),
    rows: z.array(TableRowSchema).min(1).max(MAX_TABLE_ROWS),
    hasHeader: z.boolean().optional(),
    caption: z.string().max(500).optional(),
  }),
  presentation: PresentationConfigSchema,
});

export const ImageBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('image'),
  content: z.object({
    assetId: z.string().min(1).max(200),
    alt: z.string().min(10).max(500),
    caption: z.string().max(500).optional(),
    aspectRatio: z.string().regex(/^\d+\/\d+$/).optional(),
  }),
  presentation: PresentationConfigSchema,
});

export const CalloutBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('callout'),
  content: z.object({
    variant: z.enum(['info', 'warning', 'tip', 'important', 'success', 'danger']),
    title: z.string().max(200).optional(),
    text: z.string().min(1),
  }),
  presentation: PresentationConfigSchema,
});

export const DefinitionBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('definition'),
  content: z.object({
    term: z.string().min(1).max(200),
    definition: z.string().min(1),
    example: z.string().optional(),
  }),
  presentation: PresentationConfigSchema,
});

export const ExampleBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('example'),
  content: z.object({
    title: z.string().max(200).optional(),
    explanation: z.string().min(1),
    code: z.string().optional(),
    codeLanguage: CodeLanguageSchema.optional(),
    expectedOutput: z.string().optional(),
    notes: z.string().optional(),
  }),
  presentation: PresentationConfigSchema,
});

export const QuoteBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('quote'),
  content: z.object({
    text: z.string().min(1),
    attribution: z.string().max(200).optional(),
    source: z.string().max(300).optional(),
  }),
  presentation: PresentationConfigSchema,
});

export const SummaryBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('summary'),
  content: z.object({
    title: z.string().max(200).optional(),
    points: z.array(z.string().min(1)).min(1).max(20),
  }),
  presentation: PresentationConfigSchema,
});

export const DiagramBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('diagram'),
  content: z.object({
    diagramType: z.enum(['mermaid', 'asset', 'svg']),
    diagramData: z.string().min(1),
    caption: z.string().max(500).optional(),
    alt: z.string().min(10).max(500).optional(),
  }),
  presentation: PresentationConfigSchema,
});

const ComparisonFeatureSchema = z.object({
  name: z.string().min(1).max(200),
  values: z.array(z.string()),
});

export const ComparisonBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('comparison'),
  content: z.object({
    title: z.string().max(200).optional(),
    entities: z.array(z.string().min(1).max(100)).min(2).max(5),
    features: z.array(ComparisonFeatureSchema).min(1).max(20),
    recommendation: z.string().max(1000).optional(),
    notes: z.string().max(1000).optional(),
  }),
  presentation: PresentationConfigSchema,
});

// Content block union
export const ContentBlockSchema = z.discriminatedUnion('type', [
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
]);
