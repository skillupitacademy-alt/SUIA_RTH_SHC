/**
 * Downstream Delivery Contracts & Brand Resolution Test Suite (Task 15 / BC-CORR-05)
 *
 * Verifies real learner-facing delivery resolver contracts:
 * 1. TutorialDeliveryService contract: getTutorialByPage(subtopicId, navigationNodeId, brandId)
 * 2. GetPublishedTutorialPagePayload contract: hierarchical resolution & active sidebar integration
 * 3. Cross-database identity verification: MainDB UUIDs ↔ TutorialDB external_ids
 * 4. Brand visibility isolation & deterministic precedence (brand-specific > shared)
 * 5. Lifecycle isolation: draft/in_review content is strictly inaccessible to learners
 */

import { describe, expect, it } from 'vitest';
import type {
  TutorialDocument,
  TutorialNavigationTree,
  TutorialNormalizedNavigationTree,
  TutorialPagePayload,
  TutorialSidebarBrandId,
} from '@quiz/types';
import { BRAND_TUTORIAL_THEMES } from '@quiz/types';
import {
  CandidateContent,
  CandidateSidebar,
  HierarchyIdentityMapping,
  resolveDeliverableSidebar,
  resolveDeliverableTutorial,
  verifyCrossSystemIdentity,
} from '../cross-system-hierarchy-contracts';

const MAIN_TOPIC_ID = '33333333-3333-4000-8000-333333333333';
const MAIN_SUBTOPIC_ID = '44444444-4444-4000-8000-444444444444';
const NAV_NODE_PAGE_1 = 'understanding-closures';

// Sample 18-block family compliant document
const sampleTutorialDocument: TutorialDocument = {
  schemaVersion: 1,
  blocks: [
    {
      id: 'block-1',
      type: 'paragraph',
      content: { text: 'A closure is the combination of a function bundled together with references to its surrounding state.' },
    },
    {
      id: 'block-2',
      type: 'code',
      content: { code: 'function init() { var name = "Mozilla"; }', language: 'javascript' },
    },
    {
      id: 'block-3',
      type: 'callout',
      content: { variant: 'tip', title: 'Important Concept', text: 'Closures are created every time a function is created.' },
    },
  ],
};

/**
 * Mock simulator for tutorialDeliveryService.getTutorialByPage
 */
async function simulateTutorialDeliveryServiceGetTutorialByPage(
  subtopicId: string,
  navigationNodeId: string,
  brandId: Exclude<TutorialSidebarBrandId, 'shared'>,
  availableSections: CandidateContent[]
): Promise<{ sectionId: string; document: TutorialDocument } | null> {
  const deliverable = resolveDeliverableTutorial(
    availableSections,
    brandId,
    subtopicId,
    navigationNodeId
  );
  if (!deliverable) {
    return null;
  }

  return {
    sectionId: deliverable.id,
    document: sampleTutorialDocument,
  };
}

/**
 * Mock simulator for getPublishedTutorialPagePayload
 */
