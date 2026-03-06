import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  queryMocks,
  selectWhereMock,
  selectInnerJoinWhereMock,
  selectFromMock,
  selectMock,
  insertReturningMock,
  insertValuesMock,
  insertMock,
  updateReturningMock,
  updateWhereMock,
  updateSetMock,
  updateMock,
  deleteReturningMock,
  deleteWhereMock,
  deleteMock,
  txDeleteWhereMock,
  txDeleteMock,
  txInsertValuesMock,
  txInsertMock,
} = vi.hoisted(() => {
  const _queryMocks = {
    domainsFindMany: vi.fn(),
    domainsFindFirst: vi.fn(),
    subjectsFindMany: vi.fn(),
    topicsFindMany: vi.fn(),
    subtopicsFindMany: vi.fn(),
    skillsFindMany: vi.fn(),
    topicSkillsFindMany: vi.fn(),
    usersFindMany: vi.fn(),
    usersFindFirst: vi.fn(),
    rolesFindFirst: vi.fn(),
    verificationTokensFindFirst: vi.fn(),
    passwordResetTokensFindFirst: vi.fn(),
    refreshTokensFindFirst: vi.fn(),
  };
  const _selectWhereMock = vi.fn();
  const _selectInnerJoinWhereMock = vi.fn();
  const _selectFromMock = vi.fn(() => ({
    where: _selectWhereMock,
    innerJoin: vi.fn(() => ({ where: _selectInnerJoinWhereMock })),
    groupBy: vi.fn().mockResolvedValue([]),
  }));
  const _insertReturningMock = vi.fn();
  const _insertValuesMock = vi.fn(() => ({ returning: _insertReturningMock }));
  const _insertMock = vi.fn(() => ({ values: _insertValuesMock }));
  const _updateReturningMock = vi.fn();
  const _updateWhereMock = vi.fn(() => ({ returning: _updateReturningMock }));
  const _updateSetMock = vi.fn(() => ({ where: _updateWhereMock }));
  const _updateMock = vi.fn(() => ({ set: _updateSetMock }));
  const _deleteReturningMock = vi.fn();
  const _deleteWhereMock = vi.fn(() => ({ returning: _deleteReturningMock }));
  const _deleteMock = vi.fn(() => ({ where: _deleteWhereMock }));
  const _txDeleteWhereMock = vi.fn().mockResolvedValue(undefined);
  const _txDeleteMock = vi.fn(() => ({ where: _txDeleteWhereMock }));
  const _txInsertValuesMock = vi.fn().mockResolvedValue(undefined);
  const _txInsertMock = vi.fn(() => ({ values: _txInsertValuesMock }));
  return {
    queryMocks: _queryMocks,
    selectWhereMock: _selectWhereMock,
    selectInnerJoinWhereMock: _selectInnerJoinWhereMock,
    selectFromMock: _selectFromMock,
    selectMock: vi.fn(() => ({ from: _selectFromMock })),
    insertReturningMock: _insertReturningMock,
    insertValuesMock: _insertValuesMock,
    insertMock: _insertMock,
    updateReturningMock: _updateReturningMock,
    updateWhereMock: _updateWhereMock,
    updateSetMock: _updateSetMock,
    updateMock: _updateMock,
    deleteReturningMock: _deleteReturningMock,
    deleteWhereMock: _deleteWhereMock,
    deleteMock: _deleteMock,
    txDeleteWhereMock: _txDeleteWhereMock,
    txDeleteMock: _txDeleteMock,
    txInsertValuesMock: _txInsertValuesMock,
    txInsertMock: _txInsertMock,
  };
});

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      domains: { findMany: queryMocks.domainsFindMany, findFirst: queryMocks.domainsFindFirst },
      subjects: { findMany: queryMocks.subjectsFindMany },
      topics: { findMany: queryMocks.topicsFindMany },
      subtopics: { findMany: queryMocks.subtopicsFindMany },
      skills: { findMany: queryMocks.skillsFindMany },
      topicSkills: { findMany: queryMocks.topicSkillsFindMany },
      users: { findMany: queryMocks.usersFindMany, findFirst: queryMocks.usersFindFirst },
      roles: { findFirst: queryMocks.rolesFindFirst },
      verificationTokens: { findFirst: queryMocks.verificationTokensFindFirst },
      passwordResetTokens: { findFirst: queryMocks.passwordResetTokensFindFirst },
      refreshTokens: { findFirst: queryMocks.refreshTokensFindFirst },
    },
    select: selectMock,
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
    transaction: vi.fn(async (callback: (tx: any) => unknown) => callback({ delete: txDeleteMock, insert: txInsertMock })),
  },
  domains: { id: 'domains.id', name: 'domains.name', createdAt: 'domains.createdAt' },
  subjects: { id: 'subjects.id', name: 'subjects.name', domainId: 'subjects.domainId', createdAt: 'subjects.createdAt' },
  topics: { id: 'topics.id', name: 'topics.name', subjectId: 'topics.subjectId', createdAt: 'topics.createdAt' },
  subtopics: { id: 'subtopics.id', name: 'subtopics.name', topicId: 'subtopics.topicId', createdAt: 'subtopics.createdAt' },
  skills: { id: 'skills.id', name: 'skills.name' },
  topicSkills: { topicId: 'topicSkills.topicId' },
  users: { id: 'users.id', email: 'users.email', status: 'users.status', createdAt: 'users.createdAt', deletedAt: 'users.deletedAt', isBlocked: 'users.isBlocked', emailVerified: 'users.emailVerified', lastActiveAt: 'users.lastActiveAt', passwordHash: 'users.passwordHash' },
  roles: { id: 'roles.id', name: 'roles.name' },
  userRoles: { userId: 'userRoles.userId', roleId: 'userRoles.roleId' },
  userProfiles: { userId: 'userProfiles.userId', name: 'userProfiles.name' },
  verificationTokens: { id: 'verificationTokens.id', token: 'verificationTokens.token' },
  passwordResetTokens: { id: 'passwordResetTokens.id', token: 'passwordResetTokens.token', expiresAt: 'passwordResetTokens.expiresAt' },
  refreshTokens: { id: 'refreshTokens.id', userId: 'refreshTokens.userId', token: 'refreshTokens.token', revoked: 'refreshTokens.revoked', expiresAt: 'refreshTokens.expiresAt', lastActiveAt: 'refreshTokens.lastActiveAt' },
}));

