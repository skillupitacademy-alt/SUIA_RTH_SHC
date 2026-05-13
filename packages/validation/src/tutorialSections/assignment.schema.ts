import { z } from 'zod';
import {
  NonEmptyStringSchema,
  NonNegativeNumberSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

export const AssignmentSectionSchema = sectionSchema('assignment', {
  title: NonEmptyStringSchema,
  description: NonEmptyStringSchema,
  xp: NonNegativeNumberSchema,
  duration: NonEmptyStringSchema,
  task: strictObject({
    title: NonEmptyStringSchema,
    description: NonEmptyStringSchema,
    requirements: nonEmptyStringArray(1),
  }),
  objectives: nonEmptyStringArray(1),
  starterCode: NonEmptyStringSchema,
  submissionGuidelines: nonEmptyStringArray(1),
});

export type AssignmentSection = z.infer<typeof AssignmentSectionSchema>;

