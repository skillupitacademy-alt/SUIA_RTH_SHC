/**
 * Phase 2.6-A3: Learning Progress Hierarchy Resolution
 * 
 * Navigation hierarchy validation and required block resolution.
 * Extracted from learning-progress.service.ts for better modularity.
 * 
 * RESPONSIBILITIES:
 * - Validate navigationNodeId ↔ subtopicId relationship
 * - Resolve required blocks from canonical content
 * - Enforce brand-scoped content access
 * - Verify hierarchy consistency
 * 
 * NOT RESPONSIBILITIES:
 * - Progress tracking
 * - Visit/session management
 * - Block completion logic
 * - Time tracking
 */

import { MAX_BLOCKS_PER_DOCUMENT, MAX_NESTING_DEPTH } from '@quiz/types';
import type { AuthenticatedIdentity } from './learning-progress.types';
import { InvalidBlockCompletionError, InvalidNavigationHierarchyError } from './learning-progress.types';
import type { TutorialSectionRepository } from '../repositories/tutorial-section.repository';

/** Validate an ID/version against the resolved document, including supported containers. */
export async function validateCompletionMembership(
  sectionRepository: TutorialSectionRepository,
  subtopicId: string,
  navigationNodeId: string,
  identity: AuthenticatedIdentity,
  blockId: string,
  blockVersion: string,
): Promise<void> {
  const section = await sectionRepository.getTutorialByPageIdentity(subtopicId, navigationNodeId, identity.brand);
  const document = section?.content as unknown;
  const fail = (): never => { throw new InvalidBlockCompletionError('Block identity is not present in current tutorial content'); };
  const record = (value: unknown): Record<string, unknown> => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return fail();
    return value as Record<string, unknown>;
  };
  const root = record(document);
  if (root.schemaVersion !== 1 || !Array.isArray(root.blocks)) return fail();
  const seen = new Set<string>();
  let count = 0;
  let matches = 0;
  const walk = (blocks: unknown, depth: number): void => {
    if (!Array.isArray(blocks) || depth > MAX_NESTING_DEPTH) return fail();
    for (const value of blocks) {
      if (++count > MAX_BLOCKS_PER_DOCUMENT) return fail();
      const block = record(value);
      if (typeof block.id !== 'string' || !block.id.trim() || typeof block.type !== 'string' || !block.type.trim()) return fail();
      record(block.content);
      if (block.version !== undefined && (typeof block.version !== 'string' || !block.version.trim())) return fail();
      if (seen.has(block.id)) return fail();
      seen.add(block.id);
      if (block.id === blockId && block.version === blockVersion) matches++;
      if (block.type === 'two-column') {
        const content = record(block.content);
        walk(record(content.left).blocks, depth + 1);
        walk(record(content.right).blocks, depth + 1);
      } else if (block.type === 'three-column' || block.type === 'card-grid' || block.type === 'timeline') {
        const content = record(block.content);
        const entries = block.type === 'three-column' ? content.columns : block.type === 'card-grid' ? content.cards : content.items;
        if (!Array.isArray(entries) || entries.length > MAX_BLOCKS_PER_DOCUMENT || (block.type === 'three-column' && entries.length !== 3)) return fail();
        for (const entry of entries) {
          const child = record(entry);
          if (block.type !== 'timeline' || child.blocks !== undefined) walk(child.blocks, depth + 1);
        }
      }
    }
  };
  walk(root.blocks, 0);
  if (matches !== 1) fail();
}

