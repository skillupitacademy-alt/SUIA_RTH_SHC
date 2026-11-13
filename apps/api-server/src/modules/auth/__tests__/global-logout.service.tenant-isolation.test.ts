import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalLogoutService } from '../global-logout.service';
import { TokenRepository } from '../repositories/token.repository';

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

// Create tenant-specific adapters and schema tables IN HOISTED SCOPE
const { rthAdapter, suiaAdapter, rthTable, suiaTable } = vi.hoisted(() => {
  const rthTable = { id: 'rth_refresh_tokens.id', userId: 'rth_refresh_tokens.userId' };
  const suiaTable = { id: 'suia_refresh_tokens.id', userId: 'suia_refresh_tokens.userId' };

  class TenantFixtureAdapter {
    sessions: SessionRow[] = [];
    tableName: string;
    updateCalls: any[] = [];

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

    reset() {
      this.sessions = [];
      this.updateCalls = [];
    }

    // Simulates drizzle update(table).set(values).where(predicate)
    update(table: any) {
      const self = this;
      self.updateCalls.push(table);
      return {
        set(updates: Partial<SessionRow>) {
          return {
            where(predicate: any) {
              if (!predicate || predicate.op !== 'and') {
                throw new Error('Expected AND predicate from revokeById');
              }

              const conditions = predicate.conditions;
              if (!Array.isArray(conditions) || conditions.length !== 2) {
                throw new Error('Expected exactly 2 conditions in AND predicate');
              }

              let affectedCount = 0;

              for (const session of self.sessions) {
                let matches = true;

                for (const cond of conditions) {
                  if (cond.op !== 'eq') {
                    throw new Error(`Unexpected operator: ${cond.op}`);
                  }
                  const field = cond.field.split('.').pop();
                  if (field !== 'id' && field !== 'userId') {
                    throw new Error(`Unexpected field in predicate: ${cond.field}`);
                  }
                  if (session[field as keyof SessionRow] !== cond.value) {
                    matches = false;
                    break;
                  }
                }

                if (matches) {
                  Object.assign(session, updates);
                  affectedCount++;
                }
              }

              return Object.assign(Promise.resolve(affectedCount), {
                returning: async () => Array.from({ length: affectedCount }, (_, index) => ({ id: String(index) })),
              });
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
    rthTable,
    suiaTable,
  };
});

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  db: rthAdapter,
  refreshTokens: rthTable,
}));

vi.mock('../brand-db', () => ({
  getAuthBrandContext: vi.fn((brand: string) => {
    const isSkillup = brand === 'skillup';
    return {
      db: isSkillup ? suiaAdapter : rthAdapter,
      tables: {
        refreshTokens: isSkillup ? suiaTable : rthTable,
        users: isSkillup ? 'suia_users' : 'rth_users',
        userRoles: isSkillup ? 'suia_user_roles' : 'rth_user_roles',
        userOrganizations: isSkillup ? 'suia_user_orgs' : 'rth_user_orgs',
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
  const mockUserRepo = {
    updateLastActive: vi.fn().mockResolvedValue(undefined),
    withDb: vi.fn(function(this: any) { return this; }),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    lastPredicate = null;
    rthAdapter.reset();
    suiaAdapter.reset();
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

    // Create REAL TokenRepository and REAL GlobalLogoutService
    const realTokenRepo = new TokenRepository(rthAdapter, { refreshTokens: rthTable as any });
    const service = new GlobalLogoutService(
      realTokenRepo,
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

    // Assert: Selected table was updated on RTH adapter
    expect(rthAdapter.updateCalls).toContain(rthTable);

    // Assert: SUIA session-100 remains ACTIVE (untouched)
    const suiaSession = suiaAdapter.findById('session-100');
    expect(suiaSession?.revoked).toBe(false);
    expect(suiaSession?.userId).toBe('user-A');
    expect(suiaSession?.token).toBe('token-suia-A');
    expect(suiaAdapter.updateCalls).toHaveLength(0);

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

    // Create REAL TokenRepository and REAL GlobalLogoutService
    const realTokenRepo = new TokenRepository(suiaAdapter, { refreshTokens: suiaTable as any });
    const service = new GlobalLogoutService(
      realTokenRepo,
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
    expect(suiaAdapter.updateCalls).toContain(suiaTable);

    // Assert: RTH session-200 remains ACTIVE (untouched)
    const rthSession = rthAdapter.findById('session-200');
    expect(rthSession?.revoked).toBe(false);
    expect(rthSession?.userId).toBe('user-B');
    expect(rthSession?.token).toBe('token-rth-B');
    expect(rthAdapter.updateCalls).toHaveLength(0);

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

    const realTokenRepo = new TokenRepository(rthAdapter, { refreshTokens: rthTable as any });
    const service = new GlobalLogoutService(
      realTokenRepo,
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
