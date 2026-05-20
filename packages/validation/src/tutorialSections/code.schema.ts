import { z } from 'zod';
import {
  NonEmptyStringSchema,
  OptionalNonEmptyStringSchema,
  nonEmptyStringArray,
  optionalSvgAssetField,
  sectionSchema,
  strictObject,
} from './base';

export const CodeSectionSchema = sectionSchema('code', {
  problemContext: strictObject({
    title: NonEmptyStringSchema,
    scenario: NonEmptyStringSchema,
    requirements: nonEmptyStringArray(1),
    constraints: OptionalNonEmptyStringSchema,
  }).optional(),
  basicCodeExample: strictObject({
    title: NonEmptyStringSchema,
    description: NonEmptyStringSchema,
    code: NonEmptyStringSchema,
    language: NonEmptyStringSchema,
    explanation: NonEmptyStringSchema,
  }).optional(),
  lineByLineExplanation: strictObject({
    title: NonEmptyStringSchema,
    lines: z.array(strictObject({
      id: NonEmptyStringSchema,
      lineNumber: z.number().int().positive(),
      code: NonEmptyStringSchema,
      explanation: NonEmptyStringSchema,
    })).min(1),
  }).optional(),
  outputDemonstration: strictObject({
    title: NonEmptyStringSchema,
    input: NonEmptyStringSchema,
    output: NonEmptyStringSchema,
    explanation: NonEmptyStringSchema,
    visualRepresentation: NonEmptyStringSchema,
    previewAsset: optionalSvgAssetField(),
  }).optional(),
  bestPracticeVersion: strictObject({
    title: NonEmptyStringSchema,
    improvements: nonEmptyStringArray(1),
    code: NonEmptyStringSchema,
    explanation: NonEmptyStringSchema,
    benefits: nonEmptyStringArray(1),
  }).optional(),
  commonMistakes: strictObject({
    title: NonEmptyStringSchema,
    mistakes: z.array(strictObject({
      id: NonEmptyStringSchema,
      mistake: NonEmptyStringSchema,
      badCode: NonEmptyStringSchema,
      goodCode: NonEmptyStringSchema,
      why: NonEmptyStringSchema,
      lesson: NonEmptyStringSchema,
    })).min(1),
  }).optional(),
  realWorldImplementation: strictObject({
    title: NonEmptyStringSchema,
    scenario: NonEmptyStringSchema,
    code: NonEmptyStringSchema,
    features: nonEmptyStringArray(1),
    explanation: NonEmptyStringSchema,
    scalability: NonEmptyStringSchema,
  }).optional(),
  codeSummary: strictObject({
    title: NonEmptyStringSchema,
    keyTakeaways: nonEmptyStringArray(1),
    practiceExercise: NonEmptyStringSchema,
    nextSteps: nonEmptyStringArray(1),
  }).optional(),
});

export type CodeSection = z.infer<typeof CodeSectionSchema>;
