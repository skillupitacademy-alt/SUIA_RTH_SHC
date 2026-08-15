/**
 * Tutorial Composer - API Contracts
 * Request/Response Zod schemas for NEW Tutorial Composer API
 * 
 * ARCHITECTURE:
 * - These contracts are for the NEW Composer only
 * - They use TutorialDocument as the canonical content model
 * - NO legacy transformation or child table dependencies
 */

import { z } from 'zod';
import { TutorialDocumentSchema } from '../tutorial-rich-document/schemas/document.schema';
import { CURRENT_SCHEMA_VERSION } from '../tutorial-rich-document/constants';

// ============================================================
// ENUMS & PRIMITIVES
// ============================================================

/**
 * Section types (from database enum)
 */
export const SectionTypeSchema = z.enum([
  'overview',
  'notes',
  'layman',
  'visual',
  'real_life',
  'technical',
  'code',
  'practice',
  'assignment',
  'project',
  'quiz',
  'summary',
  'interview',
  'ai_tutor',
]);

export type SectionType = z.infer<typeof SectionTypeSchema>;

/**
 * Difficulty levels (from database enum)
 */
export const DifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

export type Difficulty = z.infer<typeof DifficultySchema>;

/**
 * Section status (from database enum)
 */
export const SectionStatusSchema = z.enum([
  'draft',
  'generating',
  'validating',
  'pending_review',
  'in_review',
  'changes_requested',
  'approved',
  'deploying',
  'deployed',
  'archived',
]);

export type SectionStatus = z.infer<typeof SectionStatusSchema>;

/**
 * Brand identifiers (from database enum)
 */
export const BrandIdSchema = z.enum([
  'realtutorialhub',
  'skillup',
  'skillhubcore',
  'shared',
]);

export type BrandId = z.infer<typeof BrandIdSchema>;

// ============================================================
// CREATE SECTION
// ============================================================

/**
 * Create Tutorial Section Request
 * Client submits: subtopic, section type, difficulty, and TutorialDocument content
 */
export const CreateTutorialSectionRequestSchema = z
  .object({
    subtopicId: z.string().uuid('Invalid subtopic ID'),
    sectionType: SectionTypeSchema,
    difficulty: DifficultySchema,
    content: TutorialDocumentSchema,
    brandId: BrandIdSchema.optional(),
    orderIndex: z.number().int().min(0).optional(),
  })
  .strict();

export type CreateTutorialSectionRequest = z.infer<
  typeof CreateTutorialSectionRequestSchema
>;

// ============================================================
// UPDATE SECTION
// ============================================================

/**
 * Update Tutorial Section Request
 * Allows partial updates to content and difficulty
 */
export const UpdateTutorialSectionRequestSchema = z
  .object({
    content: TutorialDocumentSchema.optional(),
    difficulty: DifficultySchema.optional(),
    orderIndex: z.number().int().min(0).optional(),
  })
  .strict();

export type UpdateTutorialSectionRequest = z.infer<
  typeof UpdateTutorialSectionRequestSchema
>;

// ============================================================
// PUBLISH SECTION
// ============================================================

/**
 * Publish Tutorial Section Request
 * Empty body - section ID comes from URL
 */
export const PublishTutorialSectionRequestSchema = z.object({}).strict();

export type PublishTutorialSectionRequest = z.infer<
  typeof PublishTutorialSectionRequestSchema
>;

// ============================================================
// SECTION RESPONSE
// ============================================================

/**
 * Tutorial Section Response
 * Complete section data returned from API
 */
export const TutorialSectionResponseSchema = z
  .object({
    id: z.string().uuid(),
    subtopicId: z.string().uuid(),
    sectionType: SectionTypeSchema,
    difficulty: DifficultySchema,
    orderIndex: z.number().int(),
    content: TutorialDocumentSchema,
    version: z.number().int().min(1),
    language: z.string().default('en'),
    status: SectionStatusSchema,
    brandId: BrandIdSchema,
    
    // AI metadata (readonly)
    generatedByAi: z.boolean(),
    aiModelUsed: z.string().nullable(),
    qualityScore: z.number().int().nullable(),
    
    // Timestamps (readonly)
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    publishedAt: z.string().datetime().nullable(),
  })
  .strict();

export type TutorialSectionResponse = z.infer<
  typeof TutorialSectionResponseSchema
>;

// ============================================================
// LIST SECTIONS
// ============================================================

/**
 * List Tutorial Sections Query Parameters
 */
export const ListTutorialSectionsQuerySchema = z.object({
  subtopicId: z.string().uuid().optional(),
  sectionType: SectionTypeSchema.optional(),
  difficulty: DifficultySchema.optional(),
  status: SectionStatusSchema.optional(),
  brandId: BrandIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

export type ListTutorialSectionsQuery = z.infer<
  typeof ListTutorialSectionsQuerySchema
>;

/**
 * List Tutorial Sections Response
 */
export const ListTutorialSectionsResponseSchema = z
  .object({
    data: z.array(TutorialSectionResponseSchema),
    nextCursor: z.string().uuid().nullable(),
    hasMore: z.boolean(),
    total: z.number().int().min(0),
  })
  .strict();

export type ListTutorialSectionsResponse = z.infer<
  typeof ListTutorialSectionsResponseSchema
>;

// ============================================================
// ERROR RESPONSES
// ============================================================

/**
 * API Error Codes
 */
export const ApiErrorCode = z.enum([
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'TUTORIAL_DOCUMENT_INVALID',
  'SECTION_NOT_FOUND',
  'SECTION_ALREADY_EXISTS',
  'INVALID_SECTION_TYPE',
  'INVALID_STATUS_TRANSITION',
  'VERSION_CONFLICT',
  'DATABASE_ERROR',
  'INTERNAL_ERROR',
]);

export type ApiErrorCode = z.infer<typeof ApiErrorCode>;

/**
 * Validation Error Detail
 */
export const ValidationErrorDetailSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    path: z.string().optional(),
    blockId: z.string().optional(),
  })
  .strict();

export type ValidationErrorDetail = z.infer<typeof ValidationErrorDetailSchema>;

/**
 * API Error Response
 */
export const ApiErrorResponseSchema = z
  .object({
    error: z.object({
      code: ApiErrorCode,
      message: z.string(),
      details: z.array(ValidationErrorDetailSchema).optional(),
    }),
  })
  .strict();

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// ============================================================
// SUCCESS RESPONSE WRAPPER
// ============================================================

/**
 * Generic success response wrapper
 * Uses existing project pattern of { data: ... }
 */
export function createSuccessResponse<T>(data: T, status: number = 200) {
  return {
    data,
    status,
  };
}

/**
 * Create error response
 */
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: ValidationErrorDetail[]
): { error: ApiErrorResponse['error']; status: number } {
  return {
    error: {
      code,
      message,
      details,
    },
    status,
  };
}
