/**
 * Tutorial Composer - Presentation Ideas Contracts
 * PROMPT 14B: Backend contracts for Page 14 (Presentation Ideas)
 * 
 * ARCHITECTURE:
 * - Pure recommendation engine (NO database writes)
 * - Deterministic analysis based on TutorialDocument + Analysis + BlockSuggestions
 * - concept-cards recommendations map to canonical card-grid block type
 * - Presentation ideas are transient (stored in sessionStorage for Page 15 handoff)
 */

import { z } from 'zod';
import {
  ContentAnalysisResultSchema,
  BlockSuggestionResultSchema,
  SectionTypeSchema,
  BrandIdSchema,
} from './contracts';
import { TutorialDocumentSchema } from '../tutorial-rich-document/schemas/document.schema';

// BlockType schema (17 canonical types from BLOCK_REGISTRY)
export const BlockTypeSchema = z.enum([
  'heading',
  'paragraph',
  'list',
  'code',
  'example',
  'image',
  'diagram',
  'table',
  'comparison',
  'callout',
  'quote',
  'definition',
  'summary',
  'two-column',
  'three-column',
  'card-grid',
  'timeline',
]);
export type BlockType = z.infer<typeof BlockTypeSchema>;

// ============================================================
// PRESENTATION IDEA ENUMS
// ============================================================

/**
 * Presentation Impact Level
 * Indicates the potential improvement impact of applying the idea
 */
export const PresentationImpactSchema = z.enum(['high', 'medium', 'low']);
export type PresentationImpact = z.infer<typeof PresentationImpactSchema>;

/**
 * Presentation Idea Type
 * Categories of presentation improvements
 */
export const PresentationIdeaTypeSchema = z.enum([
  'layout',          // Two-column, three-column arrangements
  'comparison',      // Comparison tables for contrasting concepts
  'card-grid',       // Card grids for concept cards (concept-cards → card-grid)
  'timeline',        // Timeline for chronological/process content
  'callout',         // Important callouts for key points
  'code-example',    // Code blocks with better formatting
  'visual',          // Diagrams or visual enhancements
  'structure',       // Document restructuring
]);
export type PresentationIdeaType = z.infer<typeof PresentationIdeaTypeSchema>;

/**
 * Wireframe Type
 * Visual representation patterns for the idea
 */
export const WireframeTypeSchema = z.enum([
  'two-column-50-50',
  'two-column-60-40',
  'two-column-40-60',
  'three-column',
  'comparison-table',
  'concept-cards-grid',
  'timeline-vertical',
  'callout-info',
  'callout-warning',
  'callout-tip',
  'code-with-explanation',
  'diagram-flowchart',
]);
export type WireframeType = z.infer<typeof WireframeTypeSchema>;

/**
 * Presentation Idea Status
 * Tracks user selection state
 */
export const PresentationIdeaStatusSchema = z.enum(['pending', 'selected', 'rejected']);
export type PresentationIdeaStatus = z.infer<typeof PresentationIdeaStatusSchema>;

// ============================================================
// PRESENTATION CONFIGURATION
// ============================================================

/**
 * Presentation Configuration
 * Reuses existing presentation schemas where applicable
 * 
 * IMPORTANT: Always maps to one of the 17 canonical block types
 */
export const PresentationConfigSchema = z.discriminatedUnion('targetBlockType', [
  // Two-column configuration
  z.object({
    targetBlockType: z.literal('two-column'),
    ratio: z.enum(['50-50', '60-40', '40-60', '70-30', '30-70']).optional(),
    gap: z.enum(['none', 'tight', 'normal', 'relaxed', 'loose']).optional(),
  }),
  
  // Three-column configuration
  z.object({
    targetBlockType: z.literal('three-column'),
    gap: z.enum(['none', 'tight', 'normal', 'relaxed', 'loose']).optional(),
  }),
  
  // Card-grid configuration (concept-cards maps here)
  z.object({
    targetBlockType: z.literal('card-grid'),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    gap: z.enum(['none', 'tight', 'normal', 'relaxed', 'loose']).optional(),
  }),
  
  // Timeline configuration
  z.object({
    targetBlockType: z.literal('timeline'),
    orientation: z.enum(['vertical', 'horizontal']).optional(),
  }),
  
  // Comparison configuration
  z.object({
    targetBlockType: z.literal('comparison'),
    hasHeader: z.boolean().optional(),
  }),
  
  // Callout configuration
  z.object({
    targetBlockType: z.literal('callout'),
    variant: z.enum(['info', 'warning', 'tip', 'danger', 'success']).optional(),
  }),
  
  // Code configuration
  z.object({
    targetBlockType: z.literal('code'),
    showLineNumbers: z.boolean().optional(),
  }),
  
  // Example configuration
  z.object({
    targetBlockType: z.literal('example'),
  }),
  
  // Diagram configuration
  z.object({
    targetBlockType: z.literal('diagram'),
    diagramType: z.enum(['mermaid', 'svg', 'image']).optional(),
  }),
]);
export type PresentationConfig = z.infer<typeof PresentationConfigSchema>;

// ============================================================
// PRESENTATION IDEA
// ============================================================

/**
 * Presentation Idea
 * A single recommendation for improving content presentation
 * 
 * CRITICAL: targetBlockType MUST be one of the 17 canonical BLOCK_REGISTRY types
 * - concept-cards suggestions use targetBlockType: 'card-grid'
 * - Never targetBlockType: 'concept-cards' (that's not a registry type)
 */
