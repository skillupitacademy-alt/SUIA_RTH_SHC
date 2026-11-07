import { z } from 'zod';

const status = z.enum(['active', 'inactive', 'draft']).optional();
const uuid = z.string().uuid({ message: 'Invalid ID format' });

export const TOPIC_COMPLEXITY_LEVEL_TO_ENUM: Record<
  number,
  'beginner' | 'intermediate' | 'advanced' | 'expert'
> = {
  1: 'beginner',
  2: 'intermediate',
  3: 'advanced',
  4: 'expert',
};

export const TOPIC_COMPLEXITY_ENUM_TO_LEVEL: Record<
  'beginner' | 'intermediate' | 'advanced' | 'expert',
  number
> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

export function checkTopicAliasConflict(input: {
  complexity?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  complexityLevel?: number;
}): string | null {
  if (input.complexity !== undefined && input.complexityLevel !== undefined) {
    const mapped = TOPIC_COMPLEXITY_LEVEL_TO_ENUM[input.complexityLevel];
    if (!mapped || mapped !== input.complexity) {
      return `Conflicting topic complexity ('${input.complexity}') and complexityLevel (${input.complexityLevel})`;
    }
  }
  return null;
}

export function checkSubtopicAliasConflict(input: {
  depth?: number;
  depthLevel?: number;
  order?: number;
  orderIndex?: number;
}): string | null {
  if (input.depth !== undefined && input.depthLevel !== undefined && input.depth !== input.depthLevel) {
    return `Conflicting subtopic depth (${input.depth}) and depthLevel (${input.depthLevel})`;
  }
  if (input.order !== undefined && input.orderIndex !== undefined && input.order !== input.orderIndex) {
    return `Conflicting subtopic order (${input.order}) and orderIndex (${input.orderIndex})`;
  }
  return null;
}

export const domainSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  order: z.number().int().min(0).optional(),
  status,
});
export type DomainInput = z.infer<typeof domainSchema>;
export const domainPatchSchema = domainSchema.partial();

export const subjectSchema = z.object({
  domainId: uuid,
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
  status,
});
export type SubjectInput = z.infer<typeof subjectSchema>;
export const subjectPatchSchema = subjectSchema.partial();

const topicBaseObjectSchema = z.object({
  subjectId: uuid,
  name: z.string().min(1),
  description: z.string().optional(),
  complexity: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  complexityLevel: z.number().int().min(1).optional(),
  weight: z.number().int().min(1).optional(),
  order: z.number().int().min(0).optional(),
  learningUrl: z.string().url().or(z.string().length(0)).optional().nullable(),
  detailedNotesPath: z.string().optional().nullable(),
  status,
});

function refineTopicAliases(
  val: {
    complexity?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    complexityLevel?: number;
  },
  ctx: z.RefinementCtx
) {
  const conflict = checkTopicAliasConflict(val);
  if (conflict) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['complexityLevel'],
      message: conflict,
    });
  }
}

export const topicPatchSchema = topicBaseObjectSchema.partial().superRefine(refineTopicAliases);

export const topicSchema = Object.assign(
  topicBaseObjectSchema.superRefine(refineTopicAliases),
  {
    partial: () => topicPatchSchema,
  }
);
export type TopicInput = z.infer<typeof topicBaseObjectSchema>;

const subtopicBaseObjectSchema = z.object({
  topicId: uuid,
  name: z.string().min(1),
  description: z.string().optional(),
  depth: z.number().int().min(1).optional(),
  depthLevel: z.number().int().min(1).optional(),
  order: z.number().int().min(0).optional(),
  orderIndex: z.number().int().min(0).optional(),
  status,
});

function refineSubtopicAliases(
  val: {
    depth?: number;
    depthLevel?: number;
    order?: number;
    orderIndex?: number;
  },
  ctx: z.RefinementCtx
) {
  if (val.depth !== undefined && val.depthLevel !== undefined && val.depth !== val.depthLevel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['depthLevel'],
      message: `Conflicting subtopic depth (${val.depth}) and depthLevel (${val.depthLevel})`,
    });
  }
  if (val.order !== undefined && val.orderIndex !== undefined && val.order !== val.orderIndex) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['orderIndex'],
      message: `Conflicting subtopic order (${val.order}) and orderIndex (${val.orderIndex})`,
    });
  }
}

export const subtopicPatchSchema = subtopicBaseObjectSchema.partial().superRefine(refineSubtopicAliases);

export const subtopicSchema = Object.assign(
  subtopicBaseObjectSchema.superRefine(refineSubtopicAliases),
  {
    partial: () => subtopicPatchSchema,
  }
);
export type SubtopicInput = z.infer<typeof subtopicBaseObjectSchema>;

export const skillSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['technical', 'cognitive', 'process']).optional(),
  mappingType: z.enum(['conceptual', 'technical', 'practical']).optional(),
  weight: z.number().int().min(1).optional(),
  status,
});
export type SkillInput = z.infer<typeof skillSchema>;
export const skillPatchSchema = skillSchema.partial();