/**
 * Resolve required blocks from canonical section content
 * 
 * ARCHITECTURE:
 * - Required blocks come from TutorialDocument.blocks[]
 * - Uses generic progressRole contract (instructional | structural | assessment | media)
 * - Versioned instructional blocks (D1, C1, I1, S1, etc.) default to progressRole='instructional'
 * - Returns blockId + blockVersion pairs for progress calculation
 * 
 * GENERIC CONTRACT:
 * - Does NOT hard-code version names (D1, C1, I1, S1)
 * - Works for future instructional UBRC versions automatically
 * - Assessment blocks (Q, EX, T) excluded via progressRole='assessment'
 * - Structural blocks (heading, paragraph) excluded (no version or progressRole='structural')
 * 
 * CRITICAL: Uses authenticated brand - caller CANNOT override
 * 
 * @param sectionRepository - Repository for tutorial section lookups
 * @param subtopicId - Subtopic identifier
 * @param navigationNodeId - Navigation node identifier
 * @param identity - Authenticated identity with brand context
 * @returns Array of required block identities, or [] if section not found
 */
export async function resolveRequiredBlocks(
  sectionRepository: TutorialSectionRepository,
  subtopicId: string,
  navigationNodeId: string,
  identity: AuthenticatedIdentity
): Promise<Array<{ blockId: string; blockVersion: string }>> {
  // Use authenticated brand - no caller override
  const section = await sectionRepository.getTutorialByPageIdentity(
    subtopicId,
    navigationNodeId,
    identity.brand
  );

  if (!section || !section.content || !section.content.blocks) {
    return []; // No section or no blocks = zero required blocks (vacuously complete)
  }

  const requiredBlocks: Array<{ blockId: string; blockVersion: string }> = [];

  // Extract blocks with instructional progress role
  for (const block of section.content.blocks) {
    // Check if block has version field (versioned blocks)
    const versionedBlock = block as { 
      id: string; 
      version?: string;
      progressRole?: 'instructional' | 'structural' | 'assessment' | 'media';
    };
    
    if (versionedBlock.version) {
      // Determine progress role (default to 'instructional' for versioned blocks)
      const progressRole = versionedBlock.progressRole ?? 'instructional';
      
      // Include only instructional blocks in page progress
      if (progressRole === 'instructional') {
        requiredBlocks.push({
          blockId: versionedBlock.id,
          blockVersion: versionedBlock.version,
        });
      }
    }
  }

  return requiredBlocks;
}

/**
 * Validate navigation hierarchy consistency
 * 
 * Verifies that navigationNodeId belongs to the specified subtopicId
 * by checking tutorial_sections table.
 * 
 * HIERARCHY VALIDATION:
 * - navigationNodeId MUST exist in tutorial_sections for given subtopicId + authenticated brand
 * - If sectionId provided, MUST match resolved section
 * - Prevents inconsistent hierarchy combinations
 * 
 * CRITICAL: Uses authenticated brand ONLY - no caller override
 * 
 * @param sectionRepository - Repository for tutorial section lookups
 * @param navigationNodeId - Navigation node identifier
 * @param subtopicId - Subtopic identifier
 * @param sectionId - Optional section identifier for consistency check
 * @param identity - Authenticated identity with brand context
 * @throws InvalidNavigationHierarchyError if hierarchy is inconsistent
 */
export async function validateNavigationHierarchy(
  sectionRepository: TutorialSectionRepository,
  navigationNodeId: string,
  subtopicId: string,
  sectionId: string | null | undefined,
  identity: AuthenticatedIdentity
): Promise<void> {
  // Query tutorial_sections using authenticated brand ONLY
  const section = await sectionRepository.getTutorialByPageIdentity(
    subtopicId,
    navigationNodeId,
    identity.brand // Use authenticated brand - no override
  );

  if (!section) {
    throw new InvalidNavigationHierarchyError(
      `Navigation node '${navigationNodeId}' does not belong to subtopic '${subtopicId}' for brand '${identity.brand}'`,
      {
        navigationNodeId,
        subtopicId,
        brand: identity.brand,
      }
    );
  }

  // If sectionId provided, verify it matches
  if (sectionId && section.id !== sectionId) {
    throw new InvalidNavigationHierarchyError(
      `Section ID mismatch: provided '${sectionId}' does not match resolved '${section.id}'`,
      {
        navigationNodeId,
        subtopicId,
        providedSectionId: sectionId,
        resolvedSectionId: section.id,
      }
    );
  }
}
