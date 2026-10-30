/**
 * Objective O1 - Zod Validation Schemas
 * 
 * Learning Objectives Block provides a structured overview of skills
 * learners will develop, with categorized badges and iconography.
 * 
 * CRITICAL: This file exports Zod runtime schemas (NOT TypeScript interfaces)
 * to enable runtime validation, discriminated union dispatch, and type inference.
 */

import { z } from 'zod';
import { PresentationConfigSchema } from './presentation.schema';

/**
 * Objective Item Schema
 * 
 * Represents a single learning objective with metadata for display.
 * Uses .passthrough() to allow component extensibility via [key: string]: unknown.
 */
export const ObjectiveO1ItemSchema = z.object({
  id: z.string().min(1).max(50),
  verb: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(200).optional(),
  text: z.string().min(1).max(500),
  description: z.string().min(1).max(1000).optional(),
  badge: z.string().min(1).max(50).optional(),
  category: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(50).optional(),
}).passthrough();

/**
 * Note Schema (Structured Format)
 * 
 * Optional callout box with title and text.
 * Uses .strict() to prevent arbitrary fields.
 */
export const ObjectiveO1NoteSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  text: z.string().min(1).max(1000),
}).strict();

/**
 * Page Schema (Content Payload)
 * 
 * Canonical structure matching component interface.
 * Uses .strict() to prevent arbitrary top-level fields.
 */
export const ObjectiveO1PageSchema = z.object({
  eyebrow: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200),
  titleHighlight: z.string().min(1).max(100).optional(),
  introduction: z.string().min(1).max(1000).optional(),
  subtitle: z.string().min(1).max(500).optional(),
  objectives: z.array(ObjectiveO1ItemSchema).min(1).max(20),
  note: z.union([
    z.string().min(1).max(1000),
    ObjectiveO1NoteSchema,
  ]).optional(),
}).strict();

/**
 * Author Content Schema (AI Output Wrapper)
 * 
 * Follows canonical pattern: content.page nesting.
 * This is the output format expected from AI generation.
 */
export const ObjectiveO1AuthorContentSchema = z.object({
  page: ObjectiveO1PageSchema,
}).strict();

/**
 * Objective O1 Block Schema (Runtime Validation)
 * 
 * Complete block envelope following canonical pattern.
 * 
 * CRITICAL REQUIREMENTS:
 * - Must be a Zod schema (z.object), NOT a TypeScript interface
 * - Must use z.literal() for type and version discriminators
 * - Must use z.string().uuid() for id validation
 * - Must NOT use .strict() at top level (allows optional envelope fields)
 * - Must import and use PresentationConfigSchema
 * 
 * This schema enables:
 * - Runtime validation via .parse() and .safeParse()
 * - Discriminated union dispatch via type/version literals
 * - Type inference via z.infer<typeof ObjectiveO1BlockSchema>
 * - Export validation by comparator/patcher
 */
export const ObjectiveO1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('objective'),
  version: z.literal('O1'),
  content: ObjectiveO1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media']).default('instructional').optional(),
});

/**
 * TypeScript Type Inference
 * 
 * Infer TypeScript types from Zod schemas for type safety.
 */
export type ObjectiveO1Item = z.infer<typeof ObjectiveO1ItemSchema>;
export type ObjectiveO1Note = z.infer<typeof ObjectiveO1NoteSchema>;
export type ObjectiveO1Page = z.infer<typeof ObjectiveO1PageSchema>;
export type ObjectiveO1AuthorContent = z.infer<typeof ObjectiveO1AuthorContentSchema>;
export type ObjectiveO1Block = z.infer<typeof ObjectiveO1BlockSchema>;

/**
 * Validator Function (Optional but Recommended)
 * 
 * Convenience function for validating AI-generated content payloads.
 * Throws ZodError if validation fails.
 * 
 * @param output - Unknown AI output to validate
 * @returns Validated and typed content payload
 * @throws ZodError if validation fails
 */
export function validateObjectiveO1AIOutput(
  output: unknown
): ObjectiveO1AuthorContent {
  return ObjectiveO1AuthorContentSchema.parse(output);
}
