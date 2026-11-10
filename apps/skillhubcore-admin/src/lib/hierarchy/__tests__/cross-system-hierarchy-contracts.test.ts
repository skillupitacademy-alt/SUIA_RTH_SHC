import { describe, expect, it } from 'vitest';
import {
  CandidateContent,
  CandidateSidebar,
  HierarchyIdentityMapping,
  isContentDeliverableToLearner,
  resolveDeliverableSidebar,
  resolveDeliverableTutorial,
  verifyCrossSystemIdentity,
} from '../cross-system-hierarchy-contracts';

const UUID_MAIN_TOPIC = '10000000-0000-4000-8000-000000000001';
const UUID_MAIN_SUBTOPIC = '20000000-0000-4000-8000-000000000002';
const NODE_PAGE_1 = 'what-is-javascript';

describe('Cross-System Hierarchy Identity & Visibility Contracts (Task 15)', () => {
  describe('Cross-Database Identity Equivalence', () => {
    it('verifies valid cross-database identity mapping', () => {
      const mapping: HierarchyIdentityMapping = {
        mainTopicId: UUID_MAIN_TOPIC,
        tutorialTopicExternalId: UUID_MAIN_TOPIC,
        mainSubtopicId: UUID_MAIN_SUBTOPIC,
        tutorialSubtopicExternalId: UUID_MAIN_SUBTOPIC,
        sidebarNavigationNodeId: NODE_PAGE_1,
        sectionNavigationNodeId: NODE_PAGE_1,
      };

      const result = verifyCrossSystemIdentity(mapping);
      expect(result.valid).toBe(true);
      expect(result.mismatches).toHaveLength(0);
    });

    it('flags topic, subtopic, and navigation node mismatches', () => {
      const mismatched: HierarchyIdentityMapping = {
        mainTopicId: UUID_MAIN_TOPIC,
        tutorialTopicExternalId: 'wrong-topic-id',
        mainSubtopicId: UUID_MAIN_SUBTOPIC,
        tutorialSubtopicExternalId: 'wrong-subtopic-id',
        sidebarNavigationNodeId: NODE_PAGE_1,
        sectionNavigationNodeId: 'different-page-id',
      };

      const result = verifyCrossSystemIdentity(mismatched);
      expect(result.valid).toBe(false);
      expect(result.mismatches).toHaveLength(3);
      expect(result.mismatches[0]).toContain('Topic identity mismatch');
      expect(result.mismatches[1]).toContain('Subtopic identity mismatch');
      expect(result.mismatches[2]).toContain('Page navigation node identity mismatch');
    });
  });

  describe('Brand & Publication Status Truth Table (isContentDeliverableToLearner)', () => {
    it('delivers deployed exact-brand content to skillup learner', () => {
      const candidate: CandidateContent = {
        id: 'c-1',
        subtopicExternalId: UUID_MAIN_SUBTOPIC,
        navigationNodeId: NODE_PAGE_1,
        brandId: 'skillup',
        status: 'deployed',
        version: 1,
      };
      expect(isContentDeliverableToLearner(candidate, 'skillup')).toBe(true);
    });

    it('delivers deployed shared content to skillup learner as fallback', () => {
      const candidate: CandidateContent = {
        id: 'c-2',
        subtopicExternalId: UUID_MAIN_SUBTOPIC,
        navigationNodeId: NODE_PAGE_1,
        brandId: 'shared',
        status: 'deployed',
        version: 1,
      };
      expect(isContentDeliverableToLearner(candidate, 'skillup')).toBe(true);
    });

    it('BLOCKS realtutorialhub private content from being delivered to skillup learner', () => {
      const candidate: CandidateContent = {
        id: 'c-3',
        subtopicExternalId: UUID_MAIN_SUBTOPIC,
        navigationNodeId: NODE_PAGE_1,
        brandId: 'realtutorialhub',
        status: 'deployed',
        version: 1,
      };
      expect(isContentDeliverableToLearner(candidate, 'skillup')).toBe(false);
    });

    it('delivers deployed exact-brand content to realtutorialhub learner', () => {
      const candidate: CandidateContent = {
        id: 'c-4',
        subtopicExternalId: UUID_MAIN_SUBTOPIC,
        navigationNodeId: NODE_PAGE_1,
        brandId: 'realtutorialhub',
        status: 'deployed',
        version: 1,
      };
      expect(isContentDeliverableToLearner(candidate, 'realtutorialhub')).toBe(true);
    });

    it('BLOCKS skillup private content from being delivered to realtutorialhub learner', () => {
      const candidate: CandidateContent = {
        id: 'c-5',
        subtopicExternalId: UUID_MAIN_SUBTOPIC,
        navigationNodeId: NODE_PAGE_1,
        brandId: 'skillup',
        status: 'deployed',
        version: 1,
      };
      expect(isContentDeliverableToLearner(candidate, 'realtutorialhub')).toBe(false);
    });

    it('BLOCKS draft content from being delivered to any learner', () => {
      const draftCandidate: CandidateContent = {
        id: 'c-6',
        subtopicExternalId: UUID_MAIN_SUBTOPIC,
        navigationNodeId: NODE_PAGE_1,
        brandId: 'skillup',
        status: 'draft',
        version: 1,
      };
      expect(isContentDeliverableToLearner(draftCandidate, 'skillup')).toBe(false);
      expect(isContentDeliverableToLearner(draftCandidate, 'realtutorialhub')).toBe(false);
    });

    it('BLOCKS approved (editorial review status) content from being delivered to learners', () => {
      const approvedCandidate: CandidateContent = {
        id: 'c-7',
        subtopicExternalId: UUID_MAIN_SUBTOPIC,
        navigationNodeId: NODE_PAGE_1,
        brandId: 'shared',
        status: 'approved',
        version: 1,
      };
      expect(isContentDeliverableToLearner(approvedCandidate, 'skillup')).toBe(false);
      expect(isContentDeliverableToLearner(approvedCandidate, 'realtutorialhub')).toBe(false);
    });
  });

  describe('Deterministic Precedence Resolution (resolveDeliverableTutorial)', () => {
    it('exact brand match overrides shared content for that brand', () => {
      const sharedDeployed: CandidateContent = {
        id: 'shared-deployed',
        subtopicExternalId: UUID_MAIN_SUBTOPIC,
        navigationNodeId: NODE_PAGE_1,
        brandId: 'shared',
        status: 'deployed',
        version: 1,
      };

      const skillupOverride: CandidateContent = {
        id: 'skillup-deployed',
        subtopicExternalId: UUID_MAIN_SUBTOPIC,
        navigationNodeId: NODE_PAGE_1,
        brandId: 'skillup',
        status: 'deployed',
        version: 2,
      };

      const candidates = [sharedDeployed, skillupOverride];

      // Skillup learner receives skillup override
      const skillupResult = resolveDeliverableTutorial(
        candidates,
        'skillup',
        UUID_MAIN_SUBTOPIC,
        NODE_PAGE_1
      );
      expect(skillupResult?.id).toBe('skillup-deployed');

      // RealTutorialHub learner receives shared deployed (skillup override is invisible to them)
      const rthResult = resolveDeliverableTutorial(
        candidates,
        'realtutorialhub',
        UUID_MAIN_SUBTOPIC,
        NODE_PAGE_1
      );
      expect(rthResult?.id).toBe('shared-deployed');
    });

    it('returns null when only draft content exists', () => {
      const draftOnly: CandidateContent = {
        id: 'draft-1',
        subtopicExternalId: UUID_MAIN_SUBTOPIC,
        navigationNodeId: NODE_PAGE_1,
        brandId: 'skillup',
        status: 'draft',
        version: 1,
      };

      const result = resolveDeliverableTutorial(
        [draftOnly],
        'skillup',
        UUID_MAIN_SUBTOPIC,
        NODE_PAGE_1
      );
      expect(result).toBeNull();
    });

    it('returns null when cross-tenant private content exists but no shared or tenant content', () => {
      const rthOnly: CandidateContent = {
        id: 'rth-only',
        subtopicExternalId: UUID_MAIN_SUBTOPIC,
        navigationNodeId: NODE_PAGE_1,
        brandId: 'realtutorialhub',
        status: 'deployed',
        version: 1,
      };

      const result = resolveDeliverableTutorial(
        [rthOnly],
        'skillup',
        UUID_MAIN_SUBTOPIC,
        NODE_PAGE_1
      );
      expect(result).toBeNull();
    });
  });

  describe('Sidebar Delivery Resolution (resolveDeliverableSidebar)', () => {
    it('delivers brand-specific sidebar first, falling back to shared', () => {
      const sidebars: CandidateSidebar[] = [
        {
          topicExternalId: UUID_MAIN_TOPIC,
          brandId: 'shared',
          status: 'published',
          version: 1,
        },
        {
          topicExternalId: UUID_MAIN_TOPIC,
          brandId: 'skillup',
          status: 'published',
          version: 2,
        },
      ];

      // Skillup gets skillup sidebar
      const skillupSidebar = resolveDeliverableSidebar(sidebars, 'skillup', UUID_MAIN_TOPIC);
      expect(skillupSidebar?.brandId).toBe('skillup');

      // RTH gets shared sidebar (skillup is invisible to RTH)
      const rthSidebar = resolveDeliverableSidebar(sidebars, 'realtutorialhub', UUID_MAIN_TOPIC);
      expect(rthSidebar?.brandId).toBe('shared');
    });

    it('does not deliver draft sidebars to learners', () => {
      const draftSidebars: CandidateSidebar[] = [
        {
          topicExternalId: UUID_MAIN_TOPIC,
          brandId: 'skillup',
          status: 'draft',
          version: 1,
        },
      ];

      const result = resolveDeliverableSidebar(draftSidebars, 'skillup', UUID_MAIN_TOPIC);
      expect(result).toBeNull();
    });
  });
});

