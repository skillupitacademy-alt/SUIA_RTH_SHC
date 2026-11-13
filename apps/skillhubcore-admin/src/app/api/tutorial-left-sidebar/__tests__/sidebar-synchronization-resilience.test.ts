import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const UUID_DOMAIN = '00000000-0000-4000-8000-000000000001';
const UUID_SUBJECT = '00000000-0000-4000-8000-000000000002';
const UUID_TOPIC = '00000000-0000-4000-8000-000000000003';
const UUID_SUBTOPIC = '00000000-0000-4000-8000-000000000004';

const mockState = vi.hoisted(() => ({
  authDenied: null as unknown,
  hierarchyValid: true,
  syncShouldFail: false,
  sidebarInsertShouldFail: false,
  savedRows: [] as unknown[],
  insertCalled: false,
}));

vi.mock('@/lib/admin-route-guard', () => ({
  requireAdminRequest: vi.fn(async () => mockState.authDenied),
}));

vi.mock('@/lib/auth-helpers', () => ({
  authenticateRequest: vi.fn(async () => ({ user: { id: 'admin-1', role: 'super_admin' } })),
  createAuthErrorResponse: vi.fn((err: unknown) => new Response(JSON.stringify(err), { status: 403 })),
  requireBrandAccess: vi.fn(() => null),
  requireSubtopicAccess: vi.fn(() => null),
}));

vi.mock('@quiz/db', () => ({
  domains: { id: 'domains.id', name: 'domains.name' },
  subjects: { id: 'subjects.id', name: 'subjects.name', domainId: 'subjects.domainId' },
  topics: { id: 'topics.id', name: 'topics.name', subjectId: 'topics.subjectId' },
  subtopics: { id: 'subtopics.id', name: 'subtopics.name', topicId: 'subtopics.topicId', deletedAt: 'subtopics.deletedAt' },
  getDb: () => ({
    select: () => ({
      from: (table: Record<string, unknown>) => ({
        where: () => {
          const getRows = () => {
            if (!mockState.hierarchyValid) {
              return [];
            }
            if (table.id === 'domains.id') return [{ id: UUID_DOMAIN, name: 'Web Dev' }];
            if (table.id === 'subjects.id') return [{ id: UUID_SUBJECT, domainId: UUID_DOMAIN, name: 'JavaScript' }];
            if (table.id === 'topics.id') return [{ id: UUID_TOPIC, subjectId: UUID_SUBJECT, name: 'Functions' }];
            if (table.id === 'subtopics.id') return [{ id: UUID_SUBTOPIC, topicId: UUID_TOPIC, name: 'Arrow Functions' }];
            return [];
          };
          const rows = getRows();
          return {
            then: (resolve: (val: unknown[]) => unknown, reject?: (err: unknown) => unknown) =>
              Promise.resolve(rows).then(resolve, reject),
            limit: async () => rows,
          };
        },
      }),
    }),
  }),
}));

vi.mock('@quiz/db-tutorial', () => ({
  HierarchyCoordinationError: class extends Error {},
  withMainHierarchyLocks: async (_scope: unknown, operation: () => Promise<unknown>) => operation(),
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [{ id: 'verified-id' }],
        }),
      }),
    }),
    transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
      const fakeTx = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [{ id: 'verified-id' }],
            }),
          }),
        }),
        insert: (table: unknown) => {
          if (table && typeof table === 'object' && 'brandId' in (table as Record<string, unknown>)) {
            mockState.insertCalled = true;
            if (mockState.sidebarInsertShouldFail) {
              throw new Error('Database transaction rolled back: Sidebar upsert constraint failure');
            }
            return {
              values: (vals: Record<string, unknown>) => ({
                onConflictDoUpdate: () => ({
                  returning: async () => [
                    {
                      id: 'tree-1',
                      brandId: vals.brandId,
                      domainId: vals.domainId,
                      subjectId: vals.subjectId,
                      topicId: vals.topicId,
                      activeSubtopicId: vals.activeSubtopicId,
                      tree: vals.tree,
                      sourceFormat: vals.sourceFormat,
                      sourceContent: vals.sourceContent,
                      status: vals.status,
                      version: 2,
                      publishedAt: vals.publishedAt,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                  ],
                }),
              }),
            };
          }
          return {
            values: () => {
              if (mockState.syncShouldFail) throw new Error('Database transaction rolled back: TutorialDB sync failure');
              return ({
              onConflictDoUpdate: () => ({
                returning: async () => [{ id: 'tx-synced-1' }],
              }),
            }); },
          };
        },
      };
      return callback(fakeTx);
    },
    insert: () => {
      mockState.insertCalled = true;
      return {
        values: (vals: Record<string, unknown>) => ({
          onConflictDoUpdate: () => ({
            returning: async () => [
              {
                id: 'tree-1',
                brandId: vals.brandId,
                domainId: vals.domainId,
                subjectId: vals.subjectId,
                topicId: vals.topicId,
                activeSubtopicId: vals.activeSubtopicId,
                tree: vals.tree,
                sourceFormat: vals.sourceFormat,
                sourceContent: vals.sourceContent,
                status: vals.status,
                version: 2,
                publishedAt: vals.publishedAt,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          }),
        }),
      };
    },
  },
  tutorialSidebarTreesV2: {
    brandId: 'brandId',
    topicId: 'topicId',
    version: 'version',
  },
  tutorialDomains: { id: 'id', externalId: 'externalId' },
  tutorialSubjects: { id: 'id', externalId: 'externalId' },
  tutorialTopics: { id: 'id', externalId: 'externalId' },
  tutorialSubtopics: { id: 'id', externalId: 'externalId' },
}));

