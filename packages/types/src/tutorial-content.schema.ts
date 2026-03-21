import { z } from 'zod';

export const ContentImageSchema = z
  .object({
    type: z.enum(['svg_standard', 'r2_custom']),
    svgKey: z.string().nullable(),
    url: z.string().url().nullable(),
    alt: z.string().min(10),
    caption: z.string().max(120).nullable(),
    position: z.enum(['right', 'bottom', 'inline']),
    width: z.number().int().min(50).max(1200),
  })
  .refine(
    (data) =>
      (data.type === 'svg_standard' && data.svgKey !== null && data.url === null) ||
      (data.type === 'r2_custom' && data.url !== null && data.svgKey === null),
    { message: 'svg_standard requires svgKey, r2_custom requires url — not both' }
  )
  .refine(
    (data) => data.type !== 'r2_custom' || data.url!.startsWith('https://cdn.realtutorialhub.com/'),
    { message: 'Image URL must be from trusted CDN only' }
  );

export const TutorialContentSchema = z.object({
  notes: z.object({
    markdown: z.string().min(1),
    image: ContentImageSchema.optional().nullable(),
  }),
  layman: z.object({
    simpleExplanation: z.string().min(1),
    analogyOrStory: z.string().min(1),
    example1: z.object({ company: z.string().min(1), content: z.string().min(1) }),
    example2: z.object({ company: z.string().min(1), content: z.string().min(1) }),
    image: ContentImageSchema.optional().nullable(),
  }),
  real_life: z.object({
    title: z.string().min(1),
    scenario: z.string().min(1),
    bullets: z.array(z.object({ label: z.string().min(1), detail: z.string().min(1) })),
    tip: z.string().min(1),
    image: ContentImageSchema.optional().nullable(),
  }),
  technical: z.object({
    markdown: z.string().min(1),
    bullets: z.array(z.object({ term: z.string().min(1), detail: z.string().min(1) })),
    tip: z.string().min(1),
    image: ContentImageSchema.optional().nullable(),
  }),
  code: z.object({
    language: z.enum(['javascript', 'typescript', 'python', 'sql', 'scala', 'java', 'bash']),
    intro: z.string().min(1),
    code: z.string().min(1),
    steps: z.array(z.string().min(1)),
    image: ContentImageSchema.optional().nullable(),
  }),
  ai_tutor: z.object({
    greeting: z.string().min(1),
    qa_pairs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
  }),
});
