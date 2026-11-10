import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const UUID_1 = '00000000-0000-4000-8000-000000000001';
const UUID_2 = '00000000-0000-4000-8000-000000000002';

const testState = vi.hoisted(() => ({
  guardDenial: null as unknown,
  childFound: false,
  deleteSuccess: true,
  throwOnSelect: false,
}));

vi.mock('@/lib/admin-route-guard', () => ({
  requireAdminRequest: vi.fn(async () => testState.guardDenial),
}));

vi.mock('@quiz/db', () => {
  const createChain = () => ({
    from: () => createChain(),
    where: () => createChain(),
    orderBy: () => createChain(),
    for: () => createChain(),
    limit: async () => {
      if (testState.throwOnSelect) {
        throw new Error('Database connection failed');
      }
      if (testState.childFound) {
        return [{ id: 'child-1', domainId: UUID_1, subjectId: UUID_1, topicId: UUID_1, name: 'Child Item' }];
      }
      return [];
    },
    then: (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
      if (testState.throwOnSelect) {
        const err = new Error('Database connection failed');
        if (reject) return reject(err);
        throw err;
      }
      return Promise.resolve([]).then(resolve, reject);
    },
  });

  const createClient = () => ({
    select: () => createChain(),
    delete: () => ({
      where: () => ({
        returning: async () => (testState.deleteSuccess ? [{ id: UUID_1 }] : []),
      }),
    }),
    transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback(createClient()),
  });

  return {
    domains: { id: 'domains.id', name: 'domains.name', createdAt: 'domains.createdAt' },
    subjects: { id: 'subjects.id', domainId: 'subjects.domainId', name: 'subjects.name', createdAt: 'subjects.createdAt' },
    topics: { id: 'topics.id', subjectId: 'topics.subjectId', name: 'topics.name', createdAt: 'topics.createdAt' },
    subtopics: { id: 'subtopics.id', topicId: 'subtopics.topicId', name: 'subtopics.name', createdAt: 'subtopics.createdAt' },
    skills: { id: 'skills.id', name: 'skills.name', createdAt: 'skills.createdAt' },
    questions: {
      id: 'questions.id',
      topicId: 'questions.topicId',
      subtopicId: 'questions.subtopicId',
      skillId: 'questions.skillId',
      deletedAt: 'questions.deletedAt',
    },
    questionSkills: {
      questionId: 'questionSkills.questionId',
      skillId: 'questionSkills.skillId',
    },
    topicSkills: {
      topicId: 'topicSkills.topicId',
      skillId: 'topicSkills.skillId',
    },
    getDb: () => createClient(),
  };
});

vi.mock('@quiz/db-tutorial', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [],
        }),
      }),
    }),
  },
  tutorialSidebarTreesV2: { topicId: 'tutorialSidebarTreesV2.topicId' },
  tutorialSubtopics: { id: 'tutorialSubtopics.id', externalId: 'tutorialSubtopics.externalId' },
  tutorialSections: { id: 'tutorialSections.id', subtopicId: 'tutorialSections.subtopicId', deletedAt: 'tutorialSections.deletedAt' },
}));

import { DELETE as deleteDomainRoute } from '../../domains/route';
import { DELETE as deleteDomainByIdRoute } from '../../domains/[id]/route';
import { POST as batchDeleteDomainsRoute } from '../../domains/batch-delete/route';

import { DELETE as deleteSubjectRoute } from '../../subjects/route';
import { DELETE as deleteSubjectByIdRoute } from '../../subjects/[id]/route';
import { POST as batchDeleteSubjectsRoute } from '../../subjects/batch-delete/route';

import { DELETE as deleteTopicRoute } from '../../topics/route';
import { DELETE as deleteTopicByIdRoute } from '../../topics/[id]/route';
import { POST as batchDeleteTopicsRoute } from '../../topics/batch-delete/route';

import { DELETE as deleteSubtopicRoute } from '../../subtopics/route';
import { DELETE as deleteSubtopicByIdRoute } from '../../subtopics/[id]/route';
import { POST as batchDeleteSubtopicsRoute } from '../../subtopics/batch-delete/route';

import { DELETE as deleteSkillRoute } from '../../skills/route';
import { DELETE as deleteSkillByIdRoute } from '../../skills/[id]/route';
import { POST as batchDeleteSkillsRoute } from '../../skills/batch-delete/route';

