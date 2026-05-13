import { z } from 'zod';
import { JsonRecordSchema, NonEmptyStringSchema, NonNegativeNumberSchema, strictObject } from './tutorialSections/base';

export const AuthenticatedInteractionHeadersSchema = z.object({
  userId: NonEmptyStringSchema,
});

export const QuizInteractionRequestSchema = strictObject({
  sectionId: NonEmptyStringSchema,
  questionId: NonEmptyStringSchema,
  selectedAnswer: NonEmptyStringSchema,
  correctAnswer: NonEmptyStringSchema,
  timeSpent: NonNegativeNumberSchema.default(0),
});

export const PracticeInteractionRequestSchema = strictObject({
  sectionId: NonEmptyStringSchema,
  questionId: NonEmptyStringSchema,
  selectedAnswer: NonEmptyStringSchema,
  correctAnswer: NonEmptyStringSchema,
  timeSpent: NonNegativeNumberSchema.default(0),
  feedbackViewed: z.boolean().default(false),
});

export const CodeInteractionRequestSchema = strictObject({
  sectionId: NonEmptyStringSchema,
  codeExampleId: NonEmptyStringSchema,
  userCode: z.string(),
  executed: z.boolean().default(false),
  executionResult: strictObject({
    success: z.boolean(),
    output: z.string().optional(),
    error: z.string().optional(),
  }).optional(),
  timeSpent: NonNegativeNumberSchema.default(0),
});

export const VisualInteractionRequestSchema = strictObject({
  sectionId: NonEmptyStringSchema,
  componentId: NonEmptyStringSchema,
  interactionType: z.enum(['view', 'expand', 'navigate', 'interact']),
  interactionData: JsonRecordSchema.optional(),
  timeSpent: NonNegativeNumberSchema.default(0),
});

export const CompletionInteractionRequestSchema = strictObject({
  sectionId: NonEmptyStringSchema,
  subsectionId: NonEmptyStringSchema.optional(),
  timeSpent: NonNegativeNumberSchema.default(0),
  score: z.number().finite().min(0).max(100).optional(),
});

export type QuizInteractionRequest = z.infer<typeof QuizInteractionRequestSchema>;
export type PracticeInteractionRequest = z.infer<typeof PracticeInteractionRequestSchema>;
export type CodeInteractionRequest = z.infer<typeof CodeInteractionRequestSchema>;
export type VisualInteractionRequest = z.infer<typeof VisualInteractionRequestSchema>;
export type CompletionInteractionRequest = z.infer<typeof CompletionInteractionRequestSchema>;
