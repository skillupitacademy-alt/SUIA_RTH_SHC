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
// RAW CONTENT IMPORT CONTRACTS (PROMPT 05)
// ============================================================

/**
 * Raw Content Source Type
 */
export const RawContentSourceTypeSchema = z.enum([
  'markdown',
  'html',
  'plain_text',
  'file',
  'url',
  'ai_generate',
]);

export type RawContentSourceType = z.infer<typeof RawContentSourceTypeSchema>;

/**
 * Import Processing Options
 */
export const ImportOptionsSchema = z
  .object({
    extractTitle: z.boolean().default(true),
    detectCodeBlocks: z.boolean().default(true),
    detectLists: z.boolean().default(true),
    detectHeadings: z.boolean().default(true),
    customTitle: z.string().max(200).optional(),
  })
  .strict();

export type ImportOptions = z.infer<typeof ImportOptionsSchema>;

/**
 * Imported Content Structural Statistics
 */
export const ImportedContentStatsSchema = z
  .object({
    headings: z.number().int().min(0),
    paragraphs: z.number().int().min(0),
    codeBlocks: z.number().int().min(0),
    lists: z.number().int().min(0),
    quotes: z.number().int().min(0),
    tables: z.number().int().min(0),
    totalBlocks: z.number().int().min(0),
    wordCount: z.number().int().min(0),
    charCount: z.number().int().min(0),
  })
  .strict();

export type ImportedContentStats = z.infer<typeof ImportedContentStatsSchema>;

/**
 * Raw Content Import Request
 */
export const RawContentImportRequestSchema = z
  .object({
    subtopicId: z.string().uuid('Invalid subtopic ID'),
    sectionType: SectionTypeSchema,
    difficulty: DifficultySchema,
    brandId: BrandIdSchema.optional(),
    sourceType: RawContentSourceTypeSchema,
    rawContent: z.string().min(1, 'Raw content cannot be empty').max(1_000_000, 'Content exceeds 1MB limit'),
    options: ImportOptionsSchema.optional(),
  })
  .strict();

export type RawContentImportRequest = z.infer<typeof RawContentImportRequestSchema>;

/**
 * Raw Content Import Response
 */
export const RawContentImportResponseSchema = z
  .object({
    document: TutorialDocumentSchema,
    stats: ImportedContentStatsSchema,
    sourceType: RawContentSourceTypeSchema,
  })
  .strict();

export type RawContentImportResponse = z.infer<typeof RawContentImportResponseSchema>;

// ============================================================
// PROMPT 06 - CONTENT ANALYSIS SCHEMAS
// ============================================================

export const QualityStatusSchema = z.enum(['excellent', 'good', 'fair', 'poor', 'none', 'high']);
export type QualityStatus = z.infer<typeof QualityStatusSchema>;

export const AnalysisSectionLevelSchema = z.enum(['h1', 'h2', 'h3', 'summary']);
export type AnalysisSectionLevel = z.infer<typeof AnalysisSectionLevelSchema>;

export const AnalysisSectionSchema: z.ZodType<AnalysisSection> = z.lazy(() =>
  z.object({
    id: z.string(),
    level: AnalysisSectionLevelSchema,
    title: z.string(),
    snippet: z.string(),
    confidence: z.number().min(0).max(100),
    isVerified: z.boolean().default(true),
    subsections: z.array(AnalysisSectionSchema).optional(),
  })
);

export interface AnalysisSection {
  id: string;
  level: AnalysisSectionLevel;
  title: string;
  snippet: string;
  confidence: number;
  isVerified?: boolean;
  subsections?: AnalysisSection[];
}

export const SmartSuggestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.enum(['layout', 'component', 'callout', 'structure', 'general']).default('general'),
  targetSectionId: z.string().optional(),
});
export type SmartSuggestion = z.infer<typeof SmartSuggestionSchema>;

export const ContentAnalysisResultSchema = z
  .object({
    documentId: z.string().optional(),
    subtopicId: z.string().optional(),
    statistics: z.object({
      totalWords: z.number().int().min(0),
      characters: z.number().int().min(0),
      readingTimeMinutes: z.number().int().min(0),
      sectionsDetected: z.number().int().min(0),
      totalBlocks: z.number().int().min(0),
      sectionsBreakdown: z.string().optional(), // e.g. "H1: 1, H2: 5, H3: 2"
    }),
    sectionOutline: z.array(AnalysisSectionSchema),
    qualityIndicators: z.object({
      readability: QualityStatusSchema,
      structure: QualityStatusSchema,
      completeness: QualityStatusSchema,
      examples: QualityStatusSchema,
      codePresence: QualityStatusSchema,
      visualPotential: QualityStatusSchema,
    }),
    smartSuggestions: z.array(SmartSuggestionSchema),
    detectedElements: z.object({
      headings: z.number().int().min(0),
      paragraphs: z.number().int().min(0),
      bulletLists: z.number().int().min(0),
      numberedLists: z.number().int().min(0),
      codeBlocks: z.number().int().min(0),
      quotes: z.number().int().min(0),
      tables: z.number().int().min(0),
      callouts: z.number().int().min(0),
      keyConcepts: z.number().int().min(0),
      comparisons: z.number().int().min(0),
      examples: z.number().int().min(0),
    }),
    overallConfidence: z.object({
      score: z.number().min(0).max(100),
      grade: z.enum(['Excellent', 'High', 'Good', 'Moderate', 'Low']),
      description: z.string().optional(),
    }),
  })
  .strict();

export type ContentAnalysisResult = z.infer<typeof ContentAnalysisResultSchema>;

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
