/**
 * Phase 2.6-A3: Learning Progress Validation
 * 
 * Input validation utilities for learning progress operations.
 * Extracted from learning-progress.service.ts for better modularity.
 * 
 * These are pure validation functions that throw typed errors on invalid input.
 */

import { LearningProgressError } from './learning-progress.types';

/**
 * Validate user ID
 * 
 * @throws {LearningProgressError} if userId is invalid
 */
export function validateUserId(userId: string): void {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new LearningProgressError(
      'Invalid userId',
      'INVALID_USER_ID',
      { userId }
    );
  }
}

/**
 * Validate navigation node ID
 * 
 * @throws {LearningProgressError} if navigationNodeId is invalid
 */
export function validateNavigationNodeId(navigationNodeId: string): void {
  if (
    !navigationNodeId ||
    typeof navigationNodeId !== 'string' ||
    navigationNodeId.trim() === ''
  ) {
    throw new LearningProgressError(
      'Invalid navigationNodeId',
      'INVALID_NAVIGATION_NODE_ID',
      { navigationNodeId }
    );
  }
}

/**
 * Validate session ID
 * 
 * Session ID must be a stable learning session identifier:
 * - Authenticated: JWT family/session ID
 * - Anonymous: Client-generated UUID
 * 
 * @throws {LearningProgressError} if sessionId is invalid
 */
export function validateSessionId(sessionId: string): void {
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
    throw new LearningProgressError(
      'Invalid sessionId - stable session identity required',
      'INVALID_SESSION_ID',
      { sessionId }
    );
  }
}

/**
 * Validate block ID
 * 
 * Block ID is the actual block identity (NOT blockType).
 * 
 * @throws {LearningProgressError} if blockId is invalid
 */
export function validateBlockId(blockId: string): void {
  if (!blockId || typeof blockId !== 'string' || blockId.trim() === '') {
    throw new LearningProgressError(
      'Invalid blockId - block identity required',
      'INVALID_BLOCK_ID',
      { blockId }
    );
  }
}

/**
 * Validate block version
 * 
 * Block version identifies content version (e.g., "D1", "C1", "S1").
 * 
 * @throws {LearningProgressError} if blockVersion is invalid
 */
export function validateBlockVersion(blockVersion: string): void {
  if (!blockVersion || typeof blockVersion !== 'string' || blockVersion.trim() === '') {
    throw new LearningProgressError(
      'Invalid blockVersion - version identity required',
      'INVALID_BLOCK_VERSION',
      { blockVersion }
    );
  }
}

/**
 * Validate subtopic ID
 * 
 * @throws {LearningProgressError} if subtopicId is invalid
 */
export function validateSubtopicId(subtopicId: string): void {
  if (!subtopicId || typeof subtopicId !== 'string' || subtopicId.trim() === '') {
    throw new LearningProgressError(
      'Invalid subtopicId',
      'INVALID_SUBTOPIC_ID',
      { subtopicId }
    );
  }
}
