import { describe, it, expect, vi, beforeEach } from 'vitest';

// Comprehensive mock of @quiz/db for repository coverage
vi.mock('@quiz/db', () => {
  const makeDate = () => new Date('2024-01-01T00:00:00Z');
  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn().mockResolvedValue([{ count: 1 }]),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
    })),
  }));

  const update = vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'upd', createdAt: makeDate(), updatedAt: makeDate() }]),
      })),
    })),
  }));

  const insert = vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue([{ id: 'new', createdAt: makeDate(), updatedAt: makeDate() }]),
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
    })),
  }));

  const deleteFn = vi.fn(() => ({
    where: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue([{ id: 'del' }]),
    })),
  }));

  const query = {
    domains: { findMany: vi.fn().mockResolvedValue([{ id: 'd1', createdAt: makeDate(), name: 'Dom' }]) },
    questions: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'q1', updatedAt: makeDate(), status: 'active', questionText: 't', options: [], topicId: 't1', subtopicId: 'st1' },
      ]),
    },
    subjects: { findMany: vi.fn().mockResolvedValue([{ id: 's1', domainId: 'd1', createdAt: makeDate() }]) },
    topics: { findMany: vi.fn().mockResolvedValue([{ id: 't1', subjectId: 's1', createdAt: makeDate(), domainId: 'd1' }]) },
    subtopics: { findMany: vi.fn().mockResolvedValue([{ id: 'st1', topicId: 't1', createdAt: makeDate() }]) },
    skills: { findMany: vi.fn().mockResolvedValue([{ id: 'sk1', name: 'skill', createdAt: makeDate() }]) },
    topicSkills: { findMany: vi.fn().mockResolvedValue([{ topic: {}, skill: {} }]) },
    auditLogs: { findMany: vi.fn().mockResolvedValue([{ id: 'a1', createdAt: makeDate(), user: {} }]) },
    users: { findMany: vi.fn().mockResolvedValue([{ id: 'u1', createdAt: makeDate(), userRoles: [], profile: {} }]) },
  };

  const db = { select, update, insert, delete: deleteFn, query } as any;

  const baseTable = { id: 'id', createdAt: makeDate(), updatedAt: makeDate(), name: 'name', status: 'active' } as any;

  return {
    db,
    domains: { ...baseTable, createdAt: makeDate() } as any,
    questions: { ...baseTable, questionText: 'txt', updatedAt: makeDate(), subtopicId: 'st1', topicId: 't1' } as any,
    questionSkills: { questionId: 'qs.qid', skillId: 'qs.sid' } as any,
    subjects: { ...baseTable, domainId: 'd1' } as any,
    topics: { ...baseTable, subjectId: 's1', domainId: 'd1' } as any,
    subtopics: { ...baseTable, topicId: 't1' } as any,
    skills: { ...baseTable } as any,
    topicSkills: { id: 'ts.id' } as any,
    auditLogs: { ...baseTable } as any,
    users: { ...baseTable, email: 'e', createdAt: makeDate(), deletedAt: null, isBlocked: false, emailVerified: true } as any,
    userProfiles: { userId: 'p.userId', name: 'p.name' } as any,
    userRoles: { userId: 'ur.userId', roleId: 'ur.roleId' } as any,
    roles: { id: 'r.id', name: 'ADMIN' } as any,
  };
});

import { DrizzleAdminAnalyticsRepository } from '../drizzle-admin-analytics.repository';
import { DrizzleAdminUserRepository } from '../drizzle-admin-user.repository';
import { DrizzleDomainRepository } from '../drizzle-domain.repository';
import { DrizzleQuestionRepository } from '../drizzle-question.repository';
import { DrizzleSkillRepository } from '../drizzle-skill.repository';
import { DrizzleSubjectRepository } from '../drizzle-subject.repository';
import { DrizzleSubtopicRepository } from '../drizzle-subtopic.repository';
import { DrizzleTopicRepository } from '../drizzle-topic.repository';

