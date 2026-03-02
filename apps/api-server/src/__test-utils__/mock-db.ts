import { vi } from 'vitest';

export const createMockDb = () => {
  const mockTx = {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
    query: {
      domains: { findFirst: vi.fn(), findMany: vi.fn() },
      subjects: { findFirst: vi.fn(), findMany: vi.fn() },
      topics: { findFirst: vi.fn(), findMany: vi.fn() },
      subtopics: { findFirst: vi.fn(), findMany: vi.fn() },
      skills: { findFirst: vi.fn(), findMany: vi.fn() },
      topicSkills: { findFirst: vi.fn(), findMany: vi.fn() },
      questions: { findFirst: vi.fn(), findMany: vi.fn() },
      users: { findFirst: vi.fn(), findMany: vi.fn() },
      userProfiles: { findFirst: vi.fn(), findMany: vi.fn() },
      userRoles: { findFirst: vi.fn(), findMany: vi.fn() },
      adminUsers: { findFirst: vi.fn(), findMany: vi.fn() },
      exams: { findFirst: vi.fn(), findMany: vi.fn() },
      examQuestions: { findFirst: vi.fn(), findMany: vi.fn() },
      idempotencyKeys: { findFirst: vi.fn(), findMany: vi.fn() },
    },
  };

  const mockDb = {
    ...mockTx,
    transaction: vi.fn().mockImplementation(async (callback) => {
      return await callback(mockTx);
    }),
  };

  return { mockDb, mockTx };
};

export const { mockDb, mockTx } = createMockDb();
