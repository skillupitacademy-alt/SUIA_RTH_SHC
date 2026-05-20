import { z } from 'zod';

export const TUTORIAL_SECTION_SCHEMA_VERSION = 1;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema),
  ])
);

export const JsonRecordSchema = z.record(JsonValueSchema);

export const NonEmptyStringSchema = z.string().trim().min(1);
export const OptionalNonEmptyStringSchema = NonEmptyStringSchema.optional();
export const NonNegativeNumberSchema = z.number().finite().min(0);
export const PercentageSchema = z.number().finite().min(0).max(100);

export const TutorialSvgAssetSchema = z.object({
  type: z.literal('inline_svg'),
  name: NonEmptyStringSchema,
  alt: NonEmptyStringSchema,
  width: z.number().int().min(16).max(2400),
  height: z.number().int().min(16).max(2400),
  dataUri: z.string().regex(/^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/, 'Expected a base64 SVG data URI'),
  caption: OptionalNonEmptyStringSchema,
}).strict();

export function optionalSvgAssetField() {
  return z.union([NonEmptyStringSchema, TutorialSvgAssetSchema]).optional();
}

export function nonEmptyStringArray(min = 1) {
  return z.array(NonEmptyStringSchema).min(min);
}

export function strictObject<TShape extends z.ZodRawShape>(shape: TShape) {
  return z.object(shape).strict();
}

export function sectionSchema<TShape extends z.ZodRawShape>(
  sectionType: string,
  shape: TShape
) {
  return strictObject({
    schemaVersion: z.literal(TUTORIAL_SECTION_SCHEMA_VERSION),
    sectionType: z.literal(sectionType),
    ...shape,
  });
}

export const OptionSchema = strictObject({
  id: NonEmptyStringSchema,
  text: NonEmptyStringSchema,
});

export const BadgeSchema = strictObject({
  text: NonEmptyStringSchema,
  type: z.enum(['success', 'warning', 'info']),
});

export const ContentCardTypeSchema = z.enum([
  'notes',
  'layman',
  'example',
  'code',
  'deep-dive',
  'visual',
  'task',
  'practice',
  'assignment',
  'project',
  'quiz',
]);

export const ContentCardSchema = strictObject({
  id: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  type: ContentCardTypeSchema,
  content: OptionalNonEmptyStringSchema,
  code: OptionalNonEmptyStringSchema,
  ctaLabel: NonEmptyStringSchema,
  badge: BadgeSchema.optional(),
});

export const QuestionDifficultySchema = z.enum(['easy', 'medium', 'hard']);
