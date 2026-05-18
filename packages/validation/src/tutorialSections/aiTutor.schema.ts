import { z } from 'zod';
import {
  NonEmptyStringSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

export const AITutorSectionSchema = sectionSchema('ai_tutor', {
  greeting: NonEmptyStringSchema.optional(),
  qaPairs: z.array(strictObject({
    question: NonEmptyStringSchema,
    answer: NonEmptyStringSchema,
  })).min(1).optional(),
  tutorPromptCard: strictObject({
    title: NonEmptyStringSchema,
    systemPrompt: NonEmptyStringSchema,
    starterQuestions: nonEmptyStringArray(1),
  }).optional(),
  misconceptionDetector: strictObject({
    title: NonEmptyStringSchema,
    misconceptions: z.array(strictObject({
      id: NonEmptyStringSchema,
      wrongBelief: NonEmptyStringSchema,
      correction: NonEmptyStringSchema,
      example: NonEmptyStringSchema,
    })).min(1),
  }).optional(),
  adaptiveHintPanel: strictObject({
    title: NonEmptyStringSchema,
    hints: z.array(strictObject({
      level: z.number().int().positive(),
      hint: NonEmptyStringSchema,
    })).min(1),
  }).optional(),
});

export type AITutorSection = z.infer<typeof AITutorSectionSchema>;

