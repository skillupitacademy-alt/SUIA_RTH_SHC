import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { and, eq, gt } from 'drizzle-orm';
import { TokenRefreshService } from '../token-refresh.service';
import { TokenRepository } from '../repositories/token.repository';

/**
 * W1.2-REFRESH-02: Atomic Single-Consumer Refresh Rotation Security Tests
 *
 * PROVES:
 * 1. Normal rotation: consumes exactly one parent and stores exactly one successor.
 * 2. Deterministic concurrency race: Two concurrent requests read active parent;
 *    atomic consume ensures exactly ONE winner, while the second request fails closed
 *    with zero successor leaked or persisted.
 * 3. Pre-fix vulnerability reproduction (Actual-Source Mutant): Proves that without
 *    atomic compare-and-swap in token.repository.ts, two concurrent requests fork tokens.
 * 4. Rollback: If successor insertion fails, parent consumption is rolled back.
 * 5. Already-revoked, expired, absent, or wrong-owner tokens cannot be consumed.
 * 6. Tenant isolation: Colliding session IDs across RTH and SUIA remain strictly isolated.
 * 7. Runtime validation: Missing/empty userId or tokenHash fails closed.
 */

interface SessionRowInternal {
  id: string;
  userId: string;
  token: string;
  revoked: boolean;
  expiresAt: Date;
  lastUsedAt?: Date | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceName?: string | null;
}

