/**
 * Definition D1 - Zod Validation Schemas
 * 
 * Separates AI author output validation from canonical block validation
 */

import { z } from 'zod';
import { PresentationConfigSchema } from './presentation.schema';

/**
 * Definition D1 Page Schema
 * Validates the page.* structure
 */
export const DefinitionD1PageSchema = z.object({
  type: z.literal('definition'),
  category: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  intro: z.string().min(1).max(1000),
  definition: z.string().min(1).max(3000),
  explanation: z.array(z.string().min(1).max(2000)).min(1),
  example: z.object({
    language: z.string().min(1).max(50),
    code: z.string().min(1),
  }).strict(),
  characteristics: z.array(
    z.object({
      icon: z.string().min(1).max(20),
      title: z.string().min(1).max(100),
      description: z.string().min(1).max(500),
    }).strict()
  ),
  takeaway: z.string().min(1).max(1000),
}).strict();

/**
 * Definition D1 Author Content Schema
 * Validates AI output: { page: {...} }
 */
export const DefinitionD1AuthorContentSchema = z.object({
  page: DefinitionD1PageSchema,
}).strict();

/**
 * Definition D1 Block Schema
 * Validates canonical block with version envelope
 */
export const DefinitionD1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('definition'),
  version: z.literal('D1'),
  content: DefinitionD1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
});

/**
 * Validator: AI Output → Author Content
 */
export function validateDefinitionD1AIOutput(
  output: unknown
): z.infer<typeof DefinitionD1AuthorContentSchema> {
  return DefinitionD1AuthorContentSchema.parse(output);
}