function makeRequest(url: string, method: string, body?: unknown) {
  const req = new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return req;
}

describe('Hierarchy Destructive Operations - Route Integration (Tasks 12 & 13)', () => {
  beforeEach(() => {
    testState.guardDenial = null;
    testState.childFound = false;
    testState.deleteSuccess = true;
    testState.throwOnSelect = false;
  });

  describe('Single Entity DELETE Route Safety', () => {
    it('returns 409 Conflict when deleting domain with active child subjects', async () => {
      testState.childFound = true;

      const req = makeRequest(`http://localhost/api/admin/domains?id=${UUID_1}`, 'DELETE');
      const res = await deleteDomainRoute(req);
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.conflictType).toBe('DEPENDENCY_CONFLICT');
      expect(body.dependencies?.subjects).toBe(1);
    });

    it('returns 409 Conflict when deleting domain via [id] route with active child subjects', async () => {
      testState.childFound = true;

      const req = makeRequest(`http://localhost/api/admin/domains/${UUID_1}`, 'DELETE');
      const res = await deleteDomainByIdRoute(req, { params: Promise.resolve({ id: UUID_1 }) });
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.conflictType).toBe('DEPENDENCY_CONFLICT');
    });

    it('returns 200 OK when deleting domain without dependencies', async () => {
      testState.childFound = false;

      const req = makeRequest(`http://localhost/api/admin/domains?id=${UUID_1}`, 'DELETE');
      const res = await deleteDomainRoute(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.message).toContain('deleted successfully');
    });

    it('returns 404 when entity to delete does not exist', async () => {
      testState.childFound = false;
      testState.deleteSuccess = false;

      const req = makeRequest(`http://localhost/api/admin/domains?id=${UUID_1}`, 'DELETE');
      const res = await deleteDomainRoute(req);
      expect(res.status).toBe(404);
    });

    it('returns 400 when entity ID is missing or invalid', async () => {
      const req = makeRequest('http://localhost/api/admin/domains', 'DELETE');
      const res = await deleteDomainRoute(req);
      expect(res.status).toBe(400);

      const invalidReq = makeRequest('http://localhost/api/admin/domains?id=not-a-uuid', 'DELETE');
      const invalidRes = await deleteDomainRoute(invalidReq);
      expect(invalidRes.status).toBe(400);
    });
  });

  describe('Batch Delete Bounding & Validation (Task 13)', () => {
    it('rejects batch-delete with 400 when ids array is empty', async () => {
      const req = makeRequest('http://localhost/api/admin/domains/batch-delete', 'POST', { ids: [] });
      const res = await batchDeleteDomainsRoute(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain('IDs are required');
    });

    it('rejects batch-delete with 413 Payload Too Large when ids array exceeds 100 items', async () => {
      const largeArray = Array.from({ length: 101 }, (_, i) =>
        `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`
      );
      const req = makeRequest('http://localhost/api/admin/domains/batch-delete', 'POST', { ids: largeArray });
      const res = await batchDeleteDomainsRoute(req);
      expect(res.status).toBe(413);

      const body = await res.json();
      expect(body.error).toContain('Batch size exceeds maximum limit of 100 items');
    });

    it('rejects batch-delete with 400 when any ID is not a valid UUID', async () => {
      const req = makeRequest('http://localhost/api/admin/domains/batch-delete', 'POST', {
        ids: [UUID_1, 'invalid-uuid-abc'],
      });
      const res = await batchDeleteDomainsRoute(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain('Invalid UUID format');
    });

    it('returns 409 Conflict when any item in batch has active dependencies', async () => {
      testState.childFound = true;

      const req = makeRequest('http://localhost/api/admin/domains/batch-delete', 'POST', {
        ids: [UUID_1, UUID_2],
      });
      const res = await batchDeleteDomainsRoute(req);
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.conflictType).toBe('DEPENDENCY_CONFLICT');
    });

    it('successfully executes batch-delete when all items are free of dependencies', async () => {
      testState.childFound = false;

      const req = makeRequest('http://localhost/api/admin/domains/batch-delete', 'POST', {
        ids: [UUID_1, UUID_2],
      });
      const res = await batchDeleteDomainsRoute(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.message).toContain('2 domains deleted successfully');
    });
  });

  describe('Subject, Topic, Subtopic, and Skill Deletion Contracts', () => {
    it('blocks subject deletion when child topics exist (409 Conflict)', async () => {
      testState.childFound = true;
      const req = makeRequest(`http://localhost/api/admin/subjects/${UUID_1}`, 'DELETE');
      const res = await deleteSubjectByIdRoute(req, { params: Promise.resolve({ id: UUID_1 }) });
      expect(res.status).toBe(409);
    });

    it('blocks topic deletion when child subtopics exist (409 Conflict)', async () => {
      testState.childFound = true;
      const req = makeRequest(`http://localhost/api/admin/topics/${UUID_1}`, 'DELETE');
      const res = await deleteTopicByIdRoute(req, { params: Promise.resolve({ id: UUID_1 }) });
      expect(res.status).toBe(409);
    });

    it('allows clean subtopic deletion when free of dependents (200 OK)', async () => {
      testState.childFound = false;
      const req = makeRequest(`http://localhost/api/admin/subtopics/${UUID_1}`, 'DELETE');
      const res = await deleteSubtopicByIdRoute(req, { params: Promise.resolve({ id: UUID_1 }) });
      expect(res.status).toBe(200);
    });

    it('allows clean skill batch-delete when free of dependents (200 OK)', async () => {
      testState.childFound = false;
      const req = makeRequest('http://localhost/api/admin/skills/batch-delete', 'POST', {
        ids: [UUID_1],
      });
      const res = await batchDeleteSkillsRoute(req);
      expect(res.status).toBe(200);
    });

    it('exercises subject route and batch-delete route', async () => {
      testState.childFound = false;
      const req = makeRequest(`http://localhost/api/admin/subjects?id=${UUID_1}`, 'DELETE');
      const res = await deleteSubjectRoute(req);
      expect(res.status).toBe(200);

      const batchReq = makeRequest('http://localhost/api/admin/subjects/batch-delete', 'POST', { ids: [UUID_1] });
      const batchRes = await batchDeleteSubjectsRoute(batchReq);
      expect(batchRes.status).toBe(200);
    });

    it('exercises topic route and batch-delete route', async () => {
      testState.childFound = false;
      const req = makeRequest(`http://localhost/api/admin/topics?id=${UUID_1}`, 'DELETE');
      const res = await deleteTopicRoute(req);
      expect(res.status).toBe(200);

      const batchReq = makeRequest('http://localhost/api/admin/topics/batch-delete', 'POST', { ids: [UUID_1] });
      const batchRes = await batchDeleteTopicsRoute(batchReq);
      expect(batchRes.status).toBe(200);
    });

    it('exercises subtopic route and batch-delete route', async () => {
      testState.childFound = false;
      const req = makeRequest(`http://localhost/api/admin/subtopics?id=${UUID_1}`, 'DELETE');
      const res = await deleteSubtopicRoute(req);
      expect(res.status).toBe(200);

      const batchReq = makeRequest('http://localhost/api/admin/subtopics/batch-delete', 'POST', { ids: [UUID_1] });
      const batchRes = await batchDeleteSubtopicsRoute(batchReq);
      expect(batchRes.status).toBe(200);
    });

    it('exercises skill route and deleteSkillByIdRoute', async () => {
      testState.childFound = false;
      const req = makeRequest(`http://localhost/api/admin/skills?id=${UUID_1}`, 'DELETE');
      const res = await deleteSkillRoute(req);
      expect(res.status).toBe(200);

      const reqById = makeRequest(`http://localhost/api/admin/skills/${UUID_1}`, 'DELETE');
      const resById = await deleteSkillByIdRoute(reqById, { params: Promise.resolve({ id: UUID_1 }) });
      expect(resById.status).toBe(200);
    });

    it('BC-CORR-01: returns 503 when dependency verification storage is temporarily unavailable', async () => {
      testState.throwOnSelect = true;
      const req = makeRequest(`http://localhost/api/admin/domains/${UUID_1}`, 'DELETE');
      const res = await deleteDomainByIdRoute(req, { params: Promise.resolve({ id: UUID_1 }) });
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toContain('temporarily unavailable');
    });
  });
});
