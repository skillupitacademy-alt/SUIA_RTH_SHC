import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalLogoutService } from '../global-logout.service';
import { TokenRepository } from '../repositories/token.repository';
import { UserRepository } from '../repositories/user.repository';
import { AuditService } from '../audit.service';

/**
 * W1.2-SESS-01: Integrated tenant isolation test
 *
 * Combines real GlobalLogoutService and real TokenRepository with per-tenant
 * fixture DB adapters. Asserts selected contexts and untouched colliding rows
 * using the actual WHERE argument.
 */

// Mock drizzle-orm operators
let lastPredicate: any = null;

vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<typeof import('drizzle-orm')>('drizzle-orm');
  return {
    ...actual,
    eq: (field: any, value: any) => {
      return { field: String(field), op: 'eq', value };
    },
    and: (...conditions: any[]) => {
      lastPredicate = { op: 'and', conditions };
      return lastPredicate;
    },
  };
});

// Create tenant-specific adapters IN HOISTED SCOPE
const { rthAdapter, suiaAdapter } = vi.hoisted(() => {
  class TenantFixtureAdapter {
    sessions: SessionRow[] = [];
    tableName: string;

    constructor(tableName: string) {
      this.tableName = tableName;
    }

    insert(row: SessionRow) {
      this.sessions.push({ ...row });
    }

    findAll() {
      return this.sessions.map(s => ({ ...s }));
    }

    findById(id: string) {
      return this.sessions.find(s => s.id === id);
    }

    // Simulates drizzle update().set().where()
    update() {
      const self = this;
      return {
        set(updates: Partial<SessionRow>) {
          return {
            async where(predicate: any) {
              if (!predicate || predicate.op !== 'and') {
                throw new Error('Expected AND predicate from revokeById');
              }

              const conditions = predicate.conditions;
              let affectedCount = 0;

              for (const session of self.sessions) {
                let matches = true;

                for (const cond of conditions) {
                  if (cond.op === 'eq') {
                    const field = cond.field.split('.').pop();
                    if (session[field as keyof SessionRow] !== cond.value) {
                      matches = false;
                      break;
                    }
                  }
                }

                if (matches) {
                  Object.assign(session, updates);
                  affectedCount++;
                }
              }

              return affectedCount;
            }
          };
        }
      };
    }

    query = {
      refreshTokens: {
        findFirst: vi.fn().mockResolvedValue(null),
      }
    };
  }

  interface SessionRow {
    id: string;
    userId: string;
    token: string;
    revoked: boolean;
    expiresAt: Date;
  }

  return {
    rthAdapter: new TenantFixtureAdapter('rth_refresh_tokens'),
    suiaAdapter: new TenantFixtureAdapter('suia_refresh_tokens'),
  };
});

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  db: rthAdapter, // Default to RTH adapter
  refreshTokens: {
    id: 'refreshTokens.id',
    userId: 'refreshTokens.userId',
    token: 'refreshTokens.token',
    revoked: 'refreshTokens.revoked',
    expiresAt: 'refreshTokens.expiresAt',
    lastActiveAt: 'refreshTokens.lastActiveAt',
  },
}));

vi.mock('../brand-db', () => ({
  getAuthBrandContext: vi.fn((brand: string) => {
    const adapter = brand === 'skillup' ? suiaAdapter : rthAdapter;
    return {
      db: adapter,
      tables: {
        refreshTokens: 'mock_refresh_tokens_table',
        users: 'mock_users_table',
        userRoles: 'mock_user_roles_table',
        userOrganizations: 'mock_user_organizations_table',
      },
    };
  }),
  shouldUseBrandBinding: vi.fn(() => true),
}));

const mockAuditService = {
  log: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../audit.service', () => ({
  AuditService: vi.fn().mockImplementation(() => mockAuditService),
}));