export const PresentationIdeaSchema = z.object({
  // Identity (deterministic, stable ID)
  id: z.string(),
  
  // Metadata
  title: z.string(),
  description: z.string(),
  type: PresentationIdeaTypeSchema,
  impact: PresentationImpactSchema,
  
  // Source information
  appliesToSection: z.string().optional(), // Section ID from ContentAnalysisResult
  sourceBlockIds: z.array(z.string()),    // Block IDs this idea is based on
  
  // Target transformation
  targetBlockType: BlockTypeSchema,       // MUST be one of 17 canonical types
  wireframeType: WireframeTypeSchema,
  
  // Reasoning
  reason: z.string(),
  
  // Configuration (optional, depends on target block type)
  presentationConfig: PresentationConfigSchema.optional(),
  
  // User interaction
  isSelected: z.boolean().default(false),
  status: PresentationIdeaStatusSchema.default('pending'),
});
export type PresentationIdea = z.infer<typeof PresentationIdeaSchema>;

// ============================================================
// STATISTICS
// ============================================================

/**
 * Presentation Ideas Statistics
 * Aggregated metrics for the recommendation set
 */
export const PresentationIdeasStatisticsSchema = z.object({
  total: z.number().int().min(0),
  high: z.number().int().min(0),
  medium: z.number().int().min(0),
  low: z.number().int().min(0),
  byType: z.record(PresentationIdeaTypeSchema, z.number().int().min(0)),
  enhancementTips: z.number().int().min(0),
});
export type PresentationIdeasStatistics = z.infer<typeof PresentationIdeasStatisticsSchema>;

// ============================================================
// CONTEXT OUTLINE
// ============================================================

/**
 * Context Outline
 * Provides structural context about the document being analyzed
 */
export const ContextOutlineSchema = z.object({
  totalSections: z.number().int().min(0),
  totalBlocks: z.number().int().min(0),
  totalWords: z.number().int().min(0),
  readingTimeMinutes: z.number().int().min(0),
  mainSections: z.array(z.object({
    title: z.string(),
    level: z.enum(['h1', 'h2', 'h3', 'summary']),
    wordCount: z.number().int().min(0),
  })),
});
export type ContextOutline = z.infer<typeof ContextOutlineSchema>;

// ============================================================
// BEST PRACTICES
// ============================================================

/**
 * Best Practices
 * General guidance for improving presentation
 */
export const BestPracticeSchema = z.object({
  id: z.string(),
  category: z.enum(['layout', 'visual', 'structure', 'engagement', 'accessibility']),
  title: z.string(),
  description: z.string(),
  priority: PresentationImpactSchema,
});
export type BestPractice = z.infer<typeof BestPracticeSchema>;

// ============================================================
// PRESENTATION IDEAS RESULT
// ============================================================

/**
 * Presentation Ideas Result
 * Complete result from presentation ideas analysis
 * 
 * ARCHITECTURE:
 * - This is the output from PresentationIdeasService
 * - Consumed by Page 14 UI
 * - Selected ideas stored in sessionStorage for Page 15
 * - NO database persistence at this stage
 */
export const PresentationIdeasResultSchema = z.object({
  // Core recommendations
  ideas: z.array(PresentationIdeaSchema),
  
  // Statistics
  statistics: PresentationIdeasStatisticsSchema,
  
  // Context
  contextOutline: ContextOutlineSchema,
  
  // Best practices
  bestPractices: z.array(BestPracticeSchema),
  
  // Metadata
  metadata: z.object({
    generatedAt: z.string().datetime(),
    processingTimeMs: z.number().int().min(0).optional(),
    documentVersion: z.number().int().optional(),
  }).optional(),
});
export type PresentationIdeasResult = z.infer<typeof PresentationIdeasResultSchema>;

// ============================================================
// API REQUEST/RESPONSE
// ============================================================

/**
 * Presentation Ideas Request
 * 
 * SECURITY:
 * - Client provides document, analysis, and blockSuggestions (for context)
 * - Server generates deterministic recommendations
 * - Server NEVER trusts client-provided presentation ideas
 */
export const PresentationIdeasRequestSchema = z.object({
  document: TutorialDocumentSchema,
  analysis: ContentAnalysisResultSchema,        // Required: provides content context
  blockSuggestions: BlockSuggestionResultSchema, // Required: provides suggestion context
  subtopicId: z.string().uuid().optional(),
  sectionType: SectionTypeSchema.optional(),
  brandId: BrandIdSchema.optional(),
});
export type PresentationIdeasRequest = z.infer<typeof PresentationIdeasRequestSchema>;

/**
 * Presentation Ideas Response
 */
export const PresentationIdeasResponseSchema = z.object({
  data: PresentationIdeasResultSchema,
});
export type PresentationIdeasResponse = z.infer<typeof PresentationIdeasResponseSchema>;

// ============================================================
// SESSION STORAGE CONTRACT (Page 14 → Page 15)
// ============================================================

/**
 * Presentation Plan
 * Stored in sessionStorage: tutorial_composer_presentation_plan
 * Carries selected ideas from Page 14 to Page 15 (Review & Approve)
 */
export const PresentationPlanSchema = z.object({
  documentId: z.string().optional(),
  subtopicId: z.string().uuid().optional(),
  sectionType: SectionTypeSchema.optional(),
  selectedIdeas: z.array(PresentationIdeaSchema),
  createdAt: z.string().datetime(),
});
export type PresentationPlan = z.infer<typeof PresentationPlanSchema>;
