import { z } from 'zod';
import {
  NonEmptyStringSchema,
  NonNegativeNumberSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

export const ProjectSectionSchema = sectionSchema('project', {
  title: NonEmptyStringSchema,
  description: NonEmptyStringSchema,
  xp: NonNegativeNumberSchema,
  deadline: NonEmptyStringSchema,
  hero: strictObject({
    badge: NonEmptyStringSchema,
    title: NonEmptyStringSchema,
    description: NonEmptyStringSchema,
    image: NonEmptyStringSchema,
  }),
  realWorldUse: NonEmptyStringSchema,
  skills: nonEmptyStringArray(1),
  buildItems: nonEmptyStringArray(1),
  deliverables: nonEmptyStringArray(1),
});

export type ProjectSection = z.infer<typeof ProjectSectionSchema>;

