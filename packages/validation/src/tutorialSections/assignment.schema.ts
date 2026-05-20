import { z } from 'zod';
import {
  NonEmptyStringSchema,
  NonNegativeNumberSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

export const AssignmentSectionSchema = sectionSchema('assignment', {
  title: NonEmptyStringSchema.optional(),
  description: NonEmptyStringSchema.optional(),
  xp: NonNegativeNumberSchema.optional(),
  duration: NonEmptyStringSchema.optional(),
  task: strictObject({
    title: NonEmptyStringSchema,
    description: NonEmptyStringSchema,
    requirements: nonEmptyStringArray(1),
  }).optional(),
  objectives: nonEmptyStringArray(1).optional(),
  starterCode: NonEmptyStringSchema.optional(),
  submissionGuidelines: nonEmptyStringArray(1).optional(),
});

export type AssignmentSection = z.infer<typeof AssignmentSectionSchema>;

