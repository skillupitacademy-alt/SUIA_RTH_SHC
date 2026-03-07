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
    query: {},
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
  exams: {},
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

// Reset spies between tests
beforeEach(() => {
  vi.clearAllMocks()
})
