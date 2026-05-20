import { z } from 'zod';
import {
  NonEmptyStringSchema,
  NonNegativeNumberSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

export const ProjectSectionSchema = sectionSchema('project', {
  title: NonEmptyStringSchema.optional(),
  description: NonEmptyStringSchema.optional(),
  xp: NonNegativeNumberSchema.optional(),
  deadline: NonEmptyStringSchema.optional(),
  hero: strictObject({
    badge: NonEmptyStringSchema,
    title: NonEmptyStringSchema,
    description: NonEmptyStringSchema,
    image: NonEmptyStringSchema,
  }).optional(),
  realWorldUse: NonEmptyStringSchema.optional(),
  skills: nonEmptyStringArray(1).optional(),
  buildItems: nonEmptyStringArray(1).optional(),
  deliverables: nonEmptyStringArray(1).optional(),
});

export type ProjectSection = z.infer<typeof ProjectSectionSchema>;

