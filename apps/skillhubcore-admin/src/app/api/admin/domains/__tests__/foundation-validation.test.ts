import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  getDb: vi.fn(),
  insertValues: vi.fn(),
  updateSet: vi.fn(),
  deleteWhere: vi.fn(),
  selectRows: [] as unknown[],
  guard: vi.fn(),
}));

vi.mock('@/lib/admin-route-guard', () => ({ requireAdminRequest: fixture.guard }));

vi.mock('@quiz/db', () => ({
  domains: { id: 'domains.id', name: 'domains.name', createdAt: 'domains.createdAt' },
  subjects: { id: 'subjects.id', name: 'subjects.name', domainId: 'subjects.domainId', createdAt: 'subjects.createdAt' },
  topics: { id: 'topics.id', name: 'topics.name', subjectId: 'topics.subjectId', createdAt: 'topics.createdAt' },
  subtopics: { id: 'subtopics.id', name: 'subtopics.name', topicId: 'subtopics.topicId', createdAt: 'subtopics.createdAt' },
  skills: { id: 'skills.id', name: 'skills.name', category: 'skills.category', createdAt: 'skills.createdAt' },
  getDb: () => {
    fixture.getDb();
    const queryChain = {
      from: () => queryChain,
      leftJoin: () => queryChain,
      where: () => queryChain,
      orderBy: () => queryChain,
      limit: async () => fixture.selectRows,
    };
    return {
      select: () => queryChain,
      insert: () => ({ values: fixture.insertValues }),
      update: () => ({
        set: (data: unknown) => {
          fixture.updateSet(data);
          return {
            where: () => ({
              returning: async () => fixture.selectRows,
            }),
          };
        },
      }),
      delete: () => ({
        where: (cond: unknown) => {
          fixture.deleteWhere(cond);
          return {
            returning: async () => fixture.selectRows,
          };
        },
      }),
    };
  },
}));

import { DELETE as deleteDomainById, PATCH as patchDomainById } from '../[id]/route';
import { DELETE as deleteDomain, GET as getDomains, POST as postDomain, PUT as putDomain } from '../route';
import { DELETE as deleteSkillById, PATCH as patchSkillById } from '../../skills/[id]/route';
import { DELETE as deleteSkill, GET as getSkills, POST as postSkill, PUT as putSkill } from '../../skills/route';
import { DELETE as deleteSubjectById, PATCH as patchSubjectById } from '../../subjects/[id]/route';
import { DELETE as deleteSubject, GET as getSubjects, POST as postSubject, PUT as putSubject } from '../../subjects/route';
import { DELETE as deleteSubtopicById, PATCH as patchSubtopicById } from '../../subtopics/[id]/route';
import { DELETE as deleteSubtopic, GET as getSubtopics, POST as postSubtopic, PUT as putSubtopic } from '../../subtopics/route';
import { DELETE as deleteTopicById, PATCH as patchTopicById } from '../../topics/[id]/route';
import { DELETE as deleteTopic, GET as getTopics, POST as postTopic, PUT as putTopic } from '../../topics/route';

const UUID_1 = '00000000-0000-4000-8000-000000000001';
const UUID_2 = '00000000-0000-4000-8000-000000000002';

function makeRequest(url: string, method: string, body?: unknown) {
  const req = new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  Object.defineProperty(req, 'nextUrl', {
    value: new URL(url),
  });
  return req as Parameters<typeof postDomain>[0];
}

