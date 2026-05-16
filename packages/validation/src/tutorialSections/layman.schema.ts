import { z } from 'zod';
import {
  NonEmptyStringSchema,
  nonEmptyStringArray,
  OptionalNonEmptyStringSchema,
  optionalSvgAssetField,
  sectionSchema,
  strictObject,
} from './base';

export const LaymanSectionSchema = sectionSchema('layman', {
  simpleOverview: strictObject({
    badge: NonEmptyStringSchema,
    headline: NonEmptyStringSchema,
    simpleDefinition: NonEmptyStringSchema,
    subExplanation: NonEmptyStringSchema,
    importanceBlock: NonEmptyStringSchema,
    progressIndicator: OptionalNonEmptyStringSchema,
    heroVisual: optionalSvgAssetField(),
  }),
  everydayAnalogy: strictObject({
    title: NonEmptyStringSchema,
    storyAnalogy: NonEmptyStringSchema,
    comparisonPanel: NonEmptyStringSchema,
    visualMetaphor: z.array(strictObject({
      label: NonEmptyStringSchema,
      comparison: NonEmptyStringSchema,
    })).min(1),
    keyTakeaway: NonEmptyStringSchema,
    image: optionalSvgAssetField(),
  }),
  whyItExists: strictObject({
    sectionTitle: NonEmptyStringSchema,
    benefitCards: z.array(strictObject({
      id: NonEmptyStringSchema,
      title: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
      icon: NonEmptyStringSchema,
      type: z.enum(['career', 'practical', 'future']),
    })).min(1),
  }),
  simpleUseCases: strictObject({
    gridTitle: NonEmptyStringSchema,
    useCaseCards: z.array(strictObject({
      id: NonEmptyStringSchema,
      title: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
      category: z.enum(['everyday', 'career']),
      icon: NonEmptyStringSchema,
    })).min(1),
  }),
  beginnerBreakdown: strictObject({
    title: NonEmptyStringSchema,
    steps: z.array(strictObject({
      id: NonEmptyStringSchema,
      stepTitle: NonEmptyStringSchema,
      stepExplanation: NonEmptyStringSchema,
      microLearningChunk: NonEmptyStringSchema,
    })).min(1),
  }),
  mentalModel: strictObject({
    title: NonEmptyStringSchema,
    conceptMap: z.array(strictObject({
      id: NonEmptyStringSchema,
      label: NonEmptyStringSchema,
      type: OptionalNonEmptyStringSchema,
    })).min(1),
    visualLabels: z.array(strictObject({
      from: NonEmptyStringSchema,
      to: NonEmptyStringSchema,
      label: NonEmptyStringSchema,
    })).min(1),
    flowArrows: z.array(strictObject({
      id: NonEmptyStringSchema,
      label: NonEmptyStringSchema,
      icon: NonEmptyStringSchema,
    })).optional(),
    image: optionalSvgAssetField(),
    tooltips: OptionalNonEmptyStringSchema,
  }),
  commonConfusions: strictObject({
    title: NonEmptyStringSchema,
    confusionItems: z.array(strictObject({
      id: NonEmptyStringSchema,
      confusion: NonEmptyStringSchema,
      clarification: NonEmptyStringSchema,
    })).min(1),
    faqItems: z.array(strictObject({
      id: NonEmptyStringSchema,
      question: NonEmptyStringSchema,
      answer: NonEmptyStringSchema,
    })).min(1),
    misconceptionAlerts: nonEmptyStringArray(1),
  }),
  simpleRecap: strictObject({
    summaryTitle: NonEmptyStringSchema,
    keyTakeaways: nonEmptyStringArray(1),
    simpleRecapPoints: z.array(strictObject({
      id: NonEmptyStringSchema,
      item: NonEmptyStringSchema,
      checked: z.boolean(),
    })).min(1),
    confidenceBoost: NonEmptyStringSchema,
    memoryReinforcement: NonEmptyStringSchema,
  }),
});

export type LaymanSection = z.infer<typeof LaymanSectionSchema>;