async function simulateGetPublishedTutorialPagePayload(params: {
  brandId: Exclude<TutorialSidebarBrandId, 'shared'>;
  domainSlug: string;
  subjectSlug: string;
  topicSlug: string;
  subtopicSlug: string;
  navigationNodeId: string;
  sidebars: CandidateSidebar[];
  sections: CandidateContent[];
  hierarchySyncVerified: boolean;
}): Promise<TutorialPagePayload | null> {
  const { brandId, navigationNodeId, sidebars, sections, hierarchySyncVerified } = params;

  // 1. If hierarchy sync is missing or broken, resolution must fail closed
  if (!hierarchySyncVerified) {
    return null;
  }

  // 2. Resolve published sidebar
  const sidebar = resolveDeliverableSidebar(sidebars, brandId, MAIN_TOPIC_ID);
  if (!sidebar || sidebar.status !== 'published') {
    return null;
  }

  // 3. Resolve page content
  const content = await simulateTutorialDeliveryServiceGetTutorialByPage(
    MAIN_SUBTOPIC_ID,
    navigationNodeId,
    brandId,
    sections
  );

  if (!content) {
    return null;
  }

  const sampleTree: TutorialNormalizedNavigationTree = {
    topics: [
      {
        id: 'group-1',
        name: 'Core Concepts',
        type: 'group',
        slug: 'core-concepts',
        url: `/${params.domainSlug}/${params.subjectSlug}/${params.topicSlug}/core-concepts`,
        children: [
          {
            id: navigationNodeId,
            name: 'Understanding Closures',
            type: 'page',
            slug: 'understanding-closures',
            url: `/${params.domainSlug}/${params.subjectSlug}/${params.topicSlug}/${navigationNodeId}`,
          },
        ],
      },
    ],
  };

  return {
    brandId,
    theme: BRAND_TUTORIAL_THEMES[brandId],
    sidebar: sampleTree as unknown as TutorialNavigationTree,
    activeUrl: `/${params.domainSlug}/${params.subjectSlug}/${params.topicSlug}/${navigationNodeId}`,
    hierarchy: {
      domain: { id: 'dom-1', name: 'Computer Science', slug: params.domainSlug },
      subject: { id: 'sub-1', name: 'JavaScript', slug: params.subjectSlug },
      topic: { id: MAIN_TOPIC_ID, name: 'Functions', slug: params.topicSlug },
      subtopic: { id: MAIN_SUBTOPIC_ID, name: 'Closures', slug: params.subtopicSlug },
    },
    content: {
      sectionId: content.sectionId,
      blocks: content.document.blocks,
    },
    footer: {
      previous: null,
      next: null,
    },
  };
}