const { rthAdapter, suiaAdapter, rthTable, suiaTable } = vi.hoisted(() => {
  interface SessionRowInternal {
    id: string;
    userId: string;
    token: string;
    revoked: boolean;
    expiresAt: Date;
    lastUsedAt?: Date | null;
    deviceId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceName?: string | null;
  }

  class TransactionalTestAdapterInternal {
    sessions: SessionRowInternal[] = [];
    lastPredicate: any = null;

    reset() {
      this.sessions = [];
      this.lastPredicate = null;
    }

    insert(row: SessionRowInternal) {
      this.sessions.push({ ...row });
    }

    findAll() {
      return this.sessions.map((s) => ({ ...s }));
    }

    findById(id: string) {
      return this.sessions.find((s) => s.id === id);
    }

    findByToken(token: string) {
      return this.sessions.find((s) => s.token === token);
    }

    update(table: any) {
      const self = this;
      return {
        set(updates: Partial<SessionRowInternal>) {
          return {
            where(predicate: any) {
              self.lastPredicate = predicate;
              const updatedRows = self.evaluateAndApply(predicate, updates);
              return Object.assign(Promise.resolve(updatedRows), {
                returning: () => Promise.resolve(updatedRows),
              });
            },
          };
        },
      };
    }

    insertDrizzle(table: any) {
      const self = this;
      return {
        values(data: any) {
          const duplicate = self.sessions.find((s) => s.token === data.token);
          if (duplicate) {
            const err = new Error(`duplicate key value violates unique constraint "refresh_tokens_token_unique"`);
            return Promise.reject(err);
          }

          const newRow: SessionRowInternal = {
            id: data.id ?? `sess-${Date.now()}-${Math.random()}`,
            userId: data.userId,
            token: data.token,
            revoked: false,
            expiresAt: data.expiresAt,
            lastUsedAt: new Date(),
            deviceId: data.deviceContext?.deviceId ?? null,
            ipAddress: data.deviceContext?.ipAddress ?? null,
            userAgent: data.deviceContext?.userAgent ?? null,
            deviceName: data.deviceContext?.deviceName ?? null,
          };
          self.sessions.push(newRow);
          return Promise.resolve([newRow]);
        },
      };
    }

    // Transaction support with isolated transaction rollback
    async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
      const insertedRows: SessionRowInternal[] = [];
      const updatedOriginals: Map<SessionRowInternal, Partial<SessionRowInternal>> = new Map();

      const tx = {
        update: (table: any) => ({
          set: (updates: Partial<SessionRowInternal>) => ({
            where: (predicate: any) => {
              this.lastPredicate = predicate;
              const updated = this.evaluateAndApply(predicate, updates, (session, oldVals) => {
                if (!updatedOriginals.has(session)) {
                  updatedOriginals.set(session, oldVals);
                }
              });
              return Object.assign(Promise.resolve(updated), {
                returning: () => Promise.resolve(updated),
              });
            },
          }),
        }),
        insert: (table: any) => ({
          values: (data: any) => {
            const duplicate = this.sessions.find((s) => s.token === data.token);
            if (duplicate) {
              const err = new Error(`duplicate key value violates unique constraint "refresh_tokens_token_unique"`);
              return Promise.reject(err);
            }

            const newRow: SessionRowInternal = {
              id: data.id ?? `sess-${Date.now()}-${Math.random()}`,
              userId: data.userId,
              token: data.token,
              revoked: false,
              expiresAt: data.expiresAt,
              lastUsedAt: new Date(),
              deviceId: data.deviceContext?.deviceId ?? null,
              ipAddress: data.deviceContext?.ipAddress ?? null,
              userAgent: data.deviceContext?.userAgent ?? null,
              deviceName: data.deviceContext?.deviceName ?? null,
            };
            this.sessions.push(newRow);
            insertedRows.push(newRow);
            return Promise.resolve([newRow]);
          },
        }),
        query: this.query,
      };

      try {
        return await callback(tx);
      } catch (error) {
        // Revert only rows inserted or modified by this specific transaction
        for (const row of insertedRows) {
          const idx = this.sessions.indexOf(row);
          if (idx !== -1) {
            this.sessions.splice(idx, 1);
          }
        }
        for (const [session, oldValues] of updatedOriginals.entries()) {
          Object.assign(session, oldValues);
        }
        throw error;
      }
    }

    query = {
      refreshTokens: {
        findFirst: vi.fn(async ({ where }: { where?: any } = {}) => {
          if (!where) return this.sessions[0] ?? null;
          return this.sessions.find((s) => this.rowMatches(s, where)) ?? null;
        }),
      },
    };

    evaluateAndApply(
      predicate: any,
      updates: Partial<SessionRowInternal>,
      onUpdate?: (session: SessionRowInternal, oldVals: Partial<SessionRowInternal>) => void,
    ): SessionRowInternal[] {
      const updated: SessionRowInternal[] = [];
      for (const session of this.sessions) {
        if (this.rowMatches(session, predicate)) {
          if (onUpdate) {
            const oldVals: Partial<SessionRowInternal> = {};
            for (const key of Object.keys(updates) as (keyof SessionRowInternal)[]) {
              oldVals[key] = session[key] as any;
            }
            onUpdate(session, oldVals);
          }
          Object.assign(session, updates);
          updated.push({ ...session });
        }
      }
      return updated;
    }

    rowMatches(session: SessionRowInternal, predicate: any): boolean {
      if (!predicate) return true;
      if (typeof predicate.toQuery === 'function') {
        const q = predicate.toQuery({
          escapeName: (s: any) => (typeof s === 'string' ? s : s?.name ?? String(s)),
          escapeParam: (n: any, v: any) => String(v),
        });
        for (let i = 0; i < q.params.length; i += 2) {
          const rawCol = q.params[i];
          const col = String(typeof rawCol === 'object' && rawCol !== null ? rawCol.name ?? rawCol : rawCol)
            .split('.')
            .pop() as keyof SessionRowInternal;
          const val = q.params[i + 1];

          if (col === 'expiresAt') {
            if (!(session.expiresAt instanceof Date) || !(val instanceof Date) || session.expiresAt <= val) {
              return false;
            }
          } else if (session[col] !== val) {
            return false;
          }
        }
        return true;
      }
      return false;
    }
  }

  const rth = new TransactionalTestAdapterInternal();
  const suia = new TransactionalTestAdapterInternal();

  const rTable = {
    id: 'rth_refresh_tokens.id',
    userId: 'rth_refresh_tokens.userId',
    token: 'rth_refresh_tokens.token',
    revoked: 'rth_refresh_tokens.revoked',
    expiresAt: 'rth_refresh_tokens.expiresAt',
    lastUsedAt: 'rth_refresh_tokens.lastUsedAt',
  };

  const sTable = {
    id: 'suia_refresh_tokens.id',
    userId: 'suia_refresh_tokens.userId',
    token: 'suia_refresh_tokens.token',
    revoked: 'suia_refresh_tokens.revoked',
    expiresAt: 'suia_refresh_tokens.expiresAt',
    lastUsedAt: 'suia_refresh_tokens.lastUsedAt',
  };

  return {
    rthAdapter: rth,
    suiaAdapter: suia,
    rthTable: rTable,
    suiaTable: sTable,
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

const mockUserRepo = {
  findActiveUserWithRoles: vi.fn().mockImplementation(async (userId: string) => ({
    id: userId,
    email: `@example.com`,
    isBlocked: false,
    deletedAt: null,
    roles: [],
  })),
  withDb: vi.fn(function (this: any) {
    return this;
  }),
};

vi.mock('../repositories/user.repository', () => ({
  UserRepository: vi.fn().mockImplementation(() => mockUserRepo),
}));

describe('W1.2-REFRESH-02: Atomic Single-Consumer Refresh Rotation', () => {
  let mockTokenService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    rthAdapter.reset();
    suiaAdapter.reset();

    mockTokenService = {
      hashToken: vi.fn(async (t: string) => `hash-${t}`),
      verifyRefreshToken: vi.fn(async (t: string) => ({
        userId: 'user-alice',
        isAdmin: false,
        aud: 'user',
        brand: 'realtutorialhub',
        originalUserId: 'user-alice',
        shadowUserId: 'user-alice',
      })),
      generateAccessToken: vi.fn(async () => 'access-token-new'),
      generateRefreshToken: vi.fn(async () => `refresh-token-${Math.random()}`),
    };
  });

  describe('Single-Consumer Rotation (Happy Path)', () => {
    it('consumes active parent and creates exactly one successor in a single transaction', async () => {
      rthAdapter.insert({
        id: 'parent-session-1',
        userId: 'user-alice',
        token: 'hash-old-token-1',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });

      const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });
      const service = new TokenRefreshService(repo, mockTokenService, mockAuditService as any);

      const result = await service.refresh('old-token-1', '192.0.2.1', undefined, 'user', 'realtutorialhub');

      expect(result.accessToken).toBe('access-token-new');
      expect(result.userId).toBe('user-alice');

      // Verify parent is now consumed (revoked = true)
      const parent = rthAdapter.findById('parent-session-1');
      expect(parent?.revoked).toBe(true);
      expect(parent?.lastUsedAt).toBeInstanceOf(Date);

      // Verify exactly ONE successor exists
      const allSessions = rthAdapter.findAll();
      expect(allSessions).toHaveLength(2); // parent + 1 successor
      const successor = allSessions.find((s) => s.id !== 'parent-session-1');
      expect(successor).toBeDefined();
      expect(successor?.revoked).toBe(false);
      expect(successor?.userId).toBe('user-alice');
    });
  });

  describe('Deterministic Concurrency Race: Single Winner Guarantee', () => {
    it('when two requests race with the same parent token, exactly ONE succeeds and second fails closed', async () => {
      rthAdapter.insert({
        id: 'parent-race-sess',
        userId: 'user-alice',
        token: 'hash-shared-parent-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });

      // Synchronize both requests so both read the active session before either completes the transaction
      let concurrentReads = 0;
      let resolveBothReads: () => void;
      const bothReadPromise = new Promise<void>((resolve) => {
        resolveBothReads = resolve;
      });

      const baseFindFirst = rthAdapter.query.refreshTokens.findFirst;
      rthAdapter.query.refreshTokens.findFirst = vi.fn(async (args: any) => {
        const row = await baseFindFirst(args);
        concurrentReads++;
        if (concurrentReads === 2) {
          resolveBothReads();
        } else {
          await bothReadPromise;
        }
        return row;
      });

      const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });
      const service = new TokenRefreshService(repo, mockTokenService, mockAuditService as any);

      const promise1 = service.refresh('shared-parent-token', '192.0.2.10', undefined, 'user', 'realtutorialhub');
      const promise2 = service.refresh('shared-parent-token', '192.0.2.20', undefined, 'user', 'realtutorialhub');

      const results = await Promise.allSettled([promise1, promise2]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // EXACTLY ONE request must succeed
      expect(fulfilled).toHaveLength(1);

      // EXACTLY ONE request must fail closed
      expect(rejected).toHaveLength(1);
      const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
      expect(rejectionReason.message).toMatch(/revoked or already consumed/i);

      // Verify the parent was consumed
      const parent = rthAdapter.findById('parent-race-sess');
      expect(parent?.revoked).toBe(true);

      // Verify in DB: exactly ONE successor token was persisted (NO token branching)
      const allSessions = rthAdapter.findAll();
      expect(allSessions).toHaveLength(2); // 1 parent + 1 successor only
      const successors = allSessions.filter((s) => s.id !== 'parent-race-sess');
      expect(successors).toHaveLength(1);
      expect(successors[0].revoked).toBe(false);
    });

    it('PRE-FIX VULNERABILITY REPRODUCTION: Actual-source mutant proves that without atomic CAS, concurrent requests fork tokens', async () => {
      // 1. Read actual production source file
      const prodRepoPath = path.resolve(__dirname, '../repositories/token.repository.ts');
      const prodSource = fs.readFileSync(prodRepoPath, 'utf8');

      expect(prodSource).toContain('eq(this.refreshTokensTable.revoked, false)');
      expect(prodSource).toContain('gt(this.refreshTokensTable.expiresAt, now)');

      // 2. Extract production consumeToken method
      const match = prodSource.match(/async consumeToken\([^)]*\): Promise<[^>]*>\s*\{([\s\S]*?)\n  \}/);
      expect(match).not.toBeNull();

      // 3. Mutate: Remove active CAS predicates (simulating pre-fix unconditional update)
      const mutantBody = match![1]
        .replace(/eq\(this\.refreshTokensTable\.revoked,\s*false\),?\s*/, '')
        .replace(/gt\(this\.refreshTokensTable\.expiresAt,\s*now\),?\s*/, '')
        .replace(/if\s*\(Array\.isArray\(result\)\s*&&\s*result\.length === 1\)/, 'if (Array.isArray(result) && result.length >= 0)');

      const jsCode = ts.transpile(mutantBody);

      class DisposableMutantRepo extends TokenRepository {
        withDb(dbClient: any, tables?: any): this {
          return new DisposableMutantRepo(dbClient, tables) as this;
        }

        async consumeToken(tokenHash: string, expectedUserId: string): Promise<any> {
          const fn = new Function('and', 'eq', 'gt', 'tokenHash', 'expectedUserId', `return (async function() { ${jsCode} }).call(this);`);
          return await fn.call(this, and, eq, gt, tokenHash, expectedUserId);
        }
      }

      rthAdapter.insert({
        id: 'parent-vulnerable-sess',
        userId: 'user-alice',
        token: 'hash-vulnerable-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });

      // Synchronize both requests so both read the active session before either completes the transaction
      let concurrentReads = 0;
      let resolveBothReads: () => void;
      const bothReadPromise = new Promise<void>((resolve) => {
        resolveBothReads = resolve;
      });

      const baseFindFirst = rthAdapter.query.refreshTokens.findFirst;
      rthAdapter.query.refreshTokens.findFirst = vi.fn(async (args: any) => {
        const row = await baseFindFirst(args);
        concurrentReads++;
        if (concurrentReads === 2) {
          resolveBothReads();
        } else {
          await bothReadPromise;
        }
        return row;
      });

      const vulnRepo = new DisposableMutantRepo(rthAdapter as any, { refreshTokens: rthTable as any });
      const vulnService = new TokenRefreshService(vulnRepo, mockTokenService, mockAuditService as any);

      const results = await Promise.allSettled([
        vulnService.refresh('vulnerable-token', '192.0.2.10', undefined, 'user', 'realtutorialhub'),
        vulnService.refresh('vulnerable-token', '192.0.2.20', undefined, 'user', 'realtutorialhub'),
      ]);

      // DEMONSTRATION OF DEFECT: Without atomic CAS, BOTH requests succeed!
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled).toHaveLength(2); // BOTH SUCCEEDED!

      // And TWO successors were created (token branching breach)
      const allSessions = rthAdapter.findAll();
      expect(allSessions).toHaveLength(3); // 1 parent + 2 successors!
    });
  });

  describe('Transactional Rollback', () => {
    it('rolls back parent consumption if successor insert fails inside transaction', async () => {
      rthAdapter.insert({
        id: 'parent-rollback-sess',
        userId: 'user-alice',
        token: 'hash-rollback-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });

      // Force createRefreshToken on TokenRepository prototype to fail
      vi.spyOn(TokenRepository.prototype, 'createRefreshToken').mockRejectedValueOnce(new Error('DB insert failure'));

      const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });
      const service = new TokenRefreshService(repo, mockTokenService, mockAuditService as any);

      await expect(
        service.refresh('rollback-token', '192.0.2.1', undefined, 'user', 'realtutorialhub')
      ).rejects.toThrow('DB insert failure');

      // VERIFY ROLLBACK: Parent token remains UNREVOKED (no orphaned state)
      const parent = rthAdapter.findById('parent-rollback-sess');
      expect(parent?.revoked).toBe(false);

      // Zero successor tokens persisted
      const allSessions = rthAdapter.findAll();
      expect(allSessions).toHaveLength(1);
    });
  });

  describe('Rejection of Invalid / Unusable Parents', () => {
    it('already-revoked parent cannot be consumed', async () => {
      rthAdapter.insert({
        id: 'sess-already-revoked',
        userId: 'user-alice',
        token: 'hash-revoked-token',
        revoked: true,
        expiresAt: new Date(Date.now() + 100000),
      });

      const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });
      const service = new TokenRefreshService(repo, mockTokenService, mockAuditService as any);

      await expect(
        service.refresh('revoked-token', '192.0.2.1', undefined, 'user', 'realtutorialhub')
      ).rejects.toThrow(/invalid refresh token/i);

      // Direct consumeToken also fails closed
      const consumed = await repo.consumeToken('hash-revoked-token', 'user-alice');
      expect(consumed).toBeNull();
    });

    it('expired parent cannot be consumed', async () => {
      rthAdapter.insert({
        id: 'sess-expired',
        userId: 'user-alice',
        token: 'hash-expired-token',
        revoked: false,
        expiresAt: new Date(Date.now() - 100000), // Expired
      });

      const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });
      const service = new TokenRefreshService(repo, mockTokenService, mockAuditService as any);

      await expect(
        service.refresh('expired-token', '192.0.2.1', undefined, 'user', 'realtutorialhub')
      ).rejects.toThrow(/expired/i);

      // Direct consumeToken also fails closed
      const consumed = await repo.consumeToken('hash-expired-token', 'user-alice');
      expect(consumed).toBeNull();
    });

    it('wrong expected owner cannot consume parent', async () => {
      rthAdapter.insert({
        id: 'sess-bob',
        userId: 'user-bob',
        token: 'hash-bob-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });

      const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });

      // User Alice attempts to consume Bob's token
      const consumed = await repo.consumeToken('hash-bob-token', 'user-alice');
      expect(consumed).toBeNull();

      // Bob's token remains unrevoked
      const bobSession = rthAdapter.findById('sess-bob');
      expect(bobSession?.revoked).toBe(false);
    });

    it('runtime validation throws on missing or empty parameters before update', async () => {
      const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });

      await expect(repo.consumeToken('hash', '')).rejects.toThrow('W1.2-REFRESH-02: expectedUserId is required');
      await expect(repo.consumeToken('hash', '   ')).rejects.toThrow('W1.2-REFRESH-02: expectedUserId is required');
      await expect(repo.consumeToken('', 'user-alice')).rejects.toThrow('W1.2-REFRESH-02: tokenHash is required');
      // @ts-expect-error Runtime test
      await expect(repo.consumeToken(undefined, 'user-alice')).rejects.toThrow('W1.2-REFRESH-02: tokenHash is required');
    });
  });

  describe('Tenant Store Isolation', () => {
    it('colliding session and user IDs across RTH and SUIA remain independently scoped', async () => {
      // RTH has user-A with session-colliding
      rthAdapter.insert({
        id: 'session-colliding',
        userId: 'user-A',
        token: 'hash-rth-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });

      // SUIA has SAME user-A with SAME session-colliding
      suiaAdapter.insert({
        id: 'session-colliding',
        userId: 'user-A',
        token: 'hash-suia-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });

      const rthRepo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });
      const suiaRepo = new TokenRepository(suiaAdapter as any, { refreshTokens: suiaTable as any });

      // Consume in RTH
      const rthConsumed = await rthRepo.consumeToken('hash-rth-token', 'user-A');
      expect(rthConsumed).toBeDefined();

      // Verify RTH is revoked, SUIA remains active
      expect(rthAdapter.findById('session-colliding')?.revoked).toBe(true);
      expect(suiaAdapter.findById('session-colliding')?.revoked).toBe(false);

      // Now consume in SUIA
      const suiaConsumed = await suiaRepo.consumeToken('hash-suia-token', 'user-A');
      expect(suiaConsumed).toBeDefined();

      expect(suiaAdapter.findById('session-colliding')?.revoked).toBe(true);
    });
  });

  describe('W1.2-REFRESH-07: Pre-CAS Metadata Elimination & State Safety', () => {
    it('REQ-1: successful rotation consumes exactly one parent, updates its timestamp in CAS, and inserts exactly one successor while unrelated sessions remain unchanged', async () => {
      const fixedInitialDate = new Date(Date.now() - 3600000);
      const unrelatedDate = new Date(Date.now() - 7200000);

      rthAdapter.insert({
        id: 'parent-req1',
        userId: 'user-alice',
        token: 'hash-req1-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
        lastUsedAt: fixedInitialDate,
      });

      rthAdapter.insert({
        id: 'unrelated-req1',
        userId: 'user-bob',
        token: 'hash-unrelated-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
        lastUsedAt: unrelatedDate,
      });

      const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });
      const service = new TokenRefreshService(repo, mockTokenService, mockAuditService as any);

      const result = await service.refresh('req1-token', '192.0.2.1', undefined, 'user', 'realtutorialhub');
      expect(result.accessToken).toBe('access-token-new');

      // Parent is consumed and timestamp updated in CAS
      const parent = rthAdapter.findById('parent-req1');
      expect(parent?.revoked).toBe(true);
      expect(parent?.lastUsedAt!.getTime()).toBeGreaterThan(fixedInitialDate.getTime());

      // Exactly one successor created
      const allSessions = rthAdapter.findAll();
      expect(allSessions).toHaveLength(3); // parent + unrelated + 1 successor
      const successors = allSessions.filter((s) => s.id !== 'parent-req1' && s.id !== 'unrelated-req1');
      expect(successors).toHaveLength(1);
      expect(successors[0].userId).toBe('user-alice');
      expect(successors[0].revoked).toBe(false);

      // Unrelated session is completely unchanged
      const unrelated = rthAdapter.findById('unrelated-req1');
      expect(unrelated?.revoked).toBe(false);
      expect(unrelated?.lastUsedAt?.getTime()).toBe(unrelatedDate.getTime());
    });

    it('REQ-2A: access token signing failure leaves original parent state/timestamp unchanged, creates no child, and preserves unrelated sessions', async () => {
      const fixedInitialDate = new Date(Date.now() - 3600000);
      const unrelatedDate = new Date(Date.now() - 7200000);

      rthAdapter.insert({
        id: 'parent-req2a',
        userId: 'user-alice',
        token: 'hash-req2a-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
        lastUsedAt: fixedInitialDate,
      });

      rthAdapter.insert({
        id: 'unrelated-req2a',
        userId: 'user-bob',
        token: 'hash-unrelated-2a-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
        lastUsedAt: unrelatedDate,
      });

      mockTokenService.generateAccessToken.mockRejectedValueOnce(new Error('Access token signing failure'));

      const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });
      const service = new TokenRefreshService(repo, mockTokenService, mockAuditService as any);

      await expect(
        service.refresh('req2a-token', '192.0.2.1', undefined, 'user', 'realtutorialhub')
      ).rejects.toThrow('Access token signing failure');

      // Parent MUST remain completely unmodified
      const parent = rthAdapter.findById('parent-req2a');
      expect(parent?.revoked).toBe(false);
      expect(parent?.lastUsedAt?.getTime()).toBe(fixedInitialDate.getTime());

      // Unrelated row is completely unmodified
      const unrelated = rthAdapter.findById('unrelated-req2a');
      expect(unrelated?.revoked).toBe(false);
      expect(unrelated?.lastUsedAt?.getTime()).toBe(unrelatedDate.getTime());

      // No child sessions created (exactly the original 2 rows remain)
      expect(rthAdapter.findAll()).toHaveLength(2);
    });

    it('REQ-2B: refresh token signing failure leaves original parent state/timestamp unchanged, creates no child, and preserves unrelated sessions', async () => {
      const fixedInitialDate = new Date(Date.now() - 3600000);
      const unrelatedDate = new Date(Date.now() - 7200000);

      rthAdapter.insert({
        id: 'parent-req2b',
        userId: 'user-alice',
        token: 'hash-req2b-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
        lastUsedAt: fixedInitialDate,
      });

      rthAdapter.insert({
        id: 'unrelated-req2b',
        userId: 'user-bob',
        token: 'hash-unrelated-2b-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
        lastUsedAt: unrelatedDate,
      });

      // Access token succeeds, but refresh token signing fails
      mockTokenService.generateAccessToken.mockResolvedValueOnce('access-token-new');
      mockTokenService.generateRefreshToken.mockRejectedValueOnce(new Error('Refresh token signing failure'));

      const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });
      const service = new TokenRefreshService(repo, mockTokenService, mockAuditService as any);

      await expect(
        service.refresh('req2b-token', '192.0.2.1', undefined, 'user', 'realtutorialhub')
      ).rejects.toThrow('Refresh token signing failure');

      // Parent MUST remain completely unmodified
      const parent = rthAdapter.findById('parent-req2b');
      expect(parent?.revoked).toBe(false);
      expect(parent?.lastUsedAt?.getTime()).toBe(fixedInitialDate.getTime());

      // Unrelated row is completely unmodified
      const unrelated = rthAdapter.findById('unrelated-req2b');
      expect(unrelated?.revoked).toBe(false);
      expect(unrelated?.lastUsedAt?.getTime()).toBe(unrelatedDate.getTime());

      // No child sessions created (exactly the original 2 rows remain)
      expect(rthAdapter.findAll()).toHaveLength(2);
    });

    it('REQ-3: CAS loser creates no child and makes zero metadata writes (attributed operation proof)', async () => {
      const fixedInitialDate = new Date(Date.now() - 3600000);

      rthAdapter.insert({
        id: 'parent-req3',
        userId: 'user-alice',
        token: 'hash-req3-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
        lastUsedAt: fixedInitialDate,
      });

      let concurrentReads = 0;
      let resolveBothReads: () => void;
      const bothReadPromise = new Promise<void>((resolve) => {
        resolveBothReads = resolve;
      });

      const baseFindFirst = rthAdapter.query.refreshTokens.findFirst;
      rthAdapter.query.refreshTokens.findFirst = vi.fn(async (args: any) => {
        const row = await baseFindFirst(args);
        concurrentReads++;
        if (concurrentReads === 2) {
          resolveBothReads();
        } else {
          await bothReadPromise;
        }
        return row;
      });

      const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });

      // Operation attribution spies
      const updateLastUsedSpy = vi.spyOn(TokenRepository.prototype, 'updateLastUsed');
      const consumeTokenSpy = vi.spyOn(TokenRepository.prototype, 'consumeToken');
      const createRefreshTokenSpy = vi.spyOn(TokenRepository.prototype, 'createRefreshToken');

      const service = new TokenRefreshService(repo, mockTokenService, mockAuditService as any);

      const results = await Promise.allSettled([
        service.refresh('req3-token', '192.0.2.10', undefined, 'user', 'realtutorialhub'),
        service.refresh('req3-token', '192.0.2.20', undefined, 'user', 'realtutorialhub'),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason.message).toMatch(/revoked or already consumed/i);

      // Operation attribution proof:
      // 1. updateLastUsed is never called by either winner or loser (0 calls)
      expect(updateLastUsedSpy).toHaveBeenCalledTimes(0);
      // 2. consumeToken is called once per entrant (2 calls total: 1 returned row, 1 returned null)
      expect(consumeTokenSpy).toHaveBeenCalledTimes(2);
      // 3. createRefreshToken is called ONLY by the winner (exactly 1 call; loser called 0 times)
      expect(createRefreshTokenSpy).toHaveBeenCalledTimes(1);

      // In DB: exactly ONE successor exists (the winner's); loser created zero successors
      const allSessions = rthAdapter.findAll();
      expect(allSessions).toHaveLength(2); // parent + 1 successor
    });

    it('REQ-3B: deterministic failed-CAS loser performs zero metadata writes and preserves parent state', async () => {
      const winnerDate = new Date(Date.now() - 1800000);

      // Parent already consumed by an earlier winner in the CAS step
      rthAdapter.insert({
        id: 'parent-req3b',
        userId: 'user-alice',
        token: 'hash-req3b-token',
        revoked: true, // Already consumed
        expiresAt: new Date(Date.now() + 100000),
        lastUsedAt: winnerDate,
      });

      const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });
      const updateLastUsedSpy = vi.spyOn(TokenRepository.prototype, 'updateLastUsed');
      const createRefreshTokenSpy = vi.spyOn(TokenRepository.prototype, 'createRefreshToken');
      const service = new TokenRefreshService(repo, mockTokenService, mockAuditService as any);

      // Loser attempts rotation on already-consumed token
      await expect(
        service.refresh('req3b-token', '192.0.2.30', undefined, 'user', 'realtutorialhub')
      ).rejects.toThrow(/invalid refresh token/i);

      // Loser performs zero metadata updates and zero child insertions
      expect(updateLastUsedSpy).toHaveBeenCalledTimes(0);
      expect(createRefreshTokenSpy).toHaveBeenCalledTimes(0);

      // Parent timestamp remains strictly untouched at winnerDate
      const parent = rthAdapter.findById('parent-req3b');
      expect(parent?.lastUsedAt?.getTime()).toBe(winnerDate.getTime());
      expect(parent?.revoked).toBe(true);

      // No child sessions created
      expect(rthAdapter.findAll()).toHaveLength(1);
    });

    it('REQ-4: child insertion failure rolls back parent consumption AND timestamp, preserving tenant isolation', async () => {
      const initialRthDate = new Date(Date.now() - 3600000);
      const initialSuiaDate = new Date(Date.now() - 7200000);

      // RTH session
      rthAdapter.insert({
        id: 'colliding-rollback-sess',
        userId: 'user-A',
        token: 'hash-rth-colliding',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
        lastUsedAt: initialRthDate,
      });

      // SUIA session with same ID and same user
      suiaAdapter.insert({
        id: 'colliding-rollback-sess',
        userId: 'user-A',
        token: 'hash-suia-colliding',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
        lastUsedAt: initialSuiaDate,
      });

      mockTokenService.verifyRefreshToken.mockResolvedValueOnce({
        userId: 'user-A',
        brand: 'realtutorialhub',
        isAdmin: false,
        tokenType: 'user',
      });

      // Force child creation to fail in RTH
      vi.spyOn(TokenRepository.prototype, 'createRefreshToken').mockRejectedValueOnce(new Error('Child insertion DB disk full'));

      const rthRepo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });
      const service = new TokenRefreshService(rthRepo, mockTokenService, mockAuditService as any);

      await expect(
        service.refresh('rth-colliding', '192.0.2.1', undefined, 'user', 'realtutorialhub')
      ).rejects.toThrow('Child insertion DB disk full');

      // In RTH: parent consumption AND timestamp rolled back
      const rthParent = rthAdapter.findById('colliding-rollback-sess');
      expect(rthParent?.revoked).toBe(false);
      expect(rthParent?.lastUsedAt?.getTime()).toBe(initialRthDate.getTime());

      // SUIA session remains completely unrevoked and untouched
      const suiaParent = suiaAdapter.findById('colliding-rollback-sess');
      expect(suiaParent?.revoked).toBe(false);
      expect(suiaParent?.lastUsedAt?.getTime()).toBe(initialSuiaDate.getTime());
    });

    it('PRE-FIX MUTATION PROOF: Pre-fix service with eager updateLastUsed updates parent metadata on signing failure, whereas fixed service does not', async () => {
      const fixedInitialDate = new Date(Date.now() - 5000000);
      const servicePath = path.resolve(__dirname, '../token-refresh.service.ts');
      const mutantPath = path.resolve(__dirname, '../.tmp-token-refresh.service.ts');

      // 1. Generate disposable actual-source mutant restoring deleted Step 2.8 at exact original location
      const prodSource = fs.readFileSync(servicePath, 'utf8');
      const targetAnchor = '    // 🔐 STEP 3: Generate new tokens (CPU-only, no DB)';
      expect(prodSource).toContain(targetAnchor);

      const mutantSource = prodSource.replace(
        targetAnchor,
        '    // 🔐 STEP 2.8: Pre-fix eager update\n    await brandTokenRepo.updateLastUsed(oldTokenHash);\n\n' + targetAnchor
      );
      fs.writeFileSync(mutantPath, mutantSource, 'utf8');

      try {
        // 2. Import actual-source mutant
        const { TokenRefreshService: MutantTokenRefreshService } = await import('../.tmp-token-refresh.service.ts');

        // Test mutant against signing failure
        rthAdapter.insert({
          id: 'parent-mutant-sess',
          userId: 'user-alice',
          token: 'hash-mutant-token',
          revoked: false,
          expiresAt: new Date(Date.now() + 100000),
          lastUsedAt: fixedInitialDate,
        });

        const repo = new TokenRepository(rthAdapter as any, { refreshTokens: rthTable as any });
        const mutantService = new MutantTokenRefreshService(repo, mockTokenService, mockAuditService as any);

        mockTokenService.generateAccessToken.mockRejectedValueOnce(new Error('Simulated Step 3 Signing Failure'));

        await expect(
          mutantService.refresh('mutant-token', '192.0.2.1', undefined, 'user', 'realtutorialhub')
        ).rejects.toThrow('Simulated Step 3 Signing Failure');

        // VULNERABILITY DEMONSTRATION: Pre-fix code updated lastUsedAt despite signing failure!
        const mutantParent = rthAdapter.findById('parent-mutant-sess');
        expect(mutantParent?.lastUsedAt?.getTime()).toBeGreaterThan(fixedInitialDate.getTime());
        // Prove failure of the unchanged-timestamp invariant under pre-fix code:
        expect(mutantParent?.lastUsedAt?.getTime() === fixedInitialDate.getTime()).toBe(false);

        // 3. Run against Production Fixed Service under identical conditions
        rthAdapter.insert({
          id: 'parent-fixed-sess',
          userId: 'user-alice',
          token: 'hash-fixed-token',
          revoked: false,
          expiresAt: new Date(Date.now() + 100000),
          lastUsedAt: fixedInitialDate,
        });

        mockTokenService.generateAccessToken.mockRejectedValueOnce(new Error('Simulated Step 3 Signing Failure'));
        const fixedService = new TokenRefreshService(repo, mockTokenService, mockAuditService as any);

        await expect(
          fixedService.refresh('fixed-token', '192.0.2.1', undefined, 'user', 'realtutorialhub')
        ).rejects.toThrow('Simulated Step 3 Signing Failure');

        // FIX VERIFICATION: Fixed service leaves parent lastUsedAt completely untouched!
        const fixedParent = rthAdapter.findById('parent-fixed-sess');
        expect(fixedParent?.lastUsedAt?.getTime()).toBe(fixedInitialDate.getTime());
      } finally {
        if (fs.existsSync(mutantPath)) {
          fs.unlinkSync(mutantPath);
        }
      }
    });
    afterAll(() => {
    const mutantPath = path.resolve(__dirname, '../.tmp-token-refresh.service.ts');
    if (fs.existsSync(mutantPath)) {
      fs.unlinkSync(mutantPath);
    }
  });

});

});
