import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  queryMocks,
  selectMock,
} = vi.hoisted(() => {
  const _queryMocks = {
    questionsFindMany: vi.fn(),
    examBlueprintsFindMany: vi.fn(),
    auditLogsFindMany: vi.fn(),
  };

  const selectMockFactory = (fields: Record<string, unknown>) => {
    const isCount = Object.prototype.hasOwnProperty.call(fields, 'count');
    const whereResult = isCount
      ? Promise.resolve([{ count: 0 }])
      : {
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn().mockResolvedValue([]),
            })),
          })),
        };

    const withWhere = { where: vi.fn(() => whereResult) };
    return {
      from: vi.fn(() => ({
        ...withWhere,
        leftJoin: vi.fn(() => ({
          leftJoin: vi.fn(() => withWhere),
        })),
      })),
    };
  };

  return {
    queryMocks: _queryMocks,
    selectMock: vi.fn((fields: Record<string, unknown>) => selectMockFactory(fields)),
  };
});

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      questions: { findMany: queryMocks.questionsFindMany },
      examBlueprints: { findMany: queryMocks.examBlueprintsFindMany },
      auditLogs: { findMany: queryMocks.auditLogsFindMany },
    },
    select: selectMock,
  },
  questions: {
    id: 'questions.id',
    questionText: 'questions.questionText',
    options: 'questions.options',
    correctAnswer: 'questions.correctAnswer',
    explanation: 'questions.explanation',
    difficulty: 'questions.difficulty',
    status: 'questions.status',
    updatedAt: 'questions.updatedAt',
  },
  examBlueprints: {
    id: 'examBlueprints.id',
    name: 'examBlueprints.name',
    description: 'examBlueprints.description',
    config: 'examBlueprints.config',
    version: 'examBlueprints.version',
    createdAt: 'examBlueprints.createdAt',
    updatedAt: 'examBlueprints.updatedAt',
  },
  auditLogs: {
    id: 'auditLogs.id',
    userId: 'auditLogs.userId',
    action: 'auditLogs.action',
    ip: 'auditLogs.ip',
    device: 'auditLogs.device',
    metadata: 'auditLogs.metadata',
    createdAt: 'auditLogs.createdAt',
  },
  sessions: {
    id: 'sessions.id',
    userId: 'sessions.userId',
    ip: 'sessions.ip',
    device: 'sessions.device',
    expiresAt: 'sessions.expiresAt',
    createdAt: 'sessions.createdAt',
  },
  users: {
    id: 'users.id',
    email: 'users.email',
    lastActiveAt: 'users.lastActiveAt',
  },
  userProfiles: {
    userId: 'userProfiles.userId',
    name: 'userProfiles.name',
  },
}));

import { DrizzleQuestionRepository } from '../drizzle-question.repository';
import { DrizzleBlueprintRepository } from '../drizzle-blueprint.repository';
import { DrizzleAdminAnalyticsRepository } from '../drizzle-admin-analytics.repository';

describe('Admin list field selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryMocks.questionsFindMany.mockResolvedValue([{ id: 'q1', updatedAt: new Date() }]);
    queryMocks.examBlueprintsFindMany.mockResolvedValue([{ id: 'b1', createdAt: new Date() }]);
    queryMocks.auditLogsFindMany.mockResolvedValue([{ id: 'a1', createdAt: new Date() }]);
  });

  it('applies question allowlist fields in Drizzle columns', async () => {
    const repo = new DrizzleQuestionRepository();
    await repo.findAll(null, 10, { fields: 'id,questionText,token' });

    const args = queryMocks.questionsFindMany.mock.calls[0]?.[0] ?? {};
    expect(args.columns).toBeDefined();
    expect(Object.keys(args.columns)).toEqual(expect.arrayContaining(['id', 'questionText']));
    expect(Object.keys(args.columns)).not.toContain('token');
  });

  it('applies blueprint allowlist fields in Drizzle columns', async () => {
    const repo = new DrizzleBlueprintRepository();
    await repo.findAll(null, 10, { fields: 'id,name,secret' });

    const args = queryMocks.examBlueprintsFindMany.mock.calls[0]?.[0] ?? {};
    expect(args.columns).toBeDefined();
    expect(Object.keys(args.columns)).toEqual(expect.arrayContaining(['id', 'name']));
    expect(Object.keys(args.columns)).not.toContain('secret');
  });

  it('applies audit log allowlist fields in Drizzle columns', async () => {
    const repo = new DrizzleAdminAnalyticsRepository();
    await repo.getAuditLogs(null, 10, 'id,action,token');

    const args = queryMocks.auditLogsFindMany.mock.calls[0]?.[0] ?? {};
    expect(args.columns).toBeDefined();
    expect(Object.keys(args.columns)).toEqual(expect.arrayContaining(['id', 'action']));
    expect(Object.keys(args.columns)).not.toContain('token');
  });

  it('applies session allowlist fields in live session selection', async () => {
    const repo = new DrizzleAdminAnalyticsRepository();
    await repo.getLiveSessions(1, 10, undefined, 'id,userId,expiresAt');

    const selectArgs = selectMock.mock.calls.find(call => {
      const fields = call[0] as Record<string, unknown>;
      return fields?.id === 'sessions.id';
    });

    expect(selectArgs).toBeDefined();
    const fields = selectArgs?.[0] as Record<string, unknown>;
    expect(Object.keys(fields)).toEqual(expect.arrayContaining(['id', 'userId', 'expiresAt']));
  });
});
