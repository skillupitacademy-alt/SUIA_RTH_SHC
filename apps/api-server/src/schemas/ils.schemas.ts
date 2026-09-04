/**
 * Phase 2.6-A4: ILS API Request Validation Schemas
 * 
 * Zod schemas for validating Learning Progress / ILS HTTP requests.
 * 
 * SECURITY:
 * - userId, brand, roles MUST NOT be accepted from request bodies
 * - These come from authenticated identity context
 * - requiredBlocks MUST NOT be accepted for complete-node
 */

import { z } from 'zod';

/**
 * Navigation Node ID validation (text slug, not UUID)
 * Database column is text, stores URL-friendly slugs like 'whatisjava'
 */
const navigationNodeIdSchema = z.string().min(1, 'Navigation node ID required').max(200);

/**
 * UUID validation
 */
const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Session ID validation
 */
const sessionIdSchema = z.string().min(1, 'Session ID required').max(100);

/**
 * Block ID validation
 */
const blockIdSchema = z.string().min(1, 'Block ID required').max(200);

/**
 * Block version validation (e.g., "D1", "C1", "S1")
 */
const blockVersionSchema = z.string().min(1, 'Block version required').max(50);

/**
 * Block type validation
 */
const blockTypeSchema = z.string().min(1, 'Block type required').max(100);

/**
 * Time increment validation (0-3600 seconds)
 */
const timeIncrementSchema = z.number()
  .int('Time must be an integer')
  .min(0, 'Time cannot be negative')
  .max(3600, 'Time increment too large (max 1 hour)');

/**
 * GET /api/tutorial/ils/navigation/:nodeId
 * Query: ?subtopicId=xxx
 */
export const getNavigationProgressQuerySchema = z.object({
  subtopicId: uuidSchema,
});

export type GetNavigationProgressQuery = z.infer<typeof getNavigationProgressQuerySchema>;

/**
 * POST /api/tutorial/ils/visit
 */
export const recordVisitBodySchema = z.object({
  navigationNodeId: navigationNodeIdSchema,
  subtopicId: uuidSchema,
  sessionId: sessionIdSchema,
  sectionId: uuidSchema.optional().nullable(),
});

export type RecordVisitBody = z.infer<typeof recordVisitBodySchema>;

/**
 * POST /api/tutorial/ils/block-completion
 */
export const recordBlockCompletionBodySchema = z.object({
  navigationNodeId: navigationNodeIdSchema,
  subtopicId: uuidSchema,
  sectionId: uuidSchema.nullable(),
  blockId: blockIdSchema,
  blockType: blockTypeSchema,
  blockVersion: blockVersionSchema,
  sessionId: sessionIdSchema.optional(),
});

export type RecordBlockCompletionBody = z.infer<typeof recordBlockCompletionBodySchema>;

/**
 * POST /api/tutorial/ils/active-time
 */
export const recordActiveTimeBodySchema = z.object({
  navigationNodeId: navigationNodeIdSchema,
  subtopicId: uuidSchema,
  incrementSeconds: timeIncrementSchema,
});

export type RecordActiveTimeBody = z.infer<typeof recordActiveTimeBodySchema>;

/**
 * POST /api/tutorial/ils/complete-node
 * 
 * SECURITY: Does NOT accept requiredBlocks.
 * Server resolves canonical requirements.
 */
export const completeNodeBodySchema = z.object({
  navigationNodeId: navigationNodeIdSchema,
  subtopicId: uuidSchema,
});

export type CompleteNodeBody = z.infer<typeof completeNodeBodySchema>;