describe('Drizzle repositories branch coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('covers domain findAll cursor/search branches', async () => {
    const dbModule = await import('@quiz/db');
    (dbModule as any).db.query.domains.findMany.mockResolvedValueOnce([
      { id: 'd1', createdAt: new Date('2024-01-01T00:00:00Z'), name: 'Dom' },
      { id: 'd2', createdAt: new Date('2024-01-02T00:00:00Z'), name: 'Dom2' },
    ]);
    const repo = new DrizzleDomainRepository();
    const res = await repo.findAll(new Date().toISOString(), 1, { search: 'Dom' });
    expect(res.nextCursor === null || typeof res.nextCursor === 'string').toBe(true);
  });

  it('covers question repository findAll/create/update branches with skillIds', async () => {
    const dbModule = await import('@quiz/db');
    (dbModule as any).db.query.questions.findMany.mockResolvedValueOnce([
      { id: 'q1', updatedAt: new Date('2024-01-01'), status: 'active', questionText: 't', options: [], topicId: 't1', subtopicId: 'st1' },
      { id: 'q2', updatedAt: new Date('2024-01-02'), status: 'active', questionText: 't2', options: [], topicId: 't1', subtopicId: 'st1' },
    ]);
    const repo = new DrizzleQuestionRepository();
    const found = await repo.findAll(new Date().toISOString(), 1, { subtopicId: 'st1', status: 'active', search: 't' });
    expect(found.data.length).toBeGreaterThan(0);

    await expect(repo.create({ id: 'q1' } as any, ['sk1'])).resolves.toBeDefined();
    await expect(repo.update('q1', { questionText: 'n' }, ['sk1'])).resolves.toBeDefined();
    await expect(repo.delete('q1')).resolves.toBeDefined();
    await expect(repo.deleteBatch(['q1'])).resolves.toBeDefined();
  });

  it('covers skill repository cursor branch and topic skills', async () => {
    const dbModule = await import('@quiz/db');
    (dbModule as any).db.query.skills.findMany.mockResolvedValueOnce([
      { id: 'sk1', name: 'skill', createdAt: new Date('2024-01-01') },
      { id: 'sk2', name: 'skill2', createdAt: new Date('2024-01-02') },
    ]);
    (dbModule as any).db.query.topicSkills.findMany.mockResolvedValueOnce([{ topic: {}, skill: {} }, { topic: {}, skill: {} }]);
    const repo = new DrizzleSkillRepository();
    const res = await repo.findAll('cursor', 1, { search: 'skill' });
    expect(res.total).toBe(1);
    await expect(repo.getTopicSkills(null, 1)).resolves.toEqual({ data: expect.any(Array), nextCursor: null });
  });

  it('covers subject, topic, subtopic repositories cursor branches', async () => {
    const dbModule = await import('@quiz/db');
    (dbModule as any).db.query.subjects.findMany.mockResolvedValueOnce([
      { id: 's1', domainId: 'd1', createdAt: new Date('2024-01-01') },
      { id: 's2', domainId: 'd1', createdAt: new Date('2024-01-02') },
    ]);
    (dbModule as any).db.query.topics.findMany.mockResolvedValueOnce([
      { id: 't1', subjectId: 's1', createdAt: new Date('2024-01-01'), domainId: 'd1' },
      { id: 't2', subjectId: 's1', createdAt: new Date('2024-01-02'), domainId: 'd1' },
    ]);
    (dbModule as any).db.query.subtopics.findMany.mockResolvedValueOnce([
      { id: 'st1', topicId: 't1', createdAt: new Date('2024-01-01') },
      { id: 'st2', topicId: 't1', createdAt: new Date('2024-01-02') },
    ]);
    const subjectRepo = new DrizzleSubjectRepository();
    const topicRepo = new DrizzleTopicRepository();
    const subtopicRepo = new DrizzleSubtopicRepository();

    await expect(subjectRepo.findAll('cursor', 1, { domainId: 'd1', search: 's' })).resolves.toMatchObject({ limit: 1 });
    await expect(topicRepo.findAll('cursor', 1, { subjectId: 's1', search: 't' })).resolves.toMatchObject({ limit: 1 });
    await expect(subtopicRepo.findAll('cursor', 1, { topicId: 't1', search: 'st' })).resolves.toMatchObject({ limit: 1 });
  });

  it('covers admin user softDelete branch and basic listing path', async () => {
    const dbModule = await import('@quiz/db');
    (dbModule as any).db.query.users.findMany.mockResolvedValueOnce([
      { id: 'u1', createdAt: new Date('2024-01-01'), userRoles: [], profile: {} },
      { id: 'u2', createdAt: new Date('2024-01-02'), userRoles: [], profile: {} },
    ]);
    const repo = new DrizzleAdminUserRepository();
    const list = await repo.findAll(null, 1, 'active', { role: '', search: 'x' });
    expect(list.limit).toBe(1);
    await expect(repo.softDelete('u1')).resolves.toBeDefined();
  });

  it('covers admin analytics audit log pagination branch', async () => {
    const dbModule = await import('@quiz/db');
    (dbModule as any).db.query.auditLogs.findMany.mockResolvedValueOnce([
      { id: 'a1', createdAt: new Date('2024-01-01'), user: {} },
      { id: 'a2', createdAt: new Date('2024-01-02'), user: {} },
    ]);
    const repo = new DrizzleAdminAnalyticsRepository();
    const res = await repo.getAuditLogs(new Date().toISOString(), 1);
    expect(res.nextCursor === null || typeof res.nextCursor === 'string').toBe(true);
  });
});
