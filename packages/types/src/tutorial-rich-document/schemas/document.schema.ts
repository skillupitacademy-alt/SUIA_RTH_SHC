/**
 * Tutorial Rich Document - Document Zod Schema
 */

import { z } from 'zod';
import { CURRENT_SCHEMA_VERSION, MAX_BLOCKS_PER_DOCUMENT } from '../constants';
import { TutorialBlockSchema } from './blocks.schema';

const TutorialDocumentMetadataSchema = z.object({
  estimatedReadTime: z.number().int().positive().optional(),
  learningObjectives: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  prerequisites: z.array(z.string().min(1)).optional(),
  complexityScore: z.number().int().min(1).max(10).optional(),
  isInteractive: z.boolean().optional(),
  audience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  custom: z.record(z.unknown()).optional(),
}).optional();

export const TutorialDocumentSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  blocks: z.array(TutorialBlockSchema).max(MAX_BLOCKS_PER_DOCUMENT),
  metadata: TutorialDocumentMetadataSchema,
});

export type TutorialDocumentInput = z.input<typeof TutorialDocumentSchema>;
export type TutorialDocumentOutput = z.output<typeof TutorialDocumentSchema>;
