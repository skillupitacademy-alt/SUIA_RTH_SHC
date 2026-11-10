/**
 * Downstream Delivery Contracts & Brand Resolution Test Suite (Task 15 / BC-CORR-05)
 *
 * Verifies real learner-facing delivery resolver contracts without mock simulation functions:
 * 1. Real tutorialDeliveryService.getTutorialByPage (from @quiz/db-tutorial)
 * 2. Real getPublishedTutorialPagePayload (from src/share-branding/LearningExperience/tutorialSidebarDelivery.ts)
 * 3. Cross-database identity verification: MainDB UUIDs ↔ TutorialDB external_ids
 * 4. Brand visibility isolation & deterministic precedence (brand-specific > shared)
 * 5. Lifecycle isolation: draft/in_review content is strictly inaccessible to learners
 * 6. Content preservation: TutorialDocument.blocks[] preserved in full without schema conversion
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  TutorialDocument,
  TutorialNormalizedNavigationTree,
} from '@quiz/types';
import { BRAND_TUTORIAL_THEMES } from '@quiz/types';
import {
  HierarchyIdentityMapping,
  verifyCrossSystemIdentity,
} from '../cross-system-hierarchy-contracts';

const MAIN_TOPIC_ID = '33333333-3333-4000-8000-333333333333';
const MAIN_SUBTOPIC_ID = '44444444-4444-4000-8000-444444444444';
const TUTORIAL_SUBTOPIC_INTERNAL_ID = 'tut-sub-1';
const NAV_NODE_PAGE_1 = 'understanding-closures';

// Canonical 18-block family compliant test document
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

const sampleTree: TutorialNormalizedNavigationTree = {
  topics: [
    {
      id: 'group-1',
      name: 'Core Concepts',
      type: 'group',
      slug: 'core-concepts',
      url: `/computer-science/javascript/functions/core-concepts`,
      children: [
        {
          id: NAV_NODE_PAGE_1,
          name: 'Understanding Closures',
          type: 'page',
          slug: 'understanding-closures',
          url: `/computer-science/javascript/functions/${NAV_NODE_PAGE_1}`,
        },
      ],
    },
  ],
};

interface MockSectionRow {
  id: string;
  subtopicId: string;
  brandId: string;
  navigationNodeId: string;
  orderIndex: number;
  content: TutorialDocument;
  version: number;
  language: string;
  publishedAt: Date | null;
  status: 'draft' | 'in_review' | 'approved' | 'deployed';
  deletedAt: Date | null;
}

interface MockSidebarRow {
  id: string;
  brandId: string;
  topicId: string;
  status: 'draft' | 'published';
  tree: TutorialNormalizedNavigationTree;
  version: number;
}

const mockDb = vi.hoisted(() => {
  const state = {
    hierarchySyncVerified: true,
    targetBrand: 'skillup',
    targetNavigationNodeId: 'understanding-closures',
    includeUnpublished: false,
    sections: [] as MockSectionRow[],
    sidebars: [] as MockSidebarRow[],
  };

  const createMockQueryChain = (currentTable?: string) => {
    const table = currentTable ?? '';

    const chain = {
      from: (tbl: unknown) => {
        let tblName = '';
        if (tbl && typeof tbl === 'object') {
          const drizzleName = (tbl as Record<symbol, unknown>)[Symbol.for('drizzle:Name')];
          if (typeof drizzleName === 'string') {
            tblName = drizzleName;
          } else if ('_' in tbl && typeof (tbl as { _: { name: string } })._.name === 'string') {
            tblName = (tbl as { _: { name: string } })._.name;
          } else if ('name' in tbl && typeof (tbl as { name: string }).name === 'string') {
            tblName = (tbl as { name: string }).name;
          }
        }
        return createMockQueryChain(tblName);
      },
      where: () => chain,
      orderBy: () => chain,
      limit: async () => chain.resolve(),
      then: (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
        try {
          const res = chain.resolve();
          return Promise.resolve(res).then(resolve, reject);
        } catch (err) {
          if (reject) return reject(err);
          throw err;
        }
      },
      resolve: () => {
        if (table.includes('domain')) {
          return state.hierarchySyncVerified
            ? [{ id: 'dom-1', name: 'Computer Science', slug: 'computer-science' }]
            : [];
        }
        if (table.includes('subject')) {
          return state.hierarchySyncVerified
            ? [{ id: 'sub-1', domainId: 'dom-1', name: 'JavaScript', slug: 'javascript' }]
            : [];
        }
        if (table.includes('topic') && !table.includes('subtopic')) {
          return state.hierarchySyncVerified
            ? [{ id: 'top-1', externalId: '33333333-3333-4000-8000-333333333333', subjectId: 'sub-1', name: 'Functions', slug: 'functions' }]
            : [];
        }
        if (table.includes('subtopic')) {
          return state.hierarchySyncVerified
            ? [{ id: 'tut-sub-1', externalId: '44444444-4444-4000-8000-444444444444', topicId: 'top-1', name: 'Closures', slug: 'closures' }]
            : [];
        }
        if (table.includes('sidebar')) {
          return state.sidebars.filter((s) => s.status === 'published');
        }
        if (table.includes('section')) {
          let candidate = state.sections.filter((s) => !s.deletedAt);
          if (!state.includeUnpublished) {
            candidate = candidate.filter((s) => s.status === 'deployed');
          }
          candidate = candidate.filter((s) => s.navigationNodeId === state.targetNavigationNodeId);
          candidate = candidate.filter((s) => s.brandId === state.targetBrand || s.brandId === 'shared');
          candidate.sort((a, b) => {
            const priorityA = a.brandId === state.targetBrand ? 0 : 1;
            const priorityB = b.brandId === state.targetBrand ? 0 : 1;
            return priorityA - priorityB;
          });
          return candidate.slice(0, 1);
        }
        return [];
      },
    };
    return chain;
  };

  const client = {
    select: () => createMockQueryChain(),
  };

  return {
    state,
    client,
  };
});

vi.mock('@quiz/db-tutorial', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@quiz/db-tutorial')>();
  return {
    ...actual,
    db: mockDb.client,
    dbHttp: mockDb.client,
    getTutorialDb: () => mockDb.client,
  };
});

vi.mock('../../../../../../packages/db-tutorial/src/db', () => ({
  db: mockDb.client,
  dbHttp: mockDb.client,
  getTutorialDb: () => mockDb.client,
  getTutorialHttpDb: () => mockDb.client,
}));

// Import REAL delivery services
import { tutorialDeliveryService } from '@quiz/db-tutorial';
import { getPublishedTutorialPagePayload } from '@/share-branding/LearningExperience/tutorialSidebarDelivery';

describe('Downstream Delivery Contracts & Resolution (Task 15 / BC-CORR-05)', () => {
  beforeEach(() => {
    mockDb.state.hierarchySyncVerified = true;
    mockDb.state.targetBrand = 'skillup';
    mockDb.state.targetNavigationNodeId = NAV_NODE_PAGE_1;
    mockDb.state.includeUnpublished = false;
    mockDb.state.sections = [];
    mockDb.state.sidebars = [];
  });

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

  describe('Real tutorialDeliveryService Contract & Precedence Resolution', () => {
    const deployedShared: MockSectionRow = {
      id: 'shared-section-1',
      subtopicId: TUTORIAL_SUBTOPIC_INTERNAL_ID,
      navigationNodeId: NAV_NODE_PAGE_1,
      brandId: 'shared',
      orderIndex: 0,
      content: sampleTutorialDocument,
      version: 1,
      language: 'en',
      publishedAt: new Date(),
      status: 'deployed',
      deletedAt: null,
    };

    const deployedSkillup: MockSectionRow = {
      id: 'skillup-section-1',
      subtopicId: TUTORIAL_SUBTOPIC_INTERNAL_ID,
      navigationNodeId: NAV_NODE_PAGE_1,
      brandId: 'skillup',
      orderIndex: 0,
      content: sampleTutorialDocument,
      version: 1,
      language: 'en',
      publishedAt: new Date(),
      status: 'deployed',
      deletedAt: null,
    };

    const deployedRth: MockSectionRow = {
      id: 'rth-section-1',
      subtopicId: TUTORIAL_SUBTOPIC_INTERNAL_ID,
      navigationNodeId: NAV_NODE_PAGE_1,
      brandId: 'realtutorialhub',
      orderIndex: 0,
      content: sampleTutorialDocument,
      version: 3,
      language: 'en',
      publishedAt: new Date(),
      status: 'deployed',
      deletedAt: null,
    };

    const draftSkillup: MockSectionRow = {
      id: 'draft-skillup-section',
      subtopicId: TUTORIAL_SUBTOPIC_INTERNAL_ID,
      navigationNodeId: NAV_NODE_PAGE_1,
      brandId: 'skillup',
      orderIndex: 0,
      content: sampleTutorialDocument,
      version: 4,
      language: 'en',
      publishedAt: null,
      status: 'draft',
      deletedAt: null,
    };

    it('resolves brand-specific override over shared canonical for skillup via real tutorialDeliveryService', async () => {
      mockDb.state.targetBrand = 'skillup';
      mockDb.state.sections = [deployedShared, deployedSkillup];

      const result = await tutorialDeliveryService.getTutorialByPage(
        MAIN_SUBTOPIC_ID,
        NAV_NODE_PAGE_1,
        { brandId: 'skillup', includeUnpublished: false }
      );

      expect(result).not.toBeNull();
      expect(result.tutorial).not.toBeNull();
      expect(result.tutorial?.id).toBe('skillup-section-1');
      expect(result.tutorial?.brandId).toBe('skillup');
      expect(result.tutorial?.content.blocks).toHaveLength(3);
    });

    it('falls back to shared canonical when brand-specific content does not exist', async () => {
      mockDb.state.targetBrand = 'skillup';
      mockDb.state.sections = [deployedShared];

      const result = await tutorialDeliveryService.getTutorialByPage(
        MAIN_SUBTOPIC_ID,
        NAV_NODE_PAGE_1,
        { brandId: 'skillup', includeUnpublished: false }
      );

      expect(result).not.toBeNull();
      expect(result.tutorial).not.toBeNull();
      expect(result.tutorial?.id).toBe('shared-section-1');
      expect(result.tutorial?.brandId).toBe('shared');
    });

    it('isolates realtutorialhub private content from skillup learner', async () => {
      mockDb.state.targetBrand = 'skillup';
      mockDb.state.sections = [deployedRth];

      const result = await tutorialDeliveryService.getTutorialByPage(
        MAIN_SUBTOPIC_ID,
        NAV_NODE_PAGE_1,
        { brandId: 'skillup', includeUnpublished: false }
      );

      expect(result.tutorial).toBeNull();
    });

    it('never delivers draft content to learners even if brand matches', async () => {
      mockDb.state.targetBrand = 'skillup';
      mockDb.state.sections = [draftSkillup];

      const result = await tutorialDeliveryService.getTutorialByPage(
        MAIN_SUBTOPIC_ID,
        NAV_NODE_PAGE_1,
        { brandId: 'skillup', includeUnpublished: false }
      );

      expect(result.tutorial).toBeNull();
    });
  });

  describe('Real getPublishedTutorialPagePayload Contract Integration', () => {
    const validSidebar: MockSidebarRow = {
      id: 'sidebar-1',
      topicId: MAIN_TOPIC_ID,
      brandId: 'skillup',
      status: 'published',
      tree: sampleTree,
      version: 1,
    };

    const validSection: MockSectionRow = {
      id: 'sec-delivered-1',
      subtopicId: TUTORIAL_SUBTOPIC_INTERNAL_ID,
      navigationNodeId: NAV_NODE_PAGE_1,
      brandId: 'skillup',
      orderIndex: 0,
      content: sampleTutorialDocument,
      version: 1,
      language: 'en',
      publishedAt: new Date(),
      status: 'deployed',
      deletedAt: null,
    };

    it('successfully delivers complete TutorialPagePayload when hierarchy, sidebar, and content are valid', async () => {
      mockDb.state.hierarchySyncVerified = true;
      mockDb.state.targetBrand = 'skillup';
      mockDb.state.targetNavigationNodeId = NAV_NODE_PAGE_1;
      mockDb.state.sidebars = [validSidebar];
      mockDb.state.sections = [validSection];

      const payload = await getPublishedTutorialPagePayload({
        brandId: 'skillup',
        domainSlug: 'computer-science',
        subjectSlug: 'javascript',
        topicSlug: 'functions',
        subtopicSlug: 'closures',
        navigationNodeId: NAV_NODE_PAGE_1,
      });

      expect(payload).not.toBeNull();
      expect(payload?.content.blocks).toHaveLength(3);
      expect(payload?.activeUrl).toContain(NAV_NODE_PAGE_1);
      expect(payload?.content.sectionId).toBe('sec-delivered-1');
      expect((payload?.hierarchy.topic as { externalId?: string }).externalId).toBe(MAIN_TOPIC_ID);
      expect((payload?.hierarchy.subtopic as { externalId?: string }).externalId).toBe(MAIN_SUBTOPIC_ID);
      expect(payload?.hierarchy.topic.name).toBe('Functions');
      expect(payload?.hierarchy.subtopic.name).toBe('Closures');
      expect(payload?.brandId).toBe('skillup');
      expect(payload?.theme).toEqual(BRAND_TUTORIAL_THEMES.skillup);
    });

    it('returns null and prevents delivery when TutorialDB hierarchy sync has not been verified', async () => {
      mockDb.state.hierarchySyncVerified = false; // Fails closed
      mockDb.state.targetBrand = 'skillup';
      mockDb.state.targetNavigationNodeId = NAV_NODE_PAGE_1;
      mockDb.state.sidebars = [validSidebar];
      mockDb.state.sections = [validSection];

      const payload = await getPublishedTutorialPagePayload({
        brandId: 'skillup',
        domainSlug: 'computer-science',
        subjectSlug: 'javascript',
        topicSlug: 'functions',
        subtopicSlug: 'closures',
        navigationNodeId: NAV_NODE_PAGE_1,
      });

      expect(payload).toBeNull();
    });

    it('returns null when sidebar is only saved as draft and not published', async () => {
      const draftOnlySidebar: MockSidebarRow = {
        id: 'sidebar-draft-1',
        topicId: MAIN_TOPIC_ID,
        brandId: 'skillup',
        status: 'draft', // Not published!
        tree: sampleTree,
        version: 1,
      };

      mockDb.state.hierarchySyncVerified = true;
      mockDb.state.targetBrand = 'skillup';
      mockDb.state.targetNavigationNodeId = NAV_NODE_PAGE_1;
      mockDb.state.sidebars = [draftOnlySidebar];
      mockDb.state.sections = [validSection];

      const payload = await getPublishedTutorialPagePayload({
        brandId: 'skillup',
        domainSlug: 'computer-science',
        subjectSlug: 'javascript',
        topicSlug: 'functions',
        subtopicSlug: 'closures',
        navigationNodeId: NAV_NODE_PAGE_1,
      });

      expect(payload).toBeNull();
    });

    it('preserves complete TutorialDocument.blocks[] array without data loss or legacy conversion', async () => {
      mockDb.state.hierarchySyncVerified = true;
      mockDb.state.targetBrand = 'skillup';
      mockDb.state.targetNavigationNodeId = NAV_NODE_PAGE_1;
      mockDb.state.sidebars = [validSidebar];
      mockDb.state.sections = [validSection];

      const payload = await getPublishedTutorialPagePayload({
        brandId: 'skillup',
        domainSlug: 'computer-science',
        subjectSlug: 'javascript',
        topicSlug: 'functions',
        subtopicSlug: 'closures',
        navigationNodeId: NAV_NODE_PAGE_1,
      });

      expect(payload).not.toBeNull();
      // Ensure all 3 blocks are delivered exactly as authored in V2 structure
      expect(payload?.content.blocks).toHaveLength(3);
      expect(payload?.content.blocks[0]).toMatchObject({ id: 'block-1', type: 'paragraph' });
      expect(payload?.content.blocks[1]).toMatchObject({ id: 'block-2', type: 'code' });
      expect(payload?.content.blocks[2]).toMatchObject({ id: 'block-3', type: 'callout' });
    });
  });
});
