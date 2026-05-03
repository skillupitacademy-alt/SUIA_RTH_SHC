/**
 * Layman Prompt DTOs
 * Phase 2B Week 2 - Human-in-the-Loop AI Governance
 * --------------------------------------------------
 * Data Transfer Objects for prompt generation and content ingestion
 */

import { z } from 'zod';

/**
 * Generate Prompt DTO
 */
export const GeneratePromptDTOSchema = z.object({
  subtopicId: z.string().uuid('Invalid subtopic ID'),
  topicName: z.string().min(1, 'Topic name is required'),
  subtopicName: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
  brandId: z.enum(['shared', 'realtutorialhub', 'skillup']),
  promptTemplateName: z.string().optional().default('Layman Master Template v1'),
  educationalArchitectureName: z.string().optional().default('Beginner-Friendly'),
  learnerType: z.string().optional(),
  requestedBy: z.string().uuid('Invalid user ID'),
});

export type GeneratePromptDTO = z.infer<typeof GeneratePromptDTOSchema>;

/**
 * Ingest AI Response DTO
 */
export const IngestAIResponseDTOSchema = z.object({
  promptId: z.string().uuid('Invalid prompt ID'),
  rawAIResponse: z.string().min(100, 'AI response is too short (minimum 100 characters)'),
  aiProvider: z.enum(['chatgpt', 'claude', 'gemini', 'other']).optional(),
  submittedBy: z.string().uuid('Invalid user ID'),
});

export type IngestAIResponseDTO = z.infer<typeof IngestAIResponseDTOSchema>;

/**
 * Validate Content DTO
 */
export const ValidateContentDTOSchema = z.object({
  sectionId: z.string().uuid('Invalid section ID'),
  content: z.object({
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
  }),
});

export type ValidateContentDTO = z.infer<typeof ValidateContentDTOSchema>;

/**
 * Revise Content DTO
 */
export const ReviseContentDTOSchema = z.object({
  sectionId: z.string().uuid('Invalid section ID'),
  revisedContent: z.object({
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
  }),
  revisionNotes: z.string().optional(),
  revisedBy: z.string().uuid('Invalid user ID'),
});

export type ReviseContentDTO = z.infer<typeof ReviseContentDTOSchema>;

/**
 * Submit for Review DTO
 */
export const SubmitForReviewDTOSchema = z.object({
  sectionId: z.string().uuid('Invalid section ID'),
  submittedBy: z.string().uuid('Invalid user ID'),
  reviewNotes: z.string().optional(),
  assignReviewer: z.string().uuid().optional(),
});

export type SubmitForReviewDTO = z.infer<typeof SubmitForReviewDTOSchema>;

/**
 * Export Prompt DTO
 */
export const ExportPromptDTOSchema = z.object({
  promptId: z.string().uuid('Invalid prompt ID'),
  format: z.enum(['plain', 'markdown', 'json']).optional().default('plain'),
});

export type ExportPromptDTO = z.infer<typeof ExportPromptDTOSchema>;
