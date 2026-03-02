import { vi } from 'vitest'

// Global mocks for api-server
vi.mock('@quiz/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}))

vi.mock('@/modules/core/cache.service', () => ({
  CacheService: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}))

vi.mock('@/modules/email/email.service', () => ({
  EmailService: {
    send: vi.fn(),
  },
}))
