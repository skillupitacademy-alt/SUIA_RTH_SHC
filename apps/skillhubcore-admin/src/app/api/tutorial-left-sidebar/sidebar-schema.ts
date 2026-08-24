/**
 * Sidebar Schema and Types
 * 
 * Input boundary types and Zod validation schemas for tutorial sidebar authoring.
 * 
 * Architecture:
 * AuthoringNavigationNode (id optional) → Normalization → TutorialNavigationNode (id required)
 */

import { z } from 'zod';

/**
 * Valid tutorial sidebar brand IDs
 * 
 * SINGLE SOURCE OF TRUTH for:
 * - TypeScript type
 * - Runtime validation
 * - Zod schema
 */
export const TUTORIAL_SIDEBAR_BRAND_IDS = [
  'realtutorialhub',
  'skillup',
  'shared',
] as const;

/**
 * Tutorial sidebar brand ID type
 */
export type TutorialSidebarBrandId = (typeof TUTORIAL_SIDEBAR_BRAND_IDS)[number];

/**
 * Type guard for brand ID
 */
export function isTutorialSidebarBrandId(value: string): value is TutorialSidebarBrandId {
  return TUTORIAL_SIDEBAR_BRAND_IDS.some((brandId) => brandId === value);
}

/**
 * Runtime validator for brand ID from URL params
 * 
 * Uses type guard - no type assertions needed
 */
export function validateBrandId(value: string | null): TutorialSidebarBrandId | null {
  if (!value || !isTutorialSidebarBrandId(value)) {
    return null;
  }
  return value;
}

/**
 * Zod schema for brand ID validation
 * 
 * Derived from TUTORIAL_SIDEBAR_BRAND_IDS constant
 */
export const tutorialSidebarBrandIdSchema = z.enum(TUTORIAL_SIDEBAR_BRAND_IDS);

/**
 * Authoring Navigation Node - Input Boundary Type
 * 
 * ID is optional at the authoring/input boundary to allow safety fallback.
 * External AI is instructed that id is compulsory, but server acts as safety net.
 * 
 * After normalization, all nodes will have canonical IDs.
 */
export type AuthoringNavigationNode = {
  id?: string;  // Optional at input boundary
  name: string;
  type: 'group' | 'page';
  description?: string;  // Educational description
  icon?: string;
  expanded?: boolean;
  children?: AuthoringNavigationNode[];
};

// Universal Navigation authoring schema - id optional for safety fallback
export const authoringNodeSchema: z.ZodType<AuthoringNavigationNode> = z.lazy(() => z.object({
  id: z.string().trim().min(1).optional(),  // Optional - fallback to name if missing
  name: z.string().trim().min(1),
  type: z.enum(['group', 'page']),
  description: z.string().trim().min(1).optional(),  // Educational description
  icon: z.string().optional(),
  expanded: z.boolean().optional(),
  children: z.array(authoringNodeSchema).optional(),
}).strict());

// Universal Navigation tree - contains only topics array
export const authoringTreeSchema = z.object({
  topics: z.array(authoringNodeSchema).min(1),
}).strict();

export type AuthoringTree = z.infer<typeof authoringTreeSchema>;

// Save payload schema - combines authoring tree with hierarchy context
export const saveSchema = z.object({
  brandId: tutorialSidebarBrandIdSchema,
  domainId: z.string().uuid(),
  subjectId: z.string().uuid(),
  topicId: z.string().uuid(),
  activeSubtopicId: z.string().uuid().optional(),
  status: z.enum(['draft', 'published']),
  tree: authoringTreeSchema,
  sourceFormat: z.enum(['json', 'markdown']),
  sourceContent: z.string(),
});

export type SavePayload = z.infer<typeof saveSchema>;

/**
 * Normalized navigation node (after slug/URL generation)
 * 
 * This type represents nodes after:
 * 1. ID normalization (guaranteed id)
 * 2. Slug generation
 * 3. URL generation
 */
export type NormalizedNode = {
  id: string;
  name: string;
  type: 'group' | 'page';
  description?: string;  // Educational description
  icon?: string;
  expanded?: boolean;
  slug: string;  // System-generated
  url?: string;  // System-generated (page nodes only)
  children?: NormalizedNode[];
};

export type NormalizedTree = { 
  topics: NormalizedNode[] 
};
