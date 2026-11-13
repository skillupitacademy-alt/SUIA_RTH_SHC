import { describe, expect, it, vi } from 'vitest';
import { PgDialect, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { platformAccess, users, type DbClient } from '@quiz/db-people';
import { IdentityBridgeError, UserIdentityBridgeService } from '../UserIdentityBridgeService';

const learnerId = '11111111-1111-4111-8111-111111111111';
const personId = '22222222-2222-4222-8222-222222222222';
const otherId = '33333333-3333-4333-8333-333333333333';
const input = { externalId: learnerId, externalBrand: 'skillup' as const, platform: 'skillup' as const, email: ' Learner@Example.test ' };
type Row = Record<string, unknown>;

// Transactional adapter models unique constraints and rollback, with serialized
// commits. PostgreSQL lock scheduling and failure semantics require physical tests.
function fixture() {
  const state = { people: [] as Row[], grants: [] as Row[], failGrant: false, transactions: 0 };
  const calls: Array<{ operation: string; sql?: string; params?: unknown[] }> = [];
  const compile = (condition: SQL) => new PgDialect().sqlToQuery(condition);
  const field = (name: string) => name.replace(/_([a-z])/g, (_m, letter: string) => letter.toUpperCase());
  const matching = (rows: Row[], condition: SQL) => {
    const query = compile(condition);
    calls.push({ operation: 'predicate', sql: query.sql, params: query.params });
    const equalities = [...query.sql.matchAll(/"[^"]+"\."([^"]+)" = \$(\d+)/g)];
    const nulls = [...query.sql.matchAll(/"[^"]+"\."([^"]+)" is null/gi)];
    return rows.filter(row => equalities.every(match => row[field(match[1])] === query.params[Number(match[2]) - 1])
      && nulls.every(match => row[field(match[1])] === null));
  };
  const rowsFor = (table: unknown) => table === users ? state.people : state.grants;
  let tail: Promise<unknown> = Promise.resolve();
  const database = {
    transaction: async <T>(callback: (transaction: unknown) => Promise<T>) => {
      const previous = tail;
      let release!: () => void;
      tail = new Promise<void>(resolve => { release = resolve; });
      await previous;
      const snapshot = structuredClone({ people: state.people, grants: state.grants });
      state.transactions++;
      try { return await callback(database); }
      catch (error) { state.people = snapshot.people; state.grants = snapshot.grants; throw error; }
      finally { release(); }
    },
    select: () => ({ from: (table: unknown) => ({ where: (condition: SQL) => ({ limit: (count: number) => {
      const result = matching(rowsFor(table), condition).slice(0, count);
      return { then: (resolve: (value: Row[]) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(result).then(resolve, reject), for: async () => result };
    } }) }) }),
    insert: (table: unknown) => ({ values: (value: Row) => {
      let resolved: Row[] | undefined;
      const execute = () => {
        if (resolved !== undefined) return resolved;
        if (table === platformAccess && state.failGrant) throw new Error('injected private connection detail');
        if (table === users) {
          const collision = state.people.some(row => (row.externalId === value.externalId && row.platform === value.platform)
            || (row.deletedAt === null && row.platform === value.platform && String(row.email).trim().toLowerCase() === String(value.email).trim().toLowerCase()));
          if (collision) return resolved = [];
          const row = { deletedAt: null, isActive: true, ...value };
          state.people.push(row);
          return resolved = [row];
        }
        if (state.grants.some(row => row.userId === value.userId && row.platform === value.platform)) return resolved = [];
        const row = { deletedAt: null, ...value };
        state.grants.push(row);
        return resolved = [row];
      };
      const builder = {
        returning: async () => execute(),
        then: (resolve: (value: Row[]) => unknown, reject: (error: unknown) => unknown) => Promise.resolve().then(execute).then(resolve, reject),
        onConflictDoNothing: () => builder,
      };
      calls.push({ operation: table === users ? 'insert-person' : 'insert-grant' });
      return builder;
    } }),
    update: (table: unknown) => ({ set: (patch: Row) => ({ where: (condition: SQL) => {
      const rows = matching(rowsFor(table), condition);
      rows.forEach(row => Object.assign(row, patch));
      return Promise.resolve(rows);
    } }) }),
  };
  const seedPerson = (patch: Row = {}) => state.people.push({ id: personId, externalId: learnerId, platform: 'skillup', email: 'learner@example.test', isActive: true, deletedAt: null, role: 'student', passwordHash: 'existing-credential', ...patch });
  const seedGrant = (patch: Row = {}) => state.grants.push({ userId: personId, platform: 'skillup', deletedAt: null, ...patch });
  const service = new UserIdentityBridgeService(database as unknown as DbClient);
  return { state, calls, database, service, seedPerson, seedGrant };
}

describe('identity bridge current contract', () => {
  it('creates a distinct person and its own grant atomically with normalized email', async () => {
    const f = fixture();
    const result = await f.service.syncUser(input);
    expect(result.created).toBe(true);
    expect(result.shadowUserId).not.toBe(learnerId);
    expect(f.state.people[0]).toMatchObject({ id: result.shadowUserId, externalId: learnerId, email: 'learner@example.test', platform: 'skillup' });
    expect(f.state.grants).toEqual([{ userId: result.shadowUserId, platform: 'skillup', deletedAt: null }]);
    expect(f.state.transactions).toBe(1);
  });

  it('reuses the same person and grant on repeated sync without replacing credentials or roles', async () => {
    const f = fixture(); f.seedPerson(); f.seedGrant();
    const first = await f.service.syncUser({ ...input, role: 'super_admin' });
    const second = await f.service.syncUser(input);
    expect(first).toEqual({ shadowUserId: personId, created: false });
    expect(second).toEqual(first);
    expect(f.state.people).toHaveLength(1); expect(f.state.grants).toHaveLength(1);
    expect(f.state.people[0]).toMatchObject({ passwordHash: 'existing-credential', role: 'student' });
  });

  it('concurrent requests converge on a single existing-key projection and grant', async () => {
    const f = fixture();
    const results = await Promise.all([f.service.syncUser(input), f.service.syncUser(input), f.service.syncUser(input)]);
    expect(new Set(results.map(result => result.shadowUserId)).size).toBe(1);
    expect(results.filter(result => result.created)).toHaveLength(1);
    expect(f.state.people).toHaveLength(1); expect(f.state.grants).toHaveLength(1);
  });

  it('rolls back person creation on access failure and recovers on a subsequent invocation', async () => {
    const f = fixture(); f.state.failGrant = true;
    await expect(f.service.syncUser(input)).rejects.toMatchObject({ code: 'PROJECTION_UNAVAILABLE', message: 'Identity reconciliation could not be completed' });
    expect(f.state.people).toHaveLength(0); expect(f.state.grants).toHaveLength(0);
    f.state.failGrant = false;
    expect((await f.service.syncUser(input)).created).toBe(true);
    expect(f.state.people).toHaveLength(1); expect(f.state.grants).toHaveLength(1);
  });

  it('repairs a prior missing own-platform grant under the canonical source identity', async () => {
    const f = fixture(); f.seedPerson();
    expect((await f.service.syncUser(input)).shadowUserId).toBe(personId);
    expect(f.state.grants).toHaveLength(1);
    await f.service.grantPlatformAccess(personId, 'skillup', input);
    expect(f.state.grants).toHaveLength(1);
  });

  it('preserves revocation and rolls back email changes for a deleted grant', async () => {
    const f = fixture(); f.seedPerson(); f.seedGrant({ deletedAt: new Date() });
    await expect(f.service.syncUser({ ...input, email: 'updated@example.test' })).rejects.toMatchObject({ code: 'ACCESS_REVOKED' });
    expect(f.state.people[0].email).toBe('learner@example.test');
    expect(f.state.grants[0].deletedAt).toBeInstanceOf(Date);
  });

  it.each([{ deletedAt: new Date() }, { isActive: false }])('denies deleted or disabled projections', async patch => {
    const f = fixture(); f.seedPerson(patch);
    await expect(f.service.syncUser(input)).rejects.toBeInstanceOf(IdentityBridgeError);
    expect(f.state.people).toHaveLength(1); expect(f.state.grants).toHaveLength(0);
  });

  it('keeps same-email accounts independent across brands', async () => {
    const f = fixture(); f.seedPerson(); f.seedGrant();
    const rth = await f.service.syncUser({ ...input, externalBrand: 'realtutorialhub', platform: 'realtutorialhub', externalId: otherId });
    expect(rth.shadowUserId).not.toBe(personId);
    expect(f.state.people).toHaveLength(2); expect(f.state.grants).toHaveLength(2);
  });

  it('never merges another same-platform external identity by normalized email', async () => {
    const f = fixture(); f.seedPerson();
    await expect(f.service.syncUser({ ...input, externalId: otherId })).rejects.toBeInstanceOf(IdentityBridgeError);
    expect(f.state.people).toHaveLength(1); expect(f.state.grants).toHaveLength(0);
  });

  it('rejects conflicting existing shadow links before committing changes', async () => {
    const f = fixture(); f.seedPerson();
    await expect(f.service.syncUser({ ...input, expectedShadowUserId: otherId })).rejects.toMatchObject({ code: 'SHADOW_LINK_CONFLICT' });
    expect(f.state.people).toHaveLength(1); expect(f.state.grants).toHaveLength(0);
  });

  it('rejects mismatched authority without persistence access', async () => {
    const f = fixture();
    await expect(f.service.syncUser({ ...input, externalBrand: 'realtutorialhub' })).rejects.toBeInstanceOf(IdentityBridgeError);
    await expect(f.service.grantPlatformAccess(personId, 'realtutorialhub', input)).rejects.toBeInstanceOf(IdentityBridgeError);
    expect(f.state.transactions).toBe(0);
  });

  it('denies a grant for another person or external account', async () => {
    const f = fixture(); f.seedPerson();
    await expect(f.service.grantPlatformAccess(otherId, 'skillup', input)).rejects.toBeInstanceOf(IdentityBridgeError);
    await expect(f.service.grantPlatformAccess(personId, 'skillup', { ...input, externalId: otherId })).rejects.toBeInstanceOf(IdentityBridgeError);
    expect(f.state.grants).toHaveLength(0);
  });

  it('lookup returns only the active exact brand-local mapping', async () => {
    const f = fixture(); f.seedPerson();
    expect(await f.service.getShadowUserId(learnerId, 'skillup')).toBe(personId);
    expect(await f.service.getShadowUserId(learnerId, 'realtutorialhub')).toBeNull();
  });

  it('binds a brand link conditionally and retains a committed projection after link outage', async () => {
    const f = fixture(); f.seedPerson(); f.seedGrant();
    const table = pgTable('brand_users', { id: uuid('id'), shadowUserId: uuid('shadow_user_id'), deletedAt: timestamp('deleted_at') });
    const returning = vi.fn(async () => [{ id: learnerId }]);
    const where = vi.fn((condition: SQL) => { expect(condition).toBeDefined(); return { returning }; });
    const database = { update: vi.fn(() => ({ set: vi.fn(() => ({ where })) })) };
    await f.service.updateShadowUserId(database as unknown as Pick<DbClient, 'update'>, table, learnerId, personId, 'skillup');
    const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toContain('"shadow_user_id" is null or');
    expect(query.sql).toContain('"deleted_at" is null');
    expect(query.params).toEqual([learnerId, personId]);
    returning.mockRejectedValueOnce(new Error('private brand database error'));
    await expect(f.service.updateShadowUserId(database as unknown as Pick<DbClient, 'update'>, table, learnerId, personId, 'skillup')).rejects.toMatchObject({ code: 'PROJECTION_UNAVAILABLE' });
    expect(f.state.people).toHaveLength(1); expect(f.state.grants).toHaveLength(1);
    expect((await f.service.syncUser(input)).shadowUserId).toBe(personId);
    returning.mockResolvedValueOnce([]);
    await expect(f.service.updateShadowUserId(database as unknown as Pick<DbClient, 'update'>, table, learnerId, personId, 'skillup')).rejects.toMatchObject({ code: 'SHADOW_LINK_CONFLICT' });
  });
});
