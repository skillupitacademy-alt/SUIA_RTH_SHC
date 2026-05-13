import { z } from 'zod';
import {
  NonEmptyStringSchema,
  nonEmptyStringArray,
  optionalSvgAssetField,
  sectionSchema,
  strictObject,
} from './base';

export const SummarySectionSchema = sectionSchema('summary', {
  title: NonEmptyStringSchema,
  description: NonEmptyStringSchema,
  masteryRecapCard: strictObject({
    headline: NonEmptyStringSchema,
    recap: NonEmptyStringSchema,
    confidenceSignal: NonEmptyStringSchema,
    heroAsset: optionalSvgAssetField(),
  }),
  keyTakeawayGrid: z.array(strictObject({
    id: NonEmptyStringSchema,
    title: NonEmptyStringSchema,
    description: NonEmptyStringSchema,
    importance: NonEmptyStringSchema,
  })).min(1),
  revisionChecklist: z.array(strictObject({
    id: NonEmptyStringSchema,
    item: NonEmptyStringSchema,
    checked: z.boolean(),
  })).min(1),
  nextStepPanel: strictObject({
    title: NonEmptyStringSchema,
    description: NonEmptyStringSchema,
    actions: nonEmptyStringArray(1),
  }),
});

export type SummarySection = z.infer<typeof SummarySectionSchema>;
