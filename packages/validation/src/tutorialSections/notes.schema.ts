import { z } from 'zod';
import {
  NonEmptyStringSchema,
  nonEmptyStringArray,
  optionalSvgAssetField,
  sectionSchema,
  strictObject,
} from './base';

const NotesHeroSchema = strictObject({
  heroTitle: NonEmptyStringSchema,
  heroSubtitle: NonEmptyStringSchema,
  quickLook: nonEmptyStringArray(1),
});

const CoreDefinitionSchema = strictObject({
  badge: NonEmptyStringSchema,
  headline: NonEmptyStringSchema,
  definition: NonEmptyStringSchema,
  simpleExplanation: NonEmptyStringSchema,
  whyItMatters: NonEmptyStringSchema,
});

const SystemMechanicItemSchema = strictObject({
  id: NonEmptyStringSchema,
  label: NonEmptyStringSchema,
  detail: NonEmptyStringSchema,
  iconName: NonEmptyStringSchema.optional(),
});

const SystemMechanicsSchema = strictObject({
  panelTitle: NonEmptyStringSchema,
  description: NonEmptyStringSchema,
  mechanics: z.array(SystemMechanicItemSchema).min(1),
});

const SyntaxBreakdownItemSchema = strictObject({
  part: NonEmptyStringSchema,
  explanation: NonEmptyStringSchema,
});

const SyntaxStructureSchema = strictObject({
  title: NonEmptyStringSchema,
  codeSnippet: NonEmptyStringSchema,
  language: NonEmptyStringSchema,
  breakdown: z.array(SyntaxBreakdownItemSchema).min(1),
});

const KeyComponentItemSchema = strictObject({
  id: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  description: NonEmptyStringSchema,
  points: nonEmptyStringArray(1).optional(),
});

const KeyComponentsSchema = strictObject({
  title: NonEmptyStringSchema,
  description: NonEmptyStringSchema.optional(),
  components: z.array(KeyComponentItemSchema).min(1),
});

const BestPracticeItemSchema = strictObject({
  id: NonEmptyStringSchema,
  label: NonEmptyStringSchema,
  tip: NonEmptyStringSchema,
});

const BestPracticesSchema = strictObject({
  title: NonEmptyStringSchema,
  practices: z.array(BestPracticeItemSchema).min(1),
});

const CommonMistakeItemSchema = strictObject({
  id: NonEmptyStringSchema,
  mistake: NonEmptyStringSchema,
  fix: NonEmptyStringSchema,
});

const CommonMistakesSchema = strictObject({
  title: NonEmptyStringSchema,
  mistakes: z.array(CommonMistakeItemSchema).min(1),
});

const VisualSummarySchema = strictObject({
  summaryTitle: NonEmptyStringSchema,
  conceptDiagramDescription: NonEmptyStringSchema,
  keyTakeaways: nonEmptyStringArray(1),
  image: optionalSvgAssetField(),
});

export const NotesSectionSchema = sectionSchema('notes', {
  concept_card: NotesHeroSchema.optional(),
  definition_block: CoreDefinitionSchema.optional(),
  component_grid: SystemMechanicsSchema.optional(),
  syntax_block: SyntaxStructureSchema.optional(),
  example_panel: KeyComponentsSchema.optional(),
  practice_card: BestPracticesSchema.optional(),
  warning_faq: CommonMistakesSchema.optional(),
  summary_card: VisualSummarySchema.optional(),
  uiux_contract: z.record(z.unknown()).optional(),
}).refine(
  (value) => [
    value.concept_card,
    value.definition_block,
    value.component_grid,
    value.syntax_block,
    value.example_panel,
    value.practice_card,
    value.warning_faq,
    value.summary_card,
  ].some(Boolean),
  { message: 'At least one canonical Notes component is required.' }
);

export type NotesSection = z.infer<typeof NotesSectionSchema>;
