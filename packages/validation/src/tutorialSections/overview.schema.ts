import { z } from 'zod';
import {
  ContentCardSchema,
  NonEmptyStringSchema,
  NonNegativeNumberSchema,
  PercentageSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

export const OverviewSectionSchema = sectionSchema('overview', {
  hero: strictObject({
    iconLabel: NonEmptyStringSchema,
    title: NonEmptyStringSchema,
    description: NonEmptyStringSchema,
    difficulty: NonEmptyStringSchema,
    estimatedReadTime: NonEmptyStringSchema.optional(),
    xp: NonNegativeNumberSchema.optional(),
    topicsCount: z.number().int().positive(),
    lastUpdated: NonEmptyStringSchema,
  }),
  progressSummary: strictObject({
    percentage: PercentageSchema,
    checklist: z.array(strictObject({
      label: NonEmptyStringSchema,
      completed: z.boolean(),
    })).min(1),
  }),
  learningOutcomes: nonEmptyStringArray(1),
  learningRoadmap: strictObject({
    contentCards: z.array(ContentCardSchema).min(1),
    taskCards: z.array(ContentCardSchema).min(1),
  }),
  recommendedFlow: nonEmptyStringArray(1),
  readinessContext: strictObject({
    prerequisites: nonEmptyStringArray(1),
    successCriteria: nonEmptyStringArray(1),
  }),
  navigation: strictObject({
    prevTitle: NonEmptyStringSchema,
    nextTitle: NonEmptyStringSchema,
  }),
});

export type OverviewSection = z.infer<typeof OverviewSectionSchema>;