import { POST as postSidebarRoute } from '../route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/tutorial-left-sidebar', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Tutorial Left Sidebar Synchronization & Resilience (Task 14)', () => {
  beforeEach(() => {
    mockState.authDenied = null;
    mockState.hierarchyValid = true;
    mockState.syncShouldFail = false;
    mockState.sidebarInsertShouldFail = false;
    mockState.savedRows = [];
    mockState.insertCalled = false;
  });

  const validMarkdownContent = `
- id: fundamentals
  name: Fundamentals
  type: group

  - id: intro
    name: Introduction
    type: page
`;

  const validPayload = {
    brandId: 'skillup',
    domainId: UUID_DOMAIN,
    subjectId: UUID_SUBJECT,
    topicId: UUID_TOPIC,
    activeSubtopicId: UUID_SUBTOPIC,
    sourceFormat: 'markdown',
    sourceContent: validMarkdownContent,
    tree: {
      topics: [
        {
          id: 'fundamentals',
          name: 'Fundamentals',
          type: 'group' as const,
          children: [
            {
              id: 'intro',
              name: 'Introduction',
              type: 'page' as const,
            },
          ],
        },
      ],
    },
    status: 'published',
  };

  it('rejects malformed markdown navigation syntax with 400 Bad Request', async () => {
    const malformedContent = `
- this is not valid yaml or key-value markdown
random unformatted text
`;
    const req = makeRequest({ ...validPayload, sourceContent: malformedContent });
    const res = await postSidebarRoute(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('Invalid Markdown navigation syntax');
    expect(mockState.insertCalled).toBe(false);
  });

  it('rejects navigation tree with excessive depth (> 3 levels) with 400', async () => {
    const deepContent = `
- id: level1
  name: Level 1
  type: group

  - id: level2
    name: Level 2
    type: group

    - id: level3
      name: Level 3
      type: group

      - id: level4
        name: Level 4
        type: page
`;
    const req = makeRequest({ ...validPayload, sourceContent: deepContent });
    const res = await postSidebarRoute(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('Navigation depth exceeds maximum of 3 levels');
    expect(mockState.insertCalled).toBe(false);
  });

  it('rejects group nodes that have no children with 400', async () => {
    const groupWithoutChildren = `
- id: empty-group
  name: Empty Group
  type: group
`;
    const req = makeRequest({ ...validPayload, sourceContent: groupWithoutChildren });
    const res = await postSidebarRoute(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('Group node must have children');
  });

  it('rejects page nodes that contain children with 400', async () => {
    const pageWithChildren = `
- id: bad-page
  name: Bad Page
  type: page

  - id: child
    name: Illegal Child
    type: page
`;
    const req = makeRequest({ ...validPayload, sourceContent: pageWithChildren });
    const res = await postSidebarRoute(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('Page node cannot have children');
  });

  it('rejects duplicate canonical navigation IDs with 400', async () => {
    const duplicateIds = `
- id: group1
  name: Group 1
  type: group

  - id: intro-page
    name: Intro Page
    type: page

  - id: intro-page
    name: Duplicate Intro
    type: page
`;
    const req = makeRequest({ ...validPayload, sourceContent: duplicateIds });
    const res = await postSidebarRoute(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('Duplicate navigation ID');
    expect(mockState.insertCalled).toBe(false);
  });

  it('rejects invalid or foreign hierarchy chain with 400', async () => {
    mockState.hierarchyValid = false;

    const req = makeRequest(validPayload);
    const res = await postSidebarRoute(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('Domain not found');
    expect(mockState.insertCalled).toBe(false);
  });

  it('aborts with 500 and prevents sidebar save if TutorialDB hierarchy sync fails during publish', async () => {
    mockState.syncShouldFail = true;

    const req = makeRequest(validPayload);
    const res = await postSidebarRoute(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Sidebar save failed');
    expect(mockState.insertCalled).toBe(false);
  });

  it('BC-CORR-04: aborts with 500 and rolls back TutorialDB transaction if sidebar insert fails after hierarchy sync', async () => {
    // Both hierarchy sync and sidebar insert run inside a single tutorialDb.transaction.
    // If sidebar upsert fails after hierarchy sync succeeded, the whole transaction must abort and roll back.
    mockState.syncShouldFail = false;
    mockState.sidebarInsertShouldFail = true;

    const req = makeRequest(validPayload);
    const res = await postSidebarRoute(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Sidebar save failed');
    expect(body.details).toBeUndefined();
  });

  it('successfully publishes and increments version when all validations and sync succeed', async () => {
    mockState.syncShouldFail = false;

    const req = makeRequest(validPayload);
    const res = await postSidebarRoute(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('Sidebar published and saved');
    expect(mockState.insertCalled).toBe(true);
    expect(body.sidebar.status).toBe('published');
  });

  it('saves draft without requiring pre-publish hierarchy sync', async () => {
    mockState.syncShouldFail = true; // Even if sync would fail, draft does not execute pre-publish sync!

    const draftPayload = { ...validPayload, status: 'draft' };
    const req = makeRequest(draftPayload);
    const res = await postSidebarRoute(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('Sidebar draft saved');
    expect(mockState.insertCalled).toBe(true);
    expect(body.sidebar.status).toBe('draft');
  });
});
