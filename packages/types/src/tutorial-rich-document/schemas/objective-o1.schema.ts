/**
 * Objective O1 - Zod Validation Schemas
 * 
 * Learning Objectives Block provides a structured overview of skills
 * learners will develop, with categorized badges and iconography.
 * 
 * CRITICAL: This file exports Zod runtime schemas (NOT TypeScript interfaces)
 * to enable runtime validation, discriminated union dispatch, and type inference.
 * 
 * SCHEMA CONTRACT:
 * - Matches ACTUAL Composer output from toCanonicalBlock() (blockVersionDefinitions.ts:264-277)
 * - NO content.page wrapping (Composer unwraps at lines 266-268, 273)
 * - Objective items require `text` field (renderer reads obj.text at ObjectiveO1Block.tsx:96)
 * - Objective `id` is optional (storage type declares string|number optional)
 */

import { z } from 'zod';
import { PresentationConfigSchema } from './presentation.schema';

/**
 * Objective Item Schema
 * 
 * Represents a single learning objective with metadata for display.
 * 
 * CRITICAL CONTRACT POINTS:
 * - `id` is optional (matches storage type: string | number | undefined)
 * - BOTH `title` and `text` are optional individually
 * - AT LEAST ONE of `title` or `text` must be present (enforced by .refine())
 * - Renderer (ObjectiveO1Block.tsx:124) prefers title, falls back to text
 * - Registry defaults (objective.registry.ts:28) use `title` + `description`, NOT `text`
 * - Additional fields (verb, description, badge, icon) are optional metadata
 * - Uses .passthrough() to allow extensibility
 */
export const ObjectiveO1ItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  
  // BOTH optional individually - at least one required via .refine()
  title: z.string().min(1).max(200).optional(),
  text: z.string().min(1).max(500).optional(),
  
  // Metadata fields
  verb: z.string().min(1).max(50).optional(),
  description: z.string().min(1).max(1000).optional(),
  badge: z.string().min(1).max(50).optional(),
  category: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(50).optional(),
}).passthrough()
  .refine(
    (obj) => {
      const hasTitle = typeof obj.title === 'string' && obj.title.trim().length > 0;
      const hasText = typeof obj.text === 'string' && obj.text.trim().length > 0;
      return hasTitle || hasText;
    },
    {
      message: "Objective item must have either 'title' or 'text' with non-empty value",
      path: ['title', 'text']
    }
  );

/**
 * Note Schema (Structured Format)
 * 
 * Optional callout box with title and text.
 * Can be a simple string or a structured object.
 */
export const ObjectiveO1NoteSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  text: z.string().min(1).max(1000),
}).strict();

/**
 * Content Schema (Direct Payload - NO page wrapper)
 * 
 * CRITICAL: Composer outputs DIRECT content, NOT wrapped in content.page
 * Evidence: blockVersionDefinitions.ts lines 266-273 unwrap page and assign direct content
 * 
 * This matches:
 * - Composer toCanonicalBlock() output (line 273)
 * - Renderer input (ObjectiveO1Block.tsx line 43: const content = block.content)
 * - Storage type TutorialObjectivePayload
 */
export const ObjectiveO1ContentSchema = z.object({
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
 * Objective O1 Block Schema (Runtime Validation)
 * 
 * Complete block envelope matching Composer's ACTUAL toCanonicalBlock() output.
 * 
 * CRITICAL CONTRACT:
 * - content is DIRECT (NOT content.page) - proven by blockVersionDefinitions.ts:273
 * - Must validate actual Composer save payloads and registry defaults
 * - Must validate blocks loaded from database during hydration
 * 
 * REQUIREMENTS:
 * - Must be a Zod schema (z.object), NOT a TypeScript interface
 * - Must use z.literal() for type and version discriminators
 * - Must use z.string().uuid() for id validation
 * - Must NOT use .strict() at top level (allows optional envelope fields)
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
  content: ObjectiveO1ContentSchema,
  presentation: PresentationConfigSchema.optional(),
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
export type ObjectiveO1Content = z.infer<typeof ObjectiveO1ContentSchema>;
export type ObjectiveO1Block = z.infer<typeof ObjectiveO1BlockSchema>;

/**
 * Validator Function
 * 
 * Validates complete O1 block structure.
 * Use this to validate blocks after Composer canonicalization or from database hydration.
 * 
 * @param block - Unknown block to validate
 * @returns Validated and typed O1 block
 * @throws ZodError if validation fails
 */
export function validateObjectiveO1Block(
  block: unknown
): ObjectiveO1Block {
  return ObjectiveO1BlockSchema.parse(block);
}
