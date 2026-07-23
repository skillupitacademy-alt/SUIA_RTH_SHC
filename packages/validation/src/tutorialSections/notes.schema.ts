import { z } from 'zod';
import {
  NonEmptyStringSchema,
  OptionalNonEmptyStringSchema,
  nonEmptyStringArray,
  optionalSvgAssetField,
  sectionSchema,
  strictObject,
} from './base';

const NotesCheatSheetItemSchema = strictObject({
  id: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  code: NonEmptyStringSchema,
  description: OptionalNonEmptyStringSchema,
});

export const NotesSectionSchema = sectionSchema('notes', {
  simpleWords: NonEmptyStringSchema.optional(),
  definitionBlock: strictObject({
    badge: NonEmptyStringSchema,
    headline: NonEmptyStringSchema,
    definitionText: NonEmptyStringSchema,
    importanceCallout: NonEmptyStringSchema,
    quickSummary: nonEmptyStringArray(1),
  }).optional(),
  sections: z.array(strictObject({
    id: NonEmptyStringSchema,
    title: NonEmptyStringSchema,
    content: NonEmptyStringSchema,
    keyPoint: OptionalNonEmptyStringSchema,
    codeExample: strictObject({
      code: NonEmptyStringSchema,
      output: NonEmptyStringSchema,
    }).optional(),
  })).min(1).optional(),
  componentGrid: strictObject({
    gridTitle: NonEmptyStringSchema,
    componentCards: z.array(strictObject({
      id: NonEmptyStringSchema,
      title: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
      icon: NonEmptyStringSchema,
      subcomponents: nonEmptyStringArray(1),
    })).min(1),
  }).optional(),
  examplePanel: strictObject({
    exampleTitle: NonEmptyStringSchema,
    scenarios: z.array(strictObject({
      id: NonEmptyStringSchema,
      title: NonEmptyStringSchema,
      scenarioDescription: NonEmptyStringSchema,
      practicalSolution: NonEmptyStringSchema,
      industryContext: NonEmptyStringSchema,
    })).min(1),
  }).optional(),
  practiceCard: strictObject({
    bestPracticeTitle: NonEmptyStringSchema,
    recommendations: z.array(strictObject({
      id: NonEmptyStringSchema,
      title: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
    })).min(1),
    optimizationTips: nonEmptyStringArray(1),
    industryStandards: nonEmptyStringArray(1),
  }).optional(),
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
  }).optional(),
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
  }).optional(),

  // Premium Visual Architecture Blocks (Optional)
  summaryHeroInfographic: strictObject({
    image: optionalSvgAssetField(),
    summaryTitle: OptionalNonEmptyStringSchema,
    examTips: nonEmptyStringArray(1).optional(),
    howItWorks: z.array(strictObject({
      step: z.number(),
      label: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
    })).optional(),
  }).optional(),

  conceptMemoryMap: strictObject({
    image: optionalSvgAssetField(),
    nodes: z.array(strictObject({
      id: NonEmptyStringSchema,
      label: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
    })).optional(),
    connections: z.array(strictObject({
      from: NonEmptyStringSchema,
      to: NonEmptyStringSchema,
      label: OptionalNonEmptyStringSchema,
    })).optional(),
  }).optional(),

  cheatSheetSVG: strictObject({
    title: OptionalNonEmptyStringSchema,
    image: optionalSvgAssetField(),
    svgPath: OptionalNonEmptyStringSchema,
    sections: z.array(NotesCheatSheetItemSchema).min(1).optional(),
  }).optional(),

  flashcardVisualSystem: strictObject({
    image: optionalSvgAssetField(),
    cards: z.array(strictObject({
      id: NonEmptyStringSchema,
      question: NonEmptyStringSchema,
      answer: NonEmptyStringSchema,
    })).min(1),
  }).optional(),

  comparisonSummaryChart: strictObject({
    image: optionalSvgAssetField(),
    title: OptionalNonEmptyStringSchema,
    columns: nonEmptyStringArray(1),
    rows: z.array(nonEmptyStringArray(1)).min(1),
  }).optional(),

  mnemonicRetentionGraphic: strictObject({
    image: optionalSvgAssetField(),
    mnemonicTitle: OptionalNonEmptyStringSchema,
    memoryHook: OptionalNonEmptyStringSchema,
    rememberItems: z.array(strictObject({
      letter: NonEmptyStringSchema,
      label: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
    })).min(1),
    keyPoints: nonEmptyStringArray(1),
  }).optional(),

  syntaxBlock: strictObject({
    image: optionalSvgAssetField(),
    code: NonEmptyStringSchema,
    language: OptionalNonEmptyStringSchema,
    title: OptionalNonEmptyStringSchema,
    subtitle: OptionalNonEmptyStringSchema,
    explanations: z.array(strictObject({
      id: NonEmptyStringSchema,
      term: NonEmptyStringSchema,
      explanation: NonEmptyStringSchema,
    })).min(1),
  }).optional(),

  footerBlock: strictObject({
    image: optionalSvgAssetField(),
    finalNote: NonEmptyStringSchema,
    nextStepLabel: NonEmptyStringSchema,
    nextStepTarget: NonEmptyStringSchema,
  }).optional(),
});

export type NotesSection = z.infer<typeof NotesSectionSchema>;
