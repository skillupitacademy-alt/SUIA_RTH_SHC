import { z } from 'zod';
import {
  NonEmptyStringSchema,
  NonNegativeNumberSchema,
  OptionSchema,
  sectionSchema,
  strictObject,
} from './base';

export const QuizQuestionSchema = strictObject({
  id: NonEmptyStringSchema,
  questionNumber: z.number().int().positive(),
  type: NonEmptyStringSchema,
  points: z.number().int().positive(),
  question: NonEmptyStringSchema,
  code: NonEmptyStringSchema.optional(),
  options: z.array(OptionSchema).min(2),
  correctAnswer: NonEmptyStringSchema,
  explanation: NonEmptyStringSchema,
  status: NonEmptyStringSchema.optional(),
});

export const QuizSectionSchema = sectionSchema('quiz', {
  title: NonEmptyStringSchema.optional(),
  description: NonEmptyStringSchema.optional(),
  totalQuestions: z.number().int().positive().optional(),
  duration: NonEmptyStringSchema.optional(),
  xp: NonNegativeNumberSchema.optional(),
  questions: z.array(QuizQuestionSchema).min(1).optional(),
});

export type QuizSection = z.infer<typeof QuizSectionSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

