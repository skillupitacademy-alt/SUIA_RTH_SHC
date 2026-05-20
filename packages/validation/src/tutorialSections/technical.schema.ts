import { z } from 'zod';
import {
  JsonRecordSchema,
  NonEmptyStringSchema,
  nonEmptyStringArray,
  optionalSvgAssetField,
  sectionSchema,
  strictObject,
} from './base';

export const TechnicalSectionSchema = sectionSchema('technical', {
  title: NonEmptyStringSchema.optional(),
  badge: NonEmptyStringSchema.optional(),
  intro: NonEmptyStringSchema.optional(),
  sections: z.array(strictObject({
    id: NonEmptyStringSchema,
    title: NonEmptyStringSchema,
    content: NonEmptyStringSchema,
    diagram: strictObject({
      type: z.enum(['anatomy', 'flow', 'chain']),
      data: JsonRecordSchema,
    }).optional(),
    diagramAsset: optionalSvgAssetField(),
    code: strictObject({
      language: NonEmptyStringSchema,
      code: NonEmptyStringSchema,
      output: NonEmptyStringSchema.optional(),
    }).optional(),
    keyPoints: nonEmptyStringArray(1).optional(),
    steps: z.array(strictObject({
      id: NonEmptyStringSchema,
      text: NonEmptyStringSchema,
    })).min(1).optional(),
    highlight: NonEmptyStringSchema.optional(),
  })).min(1).optional(),
});

export type TechnicalSection = z.infer<typeof TechnicalSectionSchema>;
