/**
 * Code C1 - Zod Validation Schemas
 * 
 * HISTORICAL CONTRACT PRESERVED
 * Based on TutorialCodePayload from commit d01c5921 (Aug 23, 2026)
 * This is the AUTHORITATIVE CodeBlock JSON structure that must be preserved.
 */

import { z } from 'zod';
import { CodeLanguageSchema } from './content-blocks.schema';
import { PresentationConfigSchema } from './presentation.schema';

/**
 * Historical Code Explanation Step Schema
 * From d01c5921 TutorialCodePayload.explanation.steps
 */
export const HistoricalCodeExplanationStepSchema = z.object({
  number: z.number(),
  code: z.string(),
  description: z.string(),
}).passthrough(); // Allow additional fields for backward compatibility

/**
 * Historical Memory Model Schema
 * COMPLETE structure from d01c5921
 */
export const HistoricalMemoryModelSchema = z.object({
  type: z.string().optional(),
  description: z.string().optional(),
  layout: z.object({
    type: z.string(),
  }).passthrough().optional(),
  columns: z.array(z.object({
    id: z.string(),
    title: z.string(),
    width: z.string().optional(),
  }).passthrough()).optional(),
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    column: z.string(),
    row: z.number(),
    variant: z.string().optional(),
    monospace: z.boolean().optional(),
  }).passthrough()).optional(),
  connections: z.array(z.object({
    id: z.string(),
    from: z.string(),
    to: z.string(),
    type: z.string().optional(),
    fromSide: z.string().optional(),
    toSide: z.string().optional(),
  }).passthrough()).optional(),
  columnHeaders: z.record(z.string()).optional(),
  rows: z.array(z.record(z.string())).optional(),
  note: z.string().optional(),
}).passthrough();

/**
 * Historical TutorialCodePayload Schema
 * EXACT structure from d01c5921 - THIS IS THE AUTHORITATIVE CONTRACT
 */
export const HistoricalTutorialCodePayloadSchema = z.object({
  page: z.object({
    type: z.union([z.literal('CODE + EXPLANATION'), z.string()]),
    title: z.string(),
    introduction: z.string(),
  }).passthrough(),
  code: z.object({
    language: z.string(), // Accepts ANY case: Python, python, PYTHON
    prismLanguage: z.string().optional(),
    source: z.string(),
  }).strict(),
  explanation: z.object({
    steps: z.array(HistoricalCodeExplanationStepSchema),
  }).strict().optional(),
  output: z.object({
    inputExample: z.record(z.string()).optional(),
    value: z.string(),
  }).strict().optional(),
  memoryModel: HistoricalMemoryModelSchema.optional(),
  takeaway: z.object({
    items: z.array(z.string()),
  }).strict().optional(),
  tip: z.object({
    text: z.string(),
  }).strict().optional(),
}).passthrough(); // Allow additional fields for extensibility

/**
 * Canonical Code C1 Page Schema
 * This is the CANONICAL storage format after conversion
 */
export const CanonicalCodeC1PageSchema = z.object({
  type: z.literal('code'),
  title: z.string(),
  introduction: z.string(),
  language: z.string(),
  code: z.string(),
  filename: z.string().optional(),
  explanation: z.array(z.object({
    focus: z.string(),
    description: z.string(),
  })),
  output: z.object({
    value: z.string(),
    description: z.string().optional(),
  }).optional(),
  takeaway: z.string(),
  practiceHint: z.string().optional(),
  memoryModel: HistoricalMemoryModelSchema.optional(),
}).strict();

/**
 * Code C1 Author Content Schema
 * CANONICAL format: {page: {...}}
 */
export const CodeC1AuthorContentSchema = z.object({
  page: CanonicalCodeC1PageSchema,
}).strict();

/**
 * Code C1 Block Schema
 * Validates canonical block with version envelope
 */
export const CodeC1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('code'),
  version: z.literal('C1'),
  content: CodeC1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
});

/**
 * Validator: AI Output → Author Content
 */
export function validateCodeC1AIOutput(
  output: unknown
): z.infer<typeof CodeC1AuthorContentSchema> {
  return CodeC1AuthorContentSchema.parse(output);
}

// Re-export schemas for backward compatibility
export const CodeC1PageSchema = CanonicalCodeC1PageSchema;
export const CodeC1ExplanationItemSchema = z.object({
  focus: z.string(),
  description: z.string(),
});
export const CodeC1OutputSchema = z.object({
  value: z.string(),
  description: z.string().optional(),
});
export const CodeC1TakeawaySchema = z.string();
export const CodeC1PracticeHintSchema = z.string();
export const CodeC1MemoryModelSchema = HistoricalMemoryModelSchema;
