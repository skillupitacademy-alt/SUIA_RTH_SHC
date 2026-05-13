import { z } from 'zod';
import {
  NonEmptyStringSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

export const InterviewSectionSchema = sectionSchema('interview', {
  title: NonEmptyStringSchema,
  description: NonEmptyStringSchema,
  interviewIntroCard: strictObject({
    badge: NonEmptyStringSchema,
    headline: NonEmptyStringSchema,
    overview: NonEmptyStringSchema,
    evaluationFocus: nonEmptyStringArray(1),
  }),
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
  }),
  answerFrameworkCard: strictObject({
    title: NonEmptyStringSchema,
    framework: nonEmptyStringArray(1),
    sampleStructure: NonEmptyStringSchema,
  }),
  mockInterviewFlow: strictObject({
    title: NonEmptyStringSchema,
    rounds: z.array(strictObject({
      id: NonEmptyStringSchema,
      focus: NonEmptyStringSchema,
      prompt: NonEmptyStringSchema,
      expectedSignal: NonEmptyStringSchema,
    })).min(1),
  }),
});

export type InterviewSection = z.infer<typeof InterviewSectionSchema>;

