/**
 * Cross-System Hierarchy Identity & Visibility Contracts (Task 15)
 *
 * Implements and verifies:
 * 1. Cross-database identity resolution contracts (MainDB UUID ↔ TutorialDB external_id).
 * 2. Brand visibility truth table between SUIA (skillup), RTH (realtutorialhub), and shared.
 * 3. Strict publication/draft isolation (draft/approved content never delivered to learners).
 * 4. Deterministic brand precedence (brand-specific override takes precedence over shared canonical).
 */

export type DeliveryBrand = 'skillup' | 'realtutorialhub';
export type ContentScope = 'skillup' | 'realtutorialhub' | 'shared';
export type PublicationStatus = 'draft' | 'in_review' | 'approved' | 'deployed';

export interface HierarchyIdentityMapping {
  mainTopicId: string;
  tutorialTopicExternalId: string;
  mainSubtopicId: string;
  tutorialSubtopicExternalId: string;
  sidebarNavigationNodeId: string;
  sectionNavigationNodeId: string;
}

export interface CandidateContent {
  id: string;
  subtopicExternalId: string;
  navigationNodeId: string;
  brandId: ContentScope;
  status: PublicationStatus;
  version: number;
}

export interface CandidateSidebar {
  topicExternalId: string;
  brandId: ContentScope;
  status: 'draft' | 'published';
  version: number;
}

/**
 * Validates cross-system hierarchy identity equivalence.
 * Verifies that the MainDB primary keys correctly resolve to TutorialDB external IDs,
 * and sidebar navigationNodeId matches the tutorial section page identity.
 */
export function verifyCrossSystemIdentity(mapping: HierarchyIdentityMapping): {
  valid: boolean;
  mismatches: string[];
} {
  const mismatches: string[] = [];

  if (mapping.mainTopicId !== mapping.tutorialTopicExternalId) {
    mismatches.push(
      `Topic identity mismatch: MainDB (${mapping.mainTopicId}) !== TutorialDB externalId (${mapping.tutorialTopicExternalId})`
    );
  }

  if (mapping.mainSubtopicId !== mapping.tutorialSubtopicExternalId) {
    mismatches.push(
      `Subtopic identity mismatch: MainDB (${mapping.mainSubtopicId}) !== TutorialDB externalId (${mapping.tutorialSubtopicExternalId})`
    );
  }

  if (mapping.sidebarNavigationNodeId !== mapping.sectionNavigationNodeId) {
    mismatches.push(
      `Page navigation node identity mismatch: Sidebar (${mapping.sidebarNavigationNodeId}) !== Section (${mapping.sectionNavigationNodeId})`
    );
  }

  return {
    valid: mismatches.length === 0,
    mismatches,
  };
}

/**
 * Evaluates whether a candidate tutorial section can be delivered to a learner
 * based on brand, tenancy, and publication lifecycle status.
 *
 * Truth Table:
 * - Learner 'skillup' can see 'skillup' (deployed) or 'shared' (deployed). Never 'realtutorialhub'.
 * - Learner 'realtutorialhub' can see 'realtutorialhub' (deployed) or 'shared' (deployed). Never 'skillup'.
 * - Non-deployed content (draft, in_review, approved) is NEVER delivered to learners.
 */
export function isContentDeliverableToLearner(
  candidate: CandidateContent,
  learnerBrand: DeliveryBrand
): boolean {
  // 1. Publication status gate: ONLY 'deployed' is delivered to learners
  if (candidate.status !== 'deployed') {
    return false;
  }

  // 2. Brand gate: Exact brand match or 'shared'
  if (candidate.brandId === learnerBrand) {
    return true;
  }

  if (candidate.brandId === 'shared') {
    return true;
  }

  // Cross-tenant access is forbidden (e.g. skillup learner cannot see realtutorialhub content)
  return false;
}

/**
 * Resolves the winning tutorial section for a learner given available candidates.
 * Deterministic precedence:
 * 1. Exact learner brand match ('deployed') takes highest precedence (Priority 0).
 * 2. Canonical 'shared' match ('deployed') serves as universal fallback (Priority 1).
 * 3. If no matching deployed content exists, returns null.
 */
export function resolveDeliverableTutorial(
  candidates: CandidateContent[],
  learnerBrand: DeliveryBrand,
  subtopicExternalId: string,
  navigationNodeId: string
): CandidateContent | null {
  const matching = candidates.filter(
    (c) =>
      c.subtopicExternalId === subtopicExternalId &&
      c.navigationNodeId === navigationNodeId &&
      isContentDeliverableToLearner(c, learnerBrand)
  );

  if (matching.length === 0) {
    return null;
  }

  // Priority 1: Exact brand match
  const exactBrand = matching.find((c) => c.brandId === learnerBrand);
  if (exactBrand) {
    return exactBrand;
  }

  // Priority 2: Universal shared fallback
  const shared = matching.find((c) => c.brandId === 'shared');
  if (shared) {
    return shared;
  }

  return null;
}

/**
 * Evaluates whether a sidebar tree is deliverable to a learner.
 * Must be published and match either learner brand or shared.
 */
export function resolveDeliverableSidebar(
  sidebars: CandidateSidebar[],
  learnerBrand: DeliveryBrand,
  topicExternalId: string
): CandidateSidebar | null {
  const published = sidebars.filter(
    (s) => s.topicExternalId === topicExternalId && s.status === 'published'
  );

  // Exact brand match first
  const exactBrand = published.find((s) => s.brandId === learnerBrand);
  if (exactBrand) {
    return exactBrand;
  }

  // Shared fallback
  const shared = published.find((s) => s.brandId === 'shared');
  if (shared) {
    return shared;
  }

  return null;
}

