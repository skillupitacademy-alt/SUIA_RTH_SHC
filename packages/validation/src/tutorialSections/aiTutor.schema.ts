import { z } from 'zod';
import {
  NonEmptyStringSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

export const AITutorSectionSchema = sectionSchema('ai_tutor', {
  greeting: NonEmptyStringSchema,
  qaPairs: z.array(strictObject({
    question: NonEmptyStringSchema,
    answer: NonEmptyStringSchema,
  })).min(1),
  tutorPromptCard: strictObject({
    title: NonEmptyStringSchema,
    systemPrompt: NonEmptyStringSchema,
    starterQuestions: nonEmptyStringArray(1),
  }),
  misconceptionDetector: strictObject({
    title: NonEmptyStringSchema,
    misconceptions: z.array(strictObject({
      id: NonEmptyStringSchema,
      wrongBelief: NonEmptyStringSchema,
      correction: NonEmptyStringSchema,
      example: NonEmptyStringSchema,
    })).min(1),
  }),
  adaptiveHintPanel: strictObject({
    title: NonEmptyStringSchema,
    hints: z.array(strictObject({
      level: z.number().int().positive(),
      hint: NonEmptyStringSchema,
    })).min(1),
  }),
});

export type AITutorSection = z.infer<typeof AITutorSectionSchema>;