describe('W1.2-SESS-01: GlobalLogoutService tenant isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastPredicate = null;
    // Reset tenant adapters
    rthAdapter.sessions = [];
    suiaAdapter.sessions = [];
  });

  it('RTH tenant: revokeSession operates on RTH fixture only, SUIA fixture untouched', async () => {
    // Setup: RTH user-A has session-100
    rthAdapter.insert({
      id: 'session-100',
      userId: 'user-A',
      token: 'token-rth-A',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    // Setup: SUIA also has colliding user-A / session-100
    suiaAdapter.insert({
      id: 'session-100',
      userId: 'user-A',
      token: 'token-suia-A',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    // Verify both start active
    expect(rthAdapter.findById('session-100')?.revoked).toBe(false);
    expect(suiaAdapter.findById('session-100')?.revoked).toBe(false);

    // Create RTH-bound service
    const mockUserRepo = {
      updateLastActive: vi.fn().mockResolvedValue(undefined),
      withDb: vi.fn(function(this: any) { return this; }),
    } as any;

    const service = new GlobalLogoutService(
      undefined as any, // Will be created with RTH context
      mockUserRepo,
      mockAuditService as any
    );

    // RTH brand: revoke session-100 for user-A
    await service.revokeSession('user-A', 'session-100', '192.0.2.100', 'realtutorialhub');

    // Assert: RTH session-100 is revoked
    const rthSession = rthAdapter.findById('session-100');
    expect(rthSession?.revoked).toBe(true);
    expect(rthSession?.userId).toBe('user-A');
    expect(rthSession?.token).toBe('token-rth-A');

    // Assert: SUIA session-100 remains ACTIVE (untouched)
    const suiaSession = suiaAdapter.findById('session-100');
    expect(suiaSession?.revoked).toBe(false);
    expect(suiaSession?.userId).toBe('user-A');
    expect(suiaSession?.token).toBe('token-suia-A');

    // Verify the actual WHERE predicate included both session ID and user ID
    expect(lastPredicate).not.toBeNull();
    expect(lastPredicate.op).toBe('and');
    expect(lastPredicate.conditions).toHaveLength(2);

    const sessionIdPred = lastPredicate.conditions.find((c: any) => c.field.includes('.id'));
    const userIdPred = lastPredicate.conditions.find((c: any) => c.field.includes('.userId'));

    expect(sessionIdPred).toBeDefined();
    expect(sessionIdPred.value).toBe('session-100');
    expect(userIdPred).toBeDefined();
    expect(userIdPred.value).toBe('user-A');
  });

  it('SUIA tenant: revokeSession operates on SUIA fixture only, RTH fixture untouched', async () => {
    // Setup: RTH user-B has session-200
    rthAdapter.insert({
      id: 'session-200',
      userId: 'user-B',
      token: 'token-rth-B',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    // Setup: SUIA has colliding user-B / session-200
    suiaAdapter.insert({
      id: 'session-200',
      userId: 'user-B',
      token: 'token-suia-B',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    // Verify both start active
    expect(rthAdapter.findById('session-200')?.revoked).toBe(false);
    expect(suiaAdapter.findById('session-200')?.revoked).toBe(false);

    // Create SUIA-bound service
    const mockUserRepo = {
      updateLastActive: vi.fn().mockResolvedValue(undefined),
      withDb: vi.fn(function(this: any) { return this; }),
    } as any;

    const service = new GlobalLogoutService(
      undefined as any,
      mockUserRepo,
      mockAuditService as any
    );

    // SUIA brand: revoke session-200 for user-B
    await service.revokeSession('user-B', 'session-200', '192.0.2.100', 'skillup');

    // Assert: SUIA session-200 is revoked
    const suiaSession = suiaAdapter.findById('session-200');
    expect(suiaSession?.revoked).toBe(true);
    expect(suiaSession?.userId).toBe('user-B');
    expect(suiaSession?.token).toBe('token-suia-B');

    // Assert: RTH session-200 remains ACTIVE (untouched)
    const rthSession = rthAdapter.findById('session-200');
    expect(rthSession?.revoked).toBe(false);
    expect(rthSession?.userId).toBe('user-B');
    expect(rthSession?.token).toBe('token-rth-B');

    // Verify actual WHERE predicate
    expect(lastPredicate).not.toBeNull();
    expect(lastPredicate.op).toBe('and');

    const sessionIdPred = lastPredicate.conditions.find((c: any) => c.field.includes('.id'));
    const userIdPred = lastPredicate.conditions.find((c: any) => c.field.includes('.userId'));

    expect(sessionIdPred?.value).toBe('session-200');
    expect(userIdPred?.value).toBe('user-B');
  });

  it('Cross-user attempt within same tenant: ownership predicate prevents revocation', async () => {
    // Setup: RTH has user-A session and user-B session
    rthAdapter.insert({
      id: 'session-A',
      userId: 'user-A',
      token: 'token-A',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    rthAdapter.insert({
      id: 'session-B',
      userId: 'user-B',
      token: 'token-B',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    const mockUserRepo = {
      updateLastActive: vi.fn().mockResolvedValue(undefined),
      withDb: vi.fn(function(this: any) { return this; }),
    } as any;

    const service = new GlobalLogoutService(
      undefined as any,
      mockUserRepo,
      mockAuditService as any
    );

    // User-A attempts to revoke session-B (user-B's session)
    await service.revokeSession('user-A', 'session-B', '192.0.2.100', 'realtutorialhub');

    // Assert: session-B remains active (predicate matched 0 rows)
    const sessionB = rthAdapter.findById('session-B');
    expect(sessionB?.revoked).toBe(false);
    expect(sessionB?.userId).toBe('user-B');

    // Assert: session-A also remains active (not accidentally affected)
    const sessionA = rthAdapter.findById('session-A');
    expect(sessionA?.revoked).toBe(false);
    expect(sessionA?.userId).toBe('user-A');

    // Verify predicate tried to match session-B AND user-A (mismatch)
    expect(lastPredicate.conditions).toHaveLength(2);
    const sessionIdPred = lastPredicate.conditions.find((c: any) => c.field.includes('.id'));
    const userIdPred = lastPredicate.conditions.find((c: any) => c.field.includes('.userId'));

    expect(sessionIdPred?.value).toBe('session-B');
    expect(userIdPred?.value).toBe('user-A'); // Doesn't match session-B's userId
  });
});
