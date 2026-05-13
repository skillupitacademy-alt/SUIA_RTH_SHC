import { z } from 'zod';
import {
  NonEmptyStringSchema,
  OptionalNonEmptyStringSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

export const NotesSectionSchema = sectionSchema('notes', {
  simpleWords: NonEmptyStringSchema,
  definitionBlock: strictObject({
    badge: NonEmptyStringSchema,
    headline: NonEmptyStringSchema,
    definitionText: NonEmptyStringSchema,
    importanceCallout: NonEmptyStringSchema,
    quickSummary: nonEmptyStringArray(1),
  }),
  sections: z.array(strictObject({
    id: NonEmptyStringSchema,
    title: NonEmptyStringSchema,
    content: NonEmptyStringSchema,
    keyPoint: OptionalNonEmptyStringSchema,
    codeExample: strictObject({
      code: NonEmptyStringSchema,
      output: NonEmptyStringSchema,
    }).optional(),
  })).min(1),
  componentGrid: strictObject({
    gridTitle: NonEmptyStringSchema,
    componentCards: z.array(strictObject({
      id: NonEmptyStringSchema,
      title: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
      icon: NonEmptyStringSchema,
      subcomponents: nonEmptyStringArray(1),
    })).min(1),
  }),
  examplePanel: strictObject({
    exampleTitle: NonEmptyStringSchema,
    scenarios: z.array(strictObject({
      id: NonEmptyStringSchema,
      title: NonEmptyStringSchema,
      scenarioDescription: NonEmptyStringSchema,
      practicalSolution: NonEmptyStringSchema,
      industryContext: NonEmptyStringSchema,
    })).min(1),
  }),
  practiceCard: strictObject({
    bestPracticeTitle: NonEmptyStringSchema,
    recommendations: z.array(strictObject({
      id: NonEmptyStringSchema,
      title: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
    })).min(1),
    optimizationTips: nonEmptyStringArray(1),
    industryStandards: nonEmptyStringArray(1),
  }),
  warningFaq: strictObject({
    commonErrors: z.array(strictObject({
      id: NonEmptyStringSchema,
      error: NonEmptyStringSchema,
      solution: NonEmptyStringSchema,
    })).min(1),
    faqItems: z.array(strictObject({
      id: NonEmptyStringSchema,
      question: NonEmptyStringSchema,
      answer: NonEmptyStringSchema,
    })).min(1),
    misconceptionAlerts: nonEmptyStringArray(1),
  }),
  summaryCard: strictObject({
    summaryTitle: NonEmptyStringSchema,
    keyTakeaways: nonEmptyStringArray(1),
    revisionChecklist: z.array(strictObject({
      id: NonEmptyStringSchema,
      item: NonEmptyStringSchema,
      checked: z.boolean(),
    })).min(1),
    memoryReinforcement: NonEmptyStringSchema,
    examTips: nonEmptyStringArray(1),
  }),
});

export type NotesSection = z.infer<typeof NotesSectionSchema>;

