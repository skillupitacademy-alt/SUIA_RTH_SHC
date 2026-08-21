/**
 * Layman Section Repository - DEPRECATED V2 ARCHITECTURE
 * 
 * ⚠️ THIS FILE IS TEMPORARILY DISABLED ⚠️
 * 
 * REASON:
 * The Layman repository was built on the legacy section taxonomy model:
 * - tutorial_sections.section_type = 'layman'
 * - tutorial_subsections
 * 
 * This model no longer exists in V2.
 * 
 * V2 ARCHITECTURE:
 * - Identity: (subtopic_id, brand_id)
 * - Content: TutorialDocument with blocks[]
 * - NO section_type column
 * 
 * MIGRATION PATH:
 * If "Layman" educational content is still required, it must be represented as:
 * 1. TutorialDocument blocks (not database section taxonomy)
 * 2. Specific block types within the tutorial (e.g., "layman_explanation" block)
 * 3. Educational architecture metadata (not section classification)
 * 
 * DO NOT restore this file by adding compatibility wrappers.
 * DO NOT map V2 back to sectionType='layman'.
 * 
 * Instead, determine:
 * - Is "Layman" content still pedagogically required?
 * - If yes: Define it as a TutorialDocument block version
 * - If no: Remove this entire subsystem
 * 
 * AFFECTED FILES (also need V2 migration):
 * - services/layman.service.ts
 * - services/layman-prompt-builder.service.ts
 * - validators/layman.validator.ts
 */

export class LaymanRepository {
  constructor() {
    throw new Error(
      'LaymanRepository is deprecated in V2 architecture. ' +
      'Legacy section taxonomy (section_type="layman") no longer exists. ' +
      'See repository file comments for V2 migration path.'
    );
  }
}
