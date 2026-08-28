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

import type { AuthenticatedIdentity } from './learning-progress.types';
import { InvalidNavigationHierarchyError } from './learning-progress.types';
import type { TutorialSectionRepository } from '../repositories/tutorial-section.repository';

/**
 * Resolve required blocks from canonical section content
 * 
 * ARCHITECTURE:
 * - Required blocks come from TutorialDocument.blocks[]
 * - Extracts blocks with version='D1'|'C1'|'S1' (required interactive blocks)
 * - Returns blockId + blockVersion pairs for progress calculation
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

  // Extract blocks with required versions (D1, C1, S1)
  for (const block of section.content.blocks) {
    // Check if block has version field (versioned blocks)
    const versionedBlock = block as { id: string; version?: string };
    
    if (
      versionedBlock.version &&
      (versionedBlock.version === 'D1' ||
        versionedBlock.version === 'C1' ||
        versionedBlock.version === 'S1')
    ) {
      requiredBlocks.push({
        blockId: versionedBlock.id,
        blockVersion: versionedBlock.version,
      });
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
