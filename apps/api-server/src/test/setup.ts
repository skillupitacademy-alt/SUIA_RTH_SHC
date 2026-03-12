import { vi, beforeEach } from 'vitest'

// Silence noisy logger output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}))

// Basic DB mock (expanded in individual tests as needed)
vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: { findFirst: vi.fn(), findMany: vi.fn() },
      examBlueprints: { findFirst: vi.fn(), findMany: vi.fn() },
      resultsByDimension: { findFirst: vi.fn(), findMany: vi.fn() },
      userProfiles: { findFirst: vi.fn(), findMany: vi.fn() },
      domains: { findFirst: vi.fn(), findMany: vi.fn() },
      subjects: { findFirst: vi.fn(), findMany: vi.fn() },
      topics: { findFirst: vi.fn(), findMany: vi.fn() },
      subtopics: { findFirst: vi.fn(), findMany: vi.fn() },
      questions: { findMany: vi.fn(), findFirst: vi.fn() },
      sessions: { findFirst: vi.fn(), findMany: vi.fn() },
      auditLogs: { findFirst: vi.fn(), findMany: vi.fn() },
      backgroundJobs: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
    insert: vi.fn(() => ({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([]) })),
    update: vi.fn(() => ({ set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue({}) })),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })),
    transaction: vi.fn(async (fn) => fn({
      query: { exams: { findFirst: vi.fn() } },
      update: vi.fn(() => ({ set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue({}) })),
      insert: vi.fn(() => ({ values: vi.fn().mockReturnThis(), onConflictDoNothing: vi.fn().mockResolvedValue(undefined) })),
    })),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
  exams: {},
  sessions: {},
  sessionQuestions: {},
  examBlueprints: {},
  userProfiles: {},
  users: {},
  questions: {},
  examQuestions: {},
  refreshTokens: { token: 'token', revoked: 'revoked', userId: 'userId', expiresAt: 'expiresAt' },
  verificationTokens: {},
  passwordResetTokens: {},
  idempotencyKeys: { userId: 'userId', key: 'key', examId: 'examId' },
  backgroundJobs: { id: 'id' },
  resultsByDimension: {},
  roles: {},
  userRoles: {},
  subjects: {},
  domains: {},
  skills: {},
  topics: {},
  subtopics: {},
  notifications: {},
  userRecommendations: {},
  notesDeliveryLocks: {},
  loginAttempts: {},
  jobs: {},
  // Task 37 Query Timeouts
  withTimeout: vi.fn((p) => p),
  QUICK_QUERY_TIMEOUT: 100,
  STANDARD_QUERY_TIMEOUT: 200,
  REPORT_QUERY_TIMEOUT: 300,
  MIGRATION_TIMEOUT: 400,
}))

// Upstash Redis mock (constructor-compatible)
vi.mock('@upstash/redis', () => {
  class MockRedis {
    get = vi.fn()
    set = vi.fn()
    del = vi.fn()
    keys = vi.fn()
  }
  return { Redis: MockRedis }
})



// Default test env settings
process.env.QUEUE_ENABLED = 'false';

// Reset spies between tests
beforeEach(() => {
  vi.clearAllMocks()
})
