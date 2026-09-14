/**
 * Introduction I1 - Zod Validation Schemas
 * 
 * Introduction Block provides a comprehensive roadmap-style overview
 * for educational topics, combining visual elements with structured content.
 */

import { z } from 'zod';
import { PresentationConfigSchema } from './presentation.schema';

/**
 * Icon Registry - Controlled set of approved Lucide icons
 * Maps to Lucide React components at render time
 */
export const IntroductionIconKeySchema = z.enum([
  'book-open',
  'target',
  'lightbulb',
  'route',
  'code',
  'layers',
  'check-circle',
  'arrow-right',
  'graduation-cap',
  'rocket',
  'wrench',
  'globe',
  'zap',
  'star',
  'box',
]);

/**
 * Introduction I1 Page Schema
 * Validates the page.* structure
 * 
 * Preserves prototype's 10-section structure:
 * 1. Hero (badge, title, subtitle, motto)
 * 2. Learning Goal
 * 3. The Topic
 * 4. Where Does It Fit? (flow cards)
 * 5. The Solution (code example)
 * 6. Where Is It Used? (use cases)
 * 7. What Will You Learn? (roadmap)
 * 8. Why This Matters (benefits)
 * 9. Key Takeaway
 * 10. Footer (owned by TutorialPageShell, not in I1 data)
 */
export const IntroductionI1PageSchema = z.object({
  // Hero Section
  badge: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  subtitle: z.string().min(1).max(500),
  
  // Mountain Roadmap - Handwritten motto (4 lines)
  motto: z.object({
    lines: z.tuple([
      z.string().min(1).max(50),
      z.string().min(1).max(50),
      z.string().min(1).max(50),
      z.string().min(1).max(50),
    ]),
  }).strict(),
  
  // Learning Goal
  learningGoal: z.string().min(1).max(1000),
  
  // Section 1: The Topic
  topic: z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    quote: z.string().min(1).max(500),
  }).strict(),
  
  // Section 2: Where Does It Fit?
  whereFit: z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    flowCards: z.array(
      z.object({
        title: z.string().min(1).max(100),
        subtitle: z.string().min(1).max(300),
        icon: IntroductionIconKeySchema,
        highlight: z.boolean().optional(),
      }).strict()
    ).min(1).max(10),
  }).strict(),
  
  // Section 3: The Solution
  solution: z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    code: z.object({
      language: z.string().min(1).max(50),
      code: z.string().min(1),
    }).strict(),
  }).strict(),
  
  // Section 4: Where Is It Used?
  whereUsed: z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    useCases: z.array(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().min(1).max(300),
        icon: IntroductionIconKeySchema,
        highlight: z.boolean().optional(),
      }).strict()
    ).min(1).max(10),
  }).strict(),
  
  // Section 5: What Will You Learn?
  roadmap: z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    steps: z.array(
      z.object({
        title: z.string().min(1).max(100),
        subtitle: z.string().min(1).max(300),
      }).strict()
    ).min(1).max(20),
  }).strict(),
  
  // Section 6: Why This Matters
  whyMatters: z.object({
    title: z.string().min(1).max(100),
    benefits: z.array(
      z.object({
        title: z.string().min(1).max(100),
        subtitle: z.string().min(1).max(300),
        icon: IntroductionIconKeySchema,
      }).strict()
    ).min(1).max(10),
  }).strict(),
  
  // Key Takeaway
  keyTakeaway: z.string().min(1).max(1000),
}).strict();

/**
 * Introduction I1 Author Content Schema
 * Validates AI output: { page: {...} }
 */
export const IntroductionI1AuthorContentSchema = z.object({
  page: IntroductionI1PageSchema,
}).strict();

/**
 * Introduction I1 Block Schema
 * Validates canonical block with version envelope
 * 
 * Following D1 pattern:
 * - Individual schema (no BaseBlock.extend())
 * - No .strict() at top level (allows presentation, expectedTimeSec)
 * - Uses z.string().uuid() for id validation
 */
export const IntroductionI1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('introduction'),
  version: z.literal('I1'),
  content: IntroductionI1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
});

/**
 * Validator: AI Output → Author Content
 */
export function validateIntroductionI1AIOutput(
  output: unknown
): z.infer<typeof IntroductionI1AuthorContentSchema> {
  return IntroductionI1AuthorContentSchema.parse(output);
}

