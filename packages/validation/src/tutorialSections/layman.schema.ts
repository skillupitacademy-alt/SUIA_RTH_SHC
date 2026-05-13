import { z } from 'zod';
import {
  NonEmptyStringSchema,
  OptionalNonEmptyStringSchema,
  nonEmptyStringArray,
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
  }),
  everydayAnalogy: strictObject({
    title: NonEmptyStringSchema,
    storyAnalogy: NonEmptyStringSchema,
    comparisonPanel: strictObject({
      realWorld: NonEmptyStringSchema,
      technical: NonEmptyStringSchema,
    }),
    visualMetaphor: NonEmptyStringSchema,
    keyTakeaway: NonEmptyStringSchema,
    image: OptionalNonEmptyStringSchema,
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
    conceptMap: strictObject({
      nodes: z.array(strictObject({
        id: NonEmptyStringSchema,
        label: NonEmptyStringSchema,
        description: NonEmptyStringSchema,
      })).min(1),
      connections: z.array(strictObject({
        from: NonEmptyStringSchema,
        to: NonEmptyStringSchema,
        label: NonEmptyStringSchema,
      })).min(1),
    }),
    visualLabels: nonEmptyStringArray(1),
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
    simpleRecapPoints: nonEmptyStringArray(1),
    confidenceBoost: NonEmptyStringSchema,
    memoryReinforcement: NonEmptyStringSchema,
  }),
});

export type LaymanSection = z.infer<typeof LaymanSectionSchema>;

