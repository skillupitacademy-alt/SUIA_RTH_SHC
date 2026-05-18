import { z } from 'zod';
import {
  NonEmptyStringSchema,
  nonEmptyStringArray,
  optionalSvgAssetField,
  sectionSchema,
  strictObject,
} from './base';

export const SummarySectionSchema = sectionSchema('summary', {
  title: NonEmptyStringSchema.optional(),
  description: NonEmptyStringSchema.optional(),
  masteryRecapCard: strictObject({
    headline: NonEmptyStringSchema,
    recap: NonEmptyStringSchema,
    confidenceSignal: NonEmptyStringSchema,
    heroAsset: optionalSvgAssetField(),
  }).optional(),
  keyTakeawayGrid: z.array(strictObject({
    id: NonEmptyStringSchema,
    title: NonEmptyStringSchema,
    description: NonEmptyStringSchema,
    importance: NonEmptyStringSchema,
  })).min(1).optional(),
  revisionChecklist: z.array(strictObject({
    id: NonEmptyStringSchema,
    item: NonEmptyStringSchema,
    checked: z.boolean(),
  })).min(1).optional(),
  nextStepPanel: strictObject({
    title: NonEmptyStringSchema,
    description: NonEmptyStringSchema,
    actions: nonEmptyStringArray(1),
  }).optional(),
});

export type SummarySection = z.infer<typeof SummarySectionSchema>;
