import { z } from 'zod';
import {
  NonEmptyStringSchema,
  OptionalNonEmptyStringSchema,
  nonEmptyStringArray,
  optionalSvgAssetField,
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
    image: optionalSvgAssetField(),
  }),

  // Premium Visual Architecture Blocks (Optional)
  summaryHeroInfographic: z.object({
    image: z.string().optional(),
    summaryTitle: z.string().optional(),
    examTips: z.array(z.string()).optional(),
    howItWorks: z.array(z.object({
      step: z.number(),
      label: z.string(),
      description: z.string(),
    })).optional(),
  }).optional(),

  conceptMemoryMap: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    })).optional(),
    connections: z.array(z.object({
      from: z.string(),
      to: z.string(),
      label: z.string().optional(),
    })).optional(),
  }).optional(),

  cheatSheetSVG: z.object({
    title: z.string().optional(),
    svgPath: z.string().optional(),
    sections: z.array(z.any()).optional(),
  }).optional(),

  flashcardVisualSystem: z.object({
    cards: z.array(z.object({
      id: z.string(),
      question: z.string(),
      answer: z.string(),
    })),
  }).optional(),

  comparisonSummaryChart: z.object({
    title: z.string().optional(),
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }).optional(),

  mnemonicRetentionGraphic: z.object({
    mnemonicTitle: z.string().optional(),
    memoryHook: z.string().optional(),
    rememberItems: z.array(z.object({
      letter: z.string(),
      label: z.string(),
      description: z.string(),
    })),
    keyPoints: z.array(z.string()),
  }).optional(),
});

export type NotesSection = z.infer<typeof NotesSectionSchema>;
