/**
 * Layman Section DTOs
 * Phase 2B - Backend Service Layer
 * ---------------------------------
 * Data Transfer Objects for API layer
 */

import { z } from 'zod';

/**
 * Layman Subsection Content Schema
 */
export const LaymanSubsectionContentSchema = z.object({
  analogy: z.string().optional(),
  beginnerBreakdown: z.string().optional(),
  mentalModel: z.string().optional(),
  useCase: z.string().optional(),
  faq: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional(),
  summary: z.string().optional(),
  motivation: z.string().optional(),
});

/**
 * Layman Section Content Schema
 */
export const LaymanSectionContentSchema = z.object({
  subsections: LaymanSubsectionContentSchema,
  metadata: z
    .object({
      estimatedReadTime: z.number().optional(),
      difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      prerequisites: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Create Layman Section DTO
 */
export const CreateLaymanSectionDTOSchema = z.object({
  subtopicId: z.string().uuid('Invalid subtopic ID'),
  brandId: z.enum(['shared', 'realtutorialhub', 'skillup']),
  educationalArchitectureName: z.string().optional().default('Beginner-Friendly'),
  uiArchitectureName: z.string().optional().default('Standard Interactive'),
  content: LaymanSectionContentSchema.optional(),
  createdBy: z.string().uuid('Invalid user ID'),
  difficulty: z.enum(['simple', 'mixed', 'intermediate', 'expert']).optional().default('simple'),
});

export type CreateLaymanSectionDTO = z.infer<typeof CreateLaymanSectionDTOSchema>;

/**
 * Update Layman Section DTO
 */
export const UpdateLaymanSectionDTOSchema = z.object({
  content: LaymanSectionContentSchema.optional(),
  status: z
    .enum([
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
    ])
    .optional(),
  educationalArchitectureId: z.string().uuid().optional(),
  uiArchitectureId: z.string().uuid().optional(),
  updatedBy: z.string().uuid('Invalid user ID').optional(),
});

export type UpdateLaymanSectionDTO = z.infer<typeof UpdateLaymanSectionDTOSchema>;

/**
 * Publish Layman Section DTO
 */
export const PublishLaymanSectionDTOSchema = z.object({
  publishedBy: z.string().uuid('Invalid user ID'),
  deploymentType: z.enum(['full', 'staged', 'canary']).optional().default('full'),
  skipValidation: z.boolean().optional().default(false),
});

export type PublishLaymanSectionDTO = z.infer<typeof PublishLaymanSectionDTOSchema>;

/**
 * Archive Layman Section DTO
 */
export const ArchiveLaymanSectionDTOSchema = z.object({
  archivedBy: z.string().uuid('Invalid user ID'),
  reason: z.string().optional(),
});

export type ArchiveLaymanSectionDTO = z.infer<typeof ArchiveLaymanSectionDTOSchema>;

/**
 * Generate Layman Section DTO
 */
export const GenerateLaymanSectionDTOSchema = z.object({
  subtopicId: z.string().uuid('Invalid subtopic ID'),
  topicName: z.string().min(1, 'Topic name is required'),
  subtopicName: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
  brandId: z.enum(['shared', 'realtutorialhub', 'skillup']),
  educationalArchitectureName: z.string().optional().default('Beginner-Friendly'),
  promptTemplateName: z.string().optional().default('Layman Master Template v1'),
  requestedBy: z.string().uuid('Invalid user ID'),
});

export type GenerateLaymanSectionDTO = z.infer<typeof GenerateLaymanSectionDTOSchema>;

/**
 * Query Layman Sections DTO
 */
export const QueryLaymanSectionsDTOSchema = z.object({
  subtopicId: z.string().uuid().optional(),
  brandId: z.enum(['shared', 'realtutorialhub', 'skillup']).optional(),
  status: z
    .enum([
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
    ])
    .optional(),
  educationalArchitectureId: z.string().uuid().optional(),
  uiArchitectureId: z.string().uuid().optional(),
});

export type QueryLaymanSectionsDTO = z.infer<typeof QueryLaymanSectionsDTOSchema>;
