/**
 * Tutorial Rich Document - Block Zod Schemas (Main Export)
 * Combines content and container block schemas with recursive support
 */

import { z } from 'zod';
import {
  BlockIdSchema,
  BlockProgressRoleSchema,
  ContentBlockSchema,
  HeadingBlockSchema,
  ParagraphBlockSchema,
  ListBlockSchema,
  CodeBlockSchema,
  TableBlockSchema,
  ImageBlockSchema,
  CalloutBlockSchema,
  DefinitionBlockSchema,
  ExampleBlockSchema,
  QuoteBlockSchema,
  SummaryBlockSchema,
  DiagramBlockSchema,
  ComparisonBlockSchema,
} from './content-blocks.schema';
import { IntroductionI1BlockSchema } from './introduction-i1.schema';
import { ObjectiveO1BlockSchema } from './objective-o1.schema';
import {
  bindTutorialBlockSchema,
  ContainerBlockSchema,
  TwoColumnBlockSchema,
  ThreeColumnBlockSchema,
  CardGridBlockSchema,
  TimelineBlockSchema,
} from './container-blocks.schema';
import {
  CodeC1AuthorContentSchema,
  CodeC1BlockSchema,
  HistoricalTutorialCodePayloadSchema,
} from './code-c1.schema';
import { PresentationConfigSchema } from './presentation.schema';

// Re-export individual block schemas
export * from './content-blocks.schema';
export * from './container-blocks.schema';
export * from './code-c1.schema';
export * from './introduction-i1.schema';
export * from './objective-o1.schema';

const CompatibleDefinitionD1PageSchema = z.object({
  type: z.enum(['definition', 'Definition']).optional(),
  category: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200),
  intro: z.string().max(1000).optional(),
  definition: z.string().min(1).max(3000),
  explanation: z.array(z.string().min(1).max(2000)).optional(),
  example: z.object({
    language: z.string().min(1).max(50),
    code: z.string(),
  }).strict().optional(),
  characteristics: z.array(
    z.object({
      icon: z.string().min(1).max(20).optional(),
      title: z.string().min(1).max(100),
      description: z.string().min(1).max(500),
    }).strict()
  ).optional(),
  takeaway: z.string().max(1000).optional(),
}).strict();

const CompatibleDefinitionD1BlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('definition'),
  version: z.literal('D1').optional(),
  content: z.object({
    page: CompatibleDefinitionD1PageSchema,
  }).strict(),
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: BlockProgressRoleSchema.default('instructional').optional(),
});

const CompatibleHistoricalCodeContentSchema = z.object({
  page: z.object({
    type: z.string().min(1),
    title: z.string().min(1),
    introduction: z.string().optional(),
  }).passthrough(),
  code: z.object({
    language: z.string().min(1),
    prismLanguage: z.string().optional(),
    source: z.string(),
  }).strict(),
}).passthrough();

const CompatibleCodeC1BlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('code'),
  version: z.literal('C1'),
  content: z.union([
    CodeC1AuthorContentSchema,
    HistoricalTutorialCodePayloadSchema,
    CompatibleHistoricalCodeContentSchema,
  ]),
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: BlockProgressRoleSchema.default('instructional').optional(),
});

const LegacyHistoricalCodeBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('code'),
  version: z.undefined().optional(),
  content: CompatibleHistoricalCodeContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: BlockProgressRoleSchema.default('instructional').optional(),
});

const CompatibleIntroductionI1BlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('introduction'),
  version: z.literal('I1').optional(),
  content: z.object({
    page: z.object({
      badge: z.string().min(1).max(100).optional(),
      title: z.string().min(1).max(200),
      subtitle: z.string().min(1).max(500).optional(),
      learningGoal: z.string().min(1).max(1000).optional(),
      motto: z.object({
        lines: z.array(z.string().min(1).max(50)).min(1).max(4),
      }).strict().optional(),
      topic: z.object({
        title: z.string().min(1).max(100).optional(),
        description: z.string().min(1).max(1000),
        quote: z.string().max(500).optional(),
      }).strict().optional(),
      whereFit: z.record(z.unknown()).optional(),
      solution: z.record(z.unknown()).optional(),
      whereUsed: z.record(z.unknown()).optional(),
      roadmap: z.record(z.unknown()).optional(),
      whyMatters: z.record(z.unknown()).optional(),
      keyTakeaway: z.string().max(1000).optional(),
    }).strict(),
  }).strict(),
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: BlockProgressRoleSchema.default('instructional').optional(),
});

/**
 * Union of Code blocks: legacy CodeBlock + historical legacy CodeBlock + versioned CodeC1Block
 * Note: Canonical C1 page payload without top-level `code: { language, source }` requires `version: 'C1'`.
 */
const CodeBlockUnionSchema = z.union([
  CodeBlockSchema,
  CodeC1BlockSchema,
  CompatibleCodeC1BlockSchema,
  LegacyHistoricalCodeBlockSchema,
]);

const activeBlockAncestors = new Set<object>();

const RawTutorialBlockUnionSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    // Type-based blocks
    HeadingBlockSchema,
    ParagraphBlockSchema,
    ListBlockSchema,
    TableBlockSchema,
    ImageBlockSchema,
    CalloutBlockSchema,
    DefinitionBlockSchema,
    CompatibleDefinitionD1BlockSchema,
    IntroductionI1BlockSchema,
    CompatibleIntroductionI1BlockSchema,
    ObjectiveO1BlockSchema,
    ExampleBlockSchema,
    QuoteBlockSchema,
    SummaryBlockSchema,
    DiagramBlockSchema,
    ComparisonBlockSchema,
    // Code blocks (legacy + versioned)
    CodeBlockUnionSchema,
    // Container blocks
    TwoColumnBlockSchema,
    ThreeColumnBlockSchema,
    CardGridBlockSchema,
    TimelineBlockSchema,
  ])
);

/**
 * Complete TutorialBlock schema with recursive support and cycle protection
 * This is the main schema used for validation
 */
export const TutorialBlockSchema: z.ZodType<any> = z.unknown().superRefine((val, ctx) => {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Block must be a non-null object',
    });
    return;
  }

  if (activeBlockAncestors.has(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Circular block reference detected',
    });
    return;
  }

  activeBlockAncestors.add(val);
  try {
    const parsed = RawTutorialBlockUnionSchema.safeParse(val);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue(issue);
      }
    }
  } finally {
    activeBlockAncestors.delete(val);
  }
});

bindTutorialBlockSchema(TutorialBlockSchema);
