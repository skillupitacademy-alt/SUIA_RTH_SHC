/**
 * Code C1 - Zod Validation Schemas
 * 
 * Separates AI author output validation from canonical block validation
 */

import { z } from 'zod';
import { CodeLanguageSchema } from './content-blocks.schema';

/**
 * Code C1 Explanation Item Schema
 * Validates individual explanation items
 */
export const CodeC1ExplanationItemSchema = z.object({
  focus: z.string().min(5).max(100),
  description: z.string().min(20).max(300),
}).strict();

/**
 * Code C1 Output Schema
 * Validates optional output structure
 */
export const CodeC1OutputSchema = z.object({
  value: z.string().min(1).max(500),
  description: z.string().max(200).optional(),
}).strict();

/**
 * Code C1 Page Schema
 * Validates the page.* structure
 */
export const CodeC1PageSchema = z.object({
  type: z.literal('code'),
  title: z.string().min(10).max(150),
  introduction: z.string().min(50).max(500),
  language: CodeLanguageSchema,
  code: z.string().min(10).max(2000),
  filename: z.string().min(1).max(100).optional(),
  explanation: z.array(CodeC1ExplanationItemSchema).min(2).max(6),
  output: CodeC1OutputSchema.optional(),
  takeaway: z.string().min(20).max(200),
  practiceHint: z.string().min(20).max(200).optional(),
}).strict();

/**
 * Code C1 Author Content Schema
 * Validates AI output: { page: {...} }
 */
export const CodeC1AuthorContentSchema = z.object({
  page: CodeC1PageSchema,
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
});

/**
 * Validator: AI Output → Author Content
 */
export function validateCodeC1AIOutput(
  output: unknown
): z.infer<typeof CodeC1AuthorContentSchema> {
  return CodeC1AuthorContentSchema.parse(output);
}
