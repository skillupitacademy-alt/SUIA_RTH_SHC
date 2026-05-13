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
  title: NonEmptyStringSchema,
  description: NonEmptyStringSchema,
  totalQuestions: z.number().int().positive(),
  duration: NonEmptyStringSchema,
  xp: NonNegativeNumberSchema,
  questions: z.array(QuizQuestionSchema).min(1),
});

export type QuizSection = z.infer<typeof QuizSectionSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