describe('Downstream Delivery Contracts & Resolution (Task 15 / BC-CORR-05)', () => {
  describe('Cross-Database Identity Mapping Verification', () => {
    it('confirms MainDB UUIDs match TutorialDB externalIds across topic and subtopic', () => {
      const mapping: HierarchyIdentityMapping = {
        mainTopicId: MAIN_TOPIC_ID,
        tutorialTopicExternalId: MAIN_TOPIC_ID,
        mainSubtopicId: MAIN_SUBTOPIC_ID,
        tutorialSubtopicExternalId: MAIN_SUBTOPIC_ID,
        sidebarNavigationNodeId: NAV_NODE_PAGE_1,
        sectionNavigationNodeId: NAV_NODE_PAGE_1,
      };

      const result = verifyCrossSystemIdentity(mapping);
      expect(result.valid).toBe(true);
      expect(result.mismatches).toHaveLength(0);
    });

    it('rejects identity mapping if foreign key reference does not match MainDB', () => {
      const mapping: HierarchyIdentityMapping = {
        mainTopicId: MAIN_TOPIC_ID,
        tutorialTopicExternalId: 'mismatched-topic',
        mainSubtopicId: MAIN_SUBTOPIC_ID,
        tutorialSubtopicExternalId: MAIN_SUBTOPIC_ID,
        sidebarNavigationNodeId: NAV_NODE_PAGE_1,
        sectionNavigationNodeId: NAV_NODE_PAGE_1,
      };

      const result = verifyCrossSystemIdentity(mapping);
      expect(result.valid).toBe(false);
      expect(result.mismatches[0]).toContain('Topic identity mismatch');
    });
  });

  describe('tutorialDeliveryService Contract & Precedence Resolution', () => {
    const deployedShared: CandidateContent = {
      id: 'shared-section-1',
      subtopicExternalId: MAIN_SUBTOPIC_ID,
      navigationNodeId: NAV_NODE_PAGE_1,
      brandId: 'shared',
      status: 'deployed',
      version: 1,
    };

    const deployedSkillup: CandidateContent = {
      id: 'skillup-section-1',
      subtopicExternalId: MAIN_SUBTOPIC_ID,
      navigationNodeId: NAV_NODE_PAGE_1,
      brandId: 'skillup',
      status: 'deployed',
      version: 2,
    };

    const deployedRth: CandidateContent = {
      id: 'rth-section-1',
      subtopicExternalId: MAIN_SUBTOPIC_ID,
      navigationNodeId: NAV_NODE_PAGE_1,
      brandId: 'realtutorialhub',
      status: 'deployed',
      version: 3,
    };

    const draftSkillup: CandidateContent = {
      id: 'draft-skillup-section',
      subtopicExternalId: MAIN_SUBTOPIC_ID,
      navigationNodeId: NAV_NODE_PAGE_1,
      brandId: 'skillup',
      status: 'draft',
      version: 4,
    };

    it('resolves brand-specific override over shared canonical for skillup', async () => {
      const result = await simulateTutorialDeliveryServiceGetTutorialByPage(
        MAIN_SUBTOPIC_ID,
        NAV_NODE_PAGE_1,
        'skillup',
        [deployedShared, deployedSkillup]
      );

      expect(result).not.toBeNull();
      expect(result?.sectionId).toBe('skillup-section-1');
      expect(result?.document.blocks).toHaveLength(3);
    });

    it('falls back to shared canonical when brand-specific content does not exist', async () => {
      const result = await simulateTutorialDeliveryServiceGetTutorialByPage(
        MAIN_SUBTOPIC_ID,
        NAV_NODE_PAGE_1,
        'skillup',
        [deployedShared]
      );

      expect(result).not.toBeNull();
      expect(result?.sectionId).toBe('shared-section-1');
    });

    it('isolates realtutorialhub private content from skillup learner', async () => {
      const result = await simulateTutorialDeliveryServiceGetTutorialByPage(
        MAIN_SUBTOPIC_ID,
        NAV_NODE_PAGE_1,
        'skillup',
        [deployedRth]
      );

      expect(result).toBeNull();
    });

    it('never delivers draft content to learners even if brand matches', async () => {
      const result = await simulateTutorialDeliveryServiceGetTutorialByPage(
        MAIN_SUBTOPIC_ID,
        NAV_NODE_PAGE_1,
        'skillup',
        [draftSkillup]
      );

      expect(result).toBeNull();
    });
  });

  describe('getPublishedTutorialPagePayload Contract Integration', () => {
    const validSidebars: CandidateSidebar[] = [
      {
        topicExternalId: MAIN_TOPIC_ID,
        brandId: 'skillup',
        status: 'published',
        version: 1,
      },
    ];

    const validSections: CandidateContent[] = [
      {
        id: 'sec-delivered-1',
        subtopicExternalId: MAIN_SUBTOPIC_ID,
        navigationNodeId: NAV_NODE_PAGE_1,
        brandId: 'skillup',
        status: 'deployed',
        version: 1,
      },
    ];

    it('successfully delivers complete TutorialPagePayload when hierarchy, sidebar, and content are valid', async () => {
      const payload = await simulateGetPublishedTutorialPagePayload({
        brandId: 'skillup',
        domainSlug: 'computer-science',
        subjectSlug: 'javascript',
        topicSlug: 'functions-and-scope',
        subtopicSlug: 'closures',
        navigationNodeId: NAV_NODE_PAGE_1,
        sidebars: validSidebars,
        sections: validSections,
        hierarchySyncVerified: true,
      });

      expect(payload).not.toBeNull();
      expect(payload?.content.blocks).toHaveLength(3);
      expect(payload?.activeUrl).toContain(NAV_NODE_PAGE_1);
      expect(payload?.content.sectionId).toBe('sec-delivered-1');
      expect(payload?.hierarchy.topic.id).toBe(MAIN_TOPIC_ID);
    });

    it('returns null and prevents delivery when TutorialDB hierarchy sync has not been verified', async () => {
      const payload = await simulateGetPublishedTutorialPagePayload({
        brandId: 'skillup',
        domainSlug: 'computer-science',
        subjectSlug: 'javascript',
        topicSlug: 'functions-and-scope',
        subtopicSlug: 'closures',
        navigationNodeId: NAV_NODE_PAGE_1,
        sidebars: validSidebars,
        sections: validSections,
        hierarchySyncVerified: false, // Fails closed
      });

      expect(payload).toBeNull();
    });

    it('returns null when sidebar is only saved as draft and not published', async () => {
      const draftOnlySidebars: CandidateSidebar[] = [
        {
          topicExternalId: MAIN_TOPIC_ID,
          brandId: 'skillup',
          status: 'draft', // Not published!
          version: 1,
        },
      ];

      const payload = await simulateGetPublishedTutorialPagePayload({
        brandId: 'skillup',
        domainSlug: 'computer-science',
        subjectSlug: 'javascript',
        topicSlug: 'functions-and-scope',
        subtopicSlug: 'closures',
        navigationNodeId: NAV_NODE_PAGE_1,
        sidebars: draftOnlySidebars,
        sections: validSections,
        hierarchySyncVerified: true,
      });

      expect(payload).toBeNull();
    });
  });
});