describe('SHC taxonomy CRUD route validation, authorization, and persistence (FND19 / TC16)', () => {
  beforeEach(() => {
    fixture.guard.mockReset().mockResolvedValue(null);
    fixture.getDb.mockReset();
    fixture.insertValues.mockReset().mockImplementation((vals: Record<string, unknown>) => ({
      returning: async () => [{ id: UUID_1, ...vals }],
    }));
    fixture.updateSet.mockReset();
    fixture.deleteWhere.mockReset();
    fixture.selectRows = [{ id: UUID_1, name: 'Persisted Entity', depth: 2, order: 4, complexity: 'advanced' }];
  });

  describe('Domains CRUD routes', () => {
    it('enforces requireAdminRequest on POST before touching DB', async () => {
      fixture.guard.mockResolvedValueOnce(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
      const res = await postDomain(makeRequest('http://localhost/api/admin/domains', 'POST', { name: 'Domain' }));
      expect(res.status).toBe(403);
      expect(fixture.getDb).not.toHaveBeenCalled();
    });

    it('accepts a valid domain on POST and persists order/status', async () => {
      const res = await postDomain(
        makeRequest('http://localhost/api/admin/domains', 'POST', { name: 'Domain', category: 'technical', order: 3 })
      );
      expect(res.status).toBe(201);
      expect(fixture.insertValues).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Domain', category: 'technical', order: 3, status: 'active' })
      );
    });

    it('rejects a numeric name on POST before calling getDb()', async () => {
      const res = await postDomain(
        makeRequest('http://localhost/api/admin/domains', 'POST', { name: 42, category: 'technical' })
      );
      expect(res.status).toBe(400);
      expect(fixture.getDb).not.toHaveBeenCalled();
      expect(fixture.insertValues).not.toHaveBeenCalled();
    });

    it('rejects invalid PUT payload before calling getDb() and returns 404 when record missing', async () => {
      const badRes = await putDomain(
        makeRequest('http://localhost/api/admin/domains', 'PUT', { id: UUID_1, order: -5 })
      );
      expect(badRes.status).toBe(400);
      expect(fixture.getDb).not.toHaveBeenCalled();

      fixture.selectRows = [];
      const notFoundRes = await putDomain(
        makeRequest('http://localhost/api/admin/domains', 'PUT', { id: UUID_1, name: 'Updated' })
      );
      expect(notFoundRes.status).toBe(404);
    });

    it('validates PATCH [id] payload and rejects conflicting order vs orderIndex before getDb()', async () => {
      const conflictRes = await patchDomainById(
        makeRequest(`http://localhost/api/admin/domains/${UUID_1}`, 'PATCH', { order: 1, orderIndex: 9 }),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(conflictRes.status).toBe(400);
      expect(fixture.getDb).not.toHaveBeenCalled();

      const okRes = await patchDomainById(
        makeRequest(`http://localhost/api/admin/domains/${UUID_1}`, 'PATCH', { name: 'Patched', orderIndex: 6 }),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(okRes.status).toBe(200);
      expect(fixture.updateSet).toHaveBeenCalledWith(expect.objectContaining({ name: 'Patched', order: 6 }));
    });

    it('lists domains on GET and deletes domain on DELETE', async () => {
      const getRes = await getDomains(makeRequest('http://localhost/api/admin/domains?limit=10', 'GET'));
      expect(getRes.status).toBe(200);

      const delRes = await deleteDomain(makeRequest(`http://localhost/api/admin/domains?id=${UUID_1}`, 'DELETE'));
      expect(delRes.status).toBe(200);

      const delByIdRes = await deleteDomainById(
        makeRequest(`http://localhost/api/admin/domains/${UUID_1}`, 'DELETE'),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(delByIdRes.status).toBe(200);
    });
  });

  describe('Subjects CRUD routes', () => {
    it('rejects invalid domainId UUID on POST and PUT before calling getDb()', async () => {
      const postRes = await postSubject(
        makeRequest('http://localhost/api/admin/subjects', 'POST', { domainId: 'not-a-uuid', name: 'Algorithms' })
      );
      expect(postRes.status).toBe(400);
      expect(fixture.getDb).not.toHaveBeenCalled();

      const putRes = await putSubject(
        makeRequest('http://localhost/api/admin/subjects', 'PUT', { id: UUID_1, domainId: 'invalid' })
      );
      expect(putRes.status).toBe(400);
      expect(fixture.getDb).not.toHaveBeenCalled();
    });

    it('creates, updates, patches, lists, and deletes subjects with valid payloads', async () => {
      const postRes = await postSubject(
        makeRequest('http://localhost/api/admin/subjects', 'POST', { domainId: UUID_1, name: 'Algorithms', order: 2 })
      );
      expect(postRes.status).toBe(201);

      const patchRes = await patchSubjectById(
        makeRequest(`http://localhost/api/admin/subjects/${UUID_1}`, 'PATCH', { name: 'Updated Subject', order: 4 }),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(patchRes.status).toBe(200);

      fixture.selectRows = [{ subject: { id: UUID_1, name: 'Algorithms', domainId: UUID_2 }, domain: { id: UUID_2, name: 'CS' } }];
      const getRes = await getSubjects(makeRequest('http://localhost/api/admin/subjects', 'GET'));
      expect(getRes.status).toBe(200);

      const delRes = await deleteSubject(makeRequest(`http://localhost/api/admin/subjects?id=${UUID_1}`, 'DELETE'));
      expect(delRes.status).toBe(200);

      const delByIdRes = await deleteSubjectById(
        makeRequest(`http://localhost/api/admin/subjects/${UUID_1}`, 'DELETE'),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(delByIdRes.status).toBe(200);
    });
  });

  describe('Topics CRUD routes', () => {
    it('rejects conflicting complexity and complexityLevel on POST, PUT, and PATCH before getDb()', async () => {
      const postRes = await postTopic(
        makeRequest('http://localhost/api/admin/topics', 'POST', {
          subjectId: UUID_1,
          name: 'Graphs',
          complexity: 'beginner',
          complexityLevel: 3,
        })
      );
      expect(postRes.status).toBe(400);
      expect(fixture.getDb).not.toHaveBeenCalled();

      const putRes = await putTopic(
        makeRequest('http://localhost/api/admin/topics', 'PUT', {
          id: UUID_1,
          complexity: 'intermediate',
          complexityLevel: 4,
        })
      );
      expect(putRes.status).toBe(400);
      expect(fixture.getDb).not.toHaveBeenCalled();

      const patchRes = await patchTopicById(
        makeRequest(`http://localhost/api/admin/topics/${UUID_1}`, 'PATCH', {
          complexity: 'beginner',
          complexityLevel: 2,
        }),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(patchRes.status).toBe(400);
      expect(fixture.getDb).not.toHaveBeenCalled();
    });

    it('creates, updates, patches, and serializes complexity + complexityLevel + orderIndex on topics', async () => {
      const postRes = await postTopic(
        makeRequest('http://localhost/api/admin/topics', 'POST', {
          subjectId: UUID_1,
          name: 'Graphs',
          complexityLevel: 3,
          weight: 2,
          order: 5,
        })
      );
      expect(postRes.status).toBe(201);
      const created = await postRes.json();
      expect(created.complexity).toBe('advanced');
      expect(created.complexityLevel).toBe(3);
      expect(created.orderIndex).toBe(5);

      const patchRes = await patchTopicById(
        makeRequest(`http://localhost/api/admin/topics/${UUID_1}`, 'PATCH', { complexity: 'expert', orderIndex: 7 }),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(patchRes.status).toBe(200);

      fixture.selectRows = [
        {
          topic: { id: UUID_1, name: 'Graphs', subjectId: UUID_2, complexity: 'advanced', order: 5 },
          subject: { id: UUID_2, name: 'CS', domainId: UUID_1 },
          domain: { id: UUID_1, name: 'Eng' },
        },
      ];
      const getRes = await getTopics(makeRequest('http://localhost/api/admin/topics', 'GET'));
      expect(getRes.status).toBe(200);

      const delRes = await deleteTopic(makeRequest(`http://localhost/api/admin/topics?id=${UUID_1}`, 'DELETE'));
      expect(delRes.status).toBe(200);

      const delByIdRes = await deleteTopicById(
        makeRequest(`http://localhost/api/admin/topics/${UUID_1}`, 'DELETE'),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(delByIdRes.status).toBe(200);
    });
  });

  describe('Subtopics CRUD routes', () => {
    it('rejects conflicting depth vs depthLevel and order vs orderIndex before getDb()', async () => {
      const depthConflict = await postSubtopic(
        makeRequest('http://localhost/api/admin/subtopics', 'POST', {
          topicId: UUID_1,
          name: 'BFS',
          depth: 1,
          depthLevel: 3,
        })
      );
      expect(depthConflict.status).toBe(400);
      expect(fixture.getDb).not.toHaveBeenCalled();

      const orderConflict = await patchSubtopicById(
        makeRequest(`http://localhost/api/admin/subtopics/${UUID_1}`, 'PATCH', {
          order: 2,
          orderIndex: 8,
        }),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(orderConflict.status).toBe(400);
      expect(fixture.getDb).not.toHaveBeenCalled();
    });

    it('creates, updates, patches, and serializes both depth/depthLevel and order/orderIndex on subtopics', async () => {
      const postRes = await postSubtopic(
        makeRequest('http://localhost/api/admin/subtopics', 'POST', {
          topicId: UUID_1,
          name: 'BFS',
          depthLevel: 2,
          orderIndex: 4,
        })
      );
      expect(postRes.status).toBe(201);
      const created = await postRes.json();
      expect(created.depth).toBe(2);
      expect(created.depthLevel).toBe(2);
      expect(created.order).toBe(4);
      expect(created.orderIndex).toBe(4);

      const putRes = await putSubtopic(
        makeRequest('http://localhost/api/admin/subtopics', 'PUT', {
          id: UUID_1,
          depth: 3,
          order: 6,
        })
      );
      expect(putRes.status).toBe(200);

      const patchRes = await patchSubtopicById(
        makeRequest(`http://localhost/api/admin/subtopics/${UUID_1}`, 'PATCH', { depthLevel: 3, orderIndex: 6 }),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(patchRes.status).toBe(200);

      fixture.selectRows = [
        {
          subtopic: { id: UUID_1, name: 'BFS', topicId: UUID_2, depth: 2, order: 4 },
          topic: { id: UUID_2, name: 'Graphs', subjectId: UUID_1 },
          subject: { id: UUID_1, name: 'CS', domainId: UUID_2 },
          domain: { id: UUID_2, name: 'Eng' },
        },
      ];
      const getRes = await getSubtopics(makeRequest('http://localhost/api/admin/subtopics', 'GET'));
      expect(getRes.status).toBe(200);

      const delRes = await deleteSubtopic(makeRequest(`http://localhost/api/admin/subtopics?id=${UUID_1}`, 'DELETE'));
      expect(delRes.status).toBe(200);

      const delByIdRes = await deleteSubtopicById(
        makeRequest(`http://localhost/api/admin/subtopics/${UUID_1}`, 'DELETE'),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(delByIdRes.status).toBe(200);
    });
  });

  describe('Skills CRUD routes', () => {
    it('rejects invalid skill category and non-string name before calling getDb()', async () => {
      const badCategory = await postSkill(
        makeRequest('http://localhost/api/admin/skills', 'POST', { name: 'Debugging', category: 'invalid-cat' })
      );
      expect(badCategory.status).toBe(400);
      expect(fixture.getDb).not.toHaveBeenCalled();

      const badPatch = await patchSkillById(
        makeRequest(`http://localhost/api/admin/skills/${UUID_1}`, 'PATCH', { weight: 0 }),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(badPatch.status).toBe(400);
      expect(fixture.getDb).not.toHaveBeenCalled();
    });

    it('creates, updates, patches, lists, and deletes skills with valid payloads', async () => {
      const postRes = await postSkill(
        makeRequest('http://localhost/api/admin/skills', 'POST', {
          name: 'System Design',
          description: 'Distributed architecture',
          category: 'technical',
          mappingType: 'conceptual',
          weight: 3,
          status: 'active',
        })
      );
      expect(postRes.status).toBe(201);

      const putRes = await putSkill(
        makeRequest('http://localhost/api/admin/skills', 'PUT', {
          id: UUID_1,
          name: 'System Design v2',
          category: 'cognitive',
          weight: 4,
        })
      );
      expect(putRes.status).toBe(200);

      const patchRes = await patchSkillById(
        makeRequest(`http://localhost/api/admin/skills/${UUID_1}`, 'PATCH', { status: 'inactive' }),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(patchRes.status).toBe(200);

      const getRes = await getSkills(makeRequest('http://localhost/api/admin/skills?category=technical', 'GET'));
      expect(getRes.status).toBe(200);

      const delRes = await deleteSkill(makeRequest(`http://localhost/api/admin/skills?id=${UUID_1}`, 'DELETE'));
      expect(delRes.status).toBe(200);

      const delByIdRes = await deleteSkillById(
        makeRequest(`http://localhost/api/admin/skills/${UUID_1}`, 'DELETE'),
        { params: Promise.resolve({ id: UUID_1 }) }
      );
      expect(delByIdRes.status).toBe(200);
    });
  });
});