import { DrizzleAdminUserRepository } from '../drizzle-admin-user.repository';
import { DrizzleDomainRepository } from '../drizzle-domain.repository';
import { DrizzleSkillRepository } from '../drizzle-skill.repository';
import { DrizzleSubjectRepository } from '../drizzle-subject.repository';
import { DrizzleSubtopicRepository } from '../drizzle-subtopic.repository';
import { DrizzleTopicRepository } from '../drizzle-topic.repository';

describe('Drizzle repositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectWhereMock.mockResolvedValue([{ count: 2 }]);
    queryMocks.domainsFindMany.mockResolvedValue([{ id: 'd1' }]);
    queryMocks.domainsFindFirst.mockResolvedValue({ id: 'd1', subjects: [] });
    queryMocks.subjectsFindMany.mockResolvedValue([{ id: 's1' }]);
    queryMocks.topicsFindMany.mockResolvedValue([{ id: 't1' }]);
    queryMocks.subtopicsFindMany.mockResolvedValue([{ id: 'st1' }]);
    queryMocks.skillsFindMany.mockResolvedValue([{ id: 'sk1' }]);
    queryMocks.topicSkillsFindMany.mockResolvedValue([{ skill: { id: 'sk1' } }]);
    queryMocks.usersFindMany.mockResolvedValue([{ id: 'u1' }]);
    queryMocks.usersFindFirst.mockResolvedValue({ id: 'u1' });
    queryMocks.rolesFindFirst.mockResolvedValue({ id: 'r1' });
    queryMocks.verificationTokensFindFirst.mockResolvedValue({ id: 'v1' });
    queryMocks.passwordResetTokensFindFirst.mockResolvedValue({ id: 'pr1' });
    queryMocks.refreshTokensFindFirst.mockResolvedValue({ id: 'rt1' });
    insertReturningMock.mockResolvedValue([{ id: 'new-1' }]);
    updateReturningMock.mockResolvedValue([{ id: 'updated-1' }]);
    deleteReturningMock.mockResolvedValue([{ id: 'deleted-1' }]);
  });

  it('covers domain/subject/topic/subtopic CRUD + pagination', async () => {
    const domainRepo = new DrizzleDomainRepository();
    const subjectRepo = new DrizzleSubjectRepository();
    const topicRepo = new DrizzleTopicRepository();
    const subtopicRepo = new DrizzleSubtopicRepository();

    await expect(domainRepo.findAll(1, 10, { search: 'math' })).resolves.toMatchObject({ total: 2, totalPages: 1 });
    await expect(domainRepo.findAll(2, 10)).resolves.toMatchObject({ page: 2, limit: 10 });
    await expect(subjectRepo.findAll(1, 10, { domainId: 'd1', search: 'sub' })).resolves.toMatchObject({ total: 2, totalPages: 1 });
    await expect(subjectRepo.findAll(1, 10, { domainId: 'd1' })).resolves.toMatchObject({ total: 2 });
    await expect(subjectRepo.findAll(1, 10)).resolves.toMatchObject({ total: 2 });
    await expect(topicRepo.findAll(1, 10, { subjectId: 's1', search: 'topic' })).resolves.toMatchObject({ total: 2, totalPages: 1 });
    await expect(topicRepo.findAll(1, 10, { subjectId: 's1' })).resolves.toMatchObject({ total: 2 });
    await expect(topicRepo.findAll(1, 10)).resolves.toMatchObject({ total: 2 });
    await expect(subtopicRepo.findAll(1, 10, { topicId: 't1', search: 'subtopic' })).resolves.toMatchObject({ total: 2, totalPages: 1 });
    await expect(subtopicRepo.findAll(1, 10, { topicId: 't1' })).resolves.toMatchObject({ total: 2 });
    await expect(subtopicRepo.findAll(1, 10)).resolves.toMatchObject({ total: 2 });

    await expect(domainRepo.create({ name: 'D' } as any)).resolves.toEqual({ id: 'new-1' });
    await expect(domainRepo.update('d1', { name: 'D2' } as any)).resolves.toEqual({ id: 'updated-1' });
    await expect(domainRepo.delete('d1')).resolves.toEqual({ id: 'deleted-1' });
    await expect(domainRepo.deleteBatch(['d1'])).resolves.toEqual([{ id: 'deleted-1' }]);
    await expect(domainRepo.updateStatus('d1', 'active')).resolves.toEqual({ id: 'updated-1' });
    await expect(domainRepo.findWithHierarchy('d1')).resolves.toEqual({ id: 'd1', subjects: [] });

    const { container } = await import('@/modules/core/container');
    const { LoggerService } = await import('@/modules/core/logger.service');
    const logSpy = vi.spyOn(container.get(LoggerService), 'debug').mockImplementation(() => undefined);
    await expect(domainRepo.upsertHierarchy({ name: 'Hierarchy 1' })).resolves.toBeUndefined();
    expect(logSpy).toHaveBeenCalledWith({ hierarchyName: 'Hierarchy 1' }, '[DrizzleDomainRepository] Upserting hierarchy');
    logSpy.mockRestore();

    await expect(subjectRepo.create({ name: 'S' } as any)).resolves.toEqual({ id: 'new-1' });
    await expect(subjectRepo.update('s1', { name: 'S2' } as any)).resolves.toEqual({ id: 'updated-1' });
    await expect(subjectRepo.delete('s1')).resolves.toEqual({ id: 'deleted-1' });
    await expect(subjectRepo.deleteBatch(['s1'])).resolves.toEqual([{ id: 'deleted-1' }]);

    await expect(topicRepo.create({ name: 'T' } as any)).resolves.toEqual({ id: 'new-1' });
    await expect(topicRepo.update('t1', { name: 'T2' } as any)).resolves.toEqual({ id: 'updated-1' });
    await expect(topicRepo.delete('t1')).resolves.toEqual({ id: 'deleted-1' });
    await expect(topicRepo.deleteBatch(['t1'])).resolves.toEqual([{ id: 'deleted-1' }]);

    await expect(subtopicRepo.create({ name: 'ST' } as any)).resolves.toEqual({ id: 'new-1' });
    await expect(subtopicRepo.update('st1', { name: 'ST2' } as any)).resolves.toEqual({ id: 'updated-1' });
    await expect(subtopicRepo.delete('st1')).resolves.toEqual({ id: 'deleted-1' });
    await expect(subtopicRepo.deleteBatch(['st1'])).resolves.toEqual([{ id: 'deleted-1' }]);
  });

  it('covers skill repository branches and topic mapping', async () => {
    const skillRepo = new DrizzleSkillRepository();
    await expect(skillRepo.findAll(1, 10)).resolves.toMatchObject({ total: 2, totalPages: 1 });
    await expect(skillRepo.findAll(1, 10, { search: 'skill' })).resolves.toMatchObject({ total: 2, totalPages: 1 });
    await expect(skillRepo.create({ name: 'Skill' } as any)).resolves.toEqual({ id: 'new-1' });
    await expect(skillRepo.update('sk1', { name: 'Skill2' } as any)).resolves.toEqual({ id: 'updated-1' });
    await expect(skillRepo.delete('sk1')).resolves.toEqual({ id: 'deleted-1' });
    await expect(skillRepo.deleteBatch(['sk1'])).resolves.toEqual([{ id: 'deleted-1' }]);
    await expect(skillRepo.getTopicSkills(1, 20)).resolves.toEqual([{ skill: { id: 'sk1' } }]);
    await expect(skillRepo.getSkillsByTopic('t1')).resolves.toEqual([{ id: 'sk1' }]);
    await expect(skillRepo.mapTopicToSkills('t1', ['sk1', 'sk2'])).resolves.toBeUndefined();
    await expect(skillRepo.mapTopicToSkills('t1', [])).resolves.toBeUndefined();
  });

  it('covers admin user repository filter branches and mutations', async () => {
    const userRepo = new DrizzleAdminUserRepository();

    selectWhereMock
      .mockResolvedValueOnce([{ id: 'u1' }]) // search profile match
      .mockResolvedValueOnce([{ count: 3 }]); // count query
    selectInnerJoinWhereMock.mockResolvedValueOnce([{ id: 'u1' }]); // role filter results
    queryMocks.usersFindMany.mockResolvedValueOnce([{ id: 'u1', isBlocked: false, lastActiveAt: new Date() }]);

    await expect(userRepo.findAll(1, 10, 'active', { search: 'john', role: 'admin', isBlocked: false, isVerified: true, status: 'online' }))
      .resolves.toMatchObject({ total: 3, totalPages: 1 });

    selectWhereMock.mockResolvedValueOnce([]); // search profile no match
    selectInnerJoinWhereMock.mockResolvedValueOnce([]); // role no results -> early return
    await expect(userRepo.findAll(1, 10, 'deleted', { search: 'none', role: 'unknown' }))
      .resolves.toEqual({ users: [], total: 0, page: 1, limit: 10, totalPages: 0 });

    // Exercise remaining status branches (idle/offline) and non-role query path
    selectWhereMock.mockResolvedValueOnce([{ count: 1 }]);
    queryMocks.usersFindMany.mockResolvedValueOnce([{ id: 'u2', isBlocked: false, lastActiveAt: null }]);
    await expect(userRepo.findAll(1, 10, 'active', { status: 'idle' })).resolves.toMatchObject({ total: 1 });

    selectWhereMock.mockResolvedValueOnce([{ count: 1 }]);
    queryMocks.usersFindMany.mockResolvedValueOnce([{ id: 'u3', isBlocked: false, lastActiveAt: null }]);
    await expect(userRepo.findAll(1, 10, 'active', { status: 'offline' })).resolves.toMatchObject({ total: 1 });

    await expect(userRepo.update('u1', { isBlocked: true })).resolves.toEqual({ id: 'updated-1' });
    await expect(userRepo.delete('u1')).resolves.toEqual({ id: 'deleted-1' });
    await expect(userRepo.toggleBlockStatus('u1', false)).resolves.toEqual([{ id: 'updated-1' }]);
  });
});
