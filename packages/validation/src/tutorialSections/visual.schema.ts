import { z } from 'zod';
import {
  NonEmptyStringSchema,
  OptionalNonEmptyStringSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

export const VisualSectionSchema = sectionSchema('visual', {
  conceptVisualIntro: strictObject({
    badge: NonEmptyStringSchema,
    headline: NonEmptyStringSchema,
    visualDefinition: NonEmptyStringSchema,
    heroDiagramPreview: OptionalNonEmptyStringSchema,
    importanceBlock: NonEmptyStringSchema,
    progressIndicator: OptionalNonEmptyStringSchema,
  }),
  diagrammaticBreakdown: strictObject({
    title: NonEmptyStringSchema,
    diagramTitle: NonEmptyStringSchema,
    componentLabels: z.array(strictObject({
      id: NonEmptyStringSchema,
      label: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
    })).min(1),
    stepMarkers: nonEmptyStringArray(1),
    technicalTooltips: z.array(strictObject({
      id: NonEmptyStringSchema,
      term: NonEmptyStringSchema,
      explanation: NonEmptyStringSchema,
    })).min(1),
  }),
  stepByStepVisualFlow: strictObject({
    title: NonEmptyStringSchema,
    sequenceTitle: NonEmptyStringSchema,
    steps: z.array(strictObject({
      id: NonEmptyStringSchema,
      stepNumber: z.number().int().positive(),
      title: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
      visualCue: NonEmptyStringSchema,
    })).min(1),
    phaseExplanations: nonEmptyStringArray(1),
  }),
  comparativeVisualization: strictObject({
    title: NonEmptyStringSchema,
    comparisonTitle: NonEmptyStringSchema,
    sideBySideVisuals: strictObject({
      option1: strictObject({
        title: NonEmptyStringSchema,
        description: NonEmptyStringSchema,
        pros: nonEmptyStringArray(1),
        cons: nonEmptyStringArray(1),
      }),
      option2: strictObject({
        title: NonEmptyStringSchema,
        description: NonEmptyStringSchema,
        pros: nonEmptyStringArray(1),
        cons: nonEmptyStringArray(1),
      }),
    }),
    differenceHighlights: nonEmptyStringArray(1),
  }),
  mentalModelVisualization: strictObject({
    title: NonEmptyStringSchema,
    frameworkMap: strictObject({
      nodes: z.array(strictObject({
        id: NonEmptyStringSchema,
        label: NonEmptyStringSchema,
        description: NonEmptyStringSchema,
        type: z.enum(['core', 'supporting', 'related']),
      })).min(1),
      connections: z.array(strictObject({
        from: NonEmptyStringSchema,
        to: NonEmptyStringSchema,
        label: NonEmptyStringSchema,
        type: z.enum(['primary', 'secondary']),
      })).min(1),
    }),
    memoryLabels: nonEmptyStringArray(1),
  }),
  realWorldVisualMapping: strictObject({
    title: NonEmptyStringSchema,
    practicalScenarios: z.array(strictObject({
      id: NonEmptyStringSchema,
      title: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
      industryContext: NonEmptyStringSchema,
      visualRepresentation: NonEmptyStringSchema,
      icon: NonEmptyStringSchema,
    })).min(1),
    careerRelevance: NonEmptyStringSchema,
  }),
  commonConfusionVisualization: strictObject({
    title: NonEmptyStringSchema,
    confusionItems: z.array(strictObject({
      id: NonEmptyStringSchema,
      confusion: NonEmptyStringSchema,
      visualClarification: NonEmptyStringSchema,
      correctVisualization: NonEmptyStringSchema,
    })).min(1),
    faqItems: z.array(strictObject({
      id: NonEmptyStringSchema,
      question: NonEmptyStringSchema,
      answer: NonEmptyStringSchema,
    })).min(1),
    misconceptionDiagrams: nonEmptyStringArray(1),
  }),
  visualSummary: strictObject({
    summaryTitle: NonEmptyStringSchema,
    keyVisualTakeaways: nonEmptyStringArray(1),
    revisionInfographic: NonEmptyStringSchema,
    memoryReinforcement: NonEmptyStringSchema,
    examVisualChecklist: nonEmptyStringArray(1),
  }),
});

export type VisualSection = z.infer<typeof VisualSectionSchema>;

