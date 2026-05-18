import { z } from 'zod';
import {
  NonEmptyStringSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

export const InterviewSectionSchema = sectionSchema('interview', {
  title: NonEmptyStringSchema.optional(),
  description: NonEmptyStringSchema.optional(),
  interviewIntroCard: strictObject({
    badge: NonEmptyStringSchema,
    headline: NonEmptyStringSchema,
    overview: NonEmptyStringSchema,
    evaluationFocus: nonEmptyStringArray(1),
  }).optional(),
  questionBankPanel: strictObject({
    title: NonEmptyStringSchema,
    questions: z.array(strictObject({
      id: NonEmptyStringSchema,
      difficulty: z.enum(['easy', 'medium', 'hard']),
      question: NonEmptyStringSchema,
      idealAnswer: NonEmptyStringSchema,
      followUps: nonEmptyStringArray(1),
      mistakesToAvoid: nonEmptyStringArray(1),
    })).min(1),
  }).optional(),
  answerFrameworkCard: strictObject({
    title: NonEmptyStringSchema,
    framework: nonEmptyStringArray(1),
    sampleStructure: NonEmptyStringSchema,
  }).optional(),
  mockInterviewFlow: strictObject({
    title: NonEmptyStringSchema,
    rounds: z.array(strictObject({
      id: NonEmptyStringSchema,
      focus: NonEmptyStringSchema,
      prompt: NonEmptyStringSchema,
      expectedSignal: NonEmptyStringSchema,
    })).min(1),
  }).optional(),
});

export type InterviewSection = z.infer<typeof InterviewSectionSchema>;

