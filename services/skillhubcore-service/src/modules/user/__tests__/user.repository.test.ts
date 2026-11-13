import { describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

vi.mock('@/lib/db', async () => ({
  db: {},
  schema: await import('../../../../../../packages/db-people/src/schema'),
}));
vi.mock('@quiz/db', () => ({
  withTimeout: async <T>(result: Promise<T>) => result,
  STANDARD_QUERY_TIMEOUT: 100,
}));

import { DrizzleUserRepository } from '../user.repository';

const createRepository = (rows: unknown[]) => {
  const limit = vi.fn(async (_count: number) => rows);
  const where = vi.fn((_predicate: SQL) => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const returning = vi.fn(async () => rows);
  const values = vi.fn((_input: unknown) => ({ returning }));
  const insert = vi.fn(() => ({ values }));
  const database = { select, insert };
  return {
    repository: new DrizzleUserRepository(database as unknown as ConstructorParameters<typeof DrizzleUserRepository>[0]),
    where,
    limit,
    values,
  };
};

describe('PeopleDB email selection SQL', () => {
  it.each(['skillup', 'realtutorialhub'] as const)('normalizes email and requires exact %s scope and undeleted rows', async (platform) => {
    const { repository, where, limit } = createRepository([]);
    await repository.findByEmail(' Shared@Example.COM ', platform);
    const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toContain('LOWER(TRIM("users"."email"))');
    expect(query.sql).toContain('"users"."platform" =');
    expect(query.sql).toContain('"users"."deleted_at" is null');
    expect(query.params).toEqual(['shared@example.com', platform]);
    expect(limit).toHaveBeenCalledWith(2);
  });

  it('limits legacy admin selection to the two supported business platforms', async () => {
    const { repository, where } = createRepository([]);
    await repository.findByEmail('shared@example.com');
    const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toContain('"users"."platform" in');
    expect(query.params).toEqual(['shared@example.com', 'skillup', 'realtutorialhub']);
  });

  it.each([undefined, 'skillup'] as const)('rejects duplicate matches for scope %s', async (platform) => {
    const { repository } = createRepository([{ id: 'first' }, { id: 'second' }]);
    await expect(repository.findByEmail('shared@example.com', platform)).rejects.toThrow('Invalid credentials');
  });

  it('returns the single match and propagates unavailable persistence', async () => {
    const { repository, limit } = createRepository([{ id: 'selected' }]);
    await expect(repository.findByEmail('shared@example.com', 'skillup')).resolves.toEqual({ id: 'selected' });
    limit.mockRejectedValueOnce(new Error('Persistence unavailable'));
    await expect(repository.findByEmail('shared@example.com', 'skillup')).rejects.toThrow('Persistence unavailable');
  });

  it('normalizes user creation without changing its platform', async () => {
    const { repository, values } = createRepository([{ id: 'created' }]);
    await repository.createUser({ email: ' Shared@Example.COM ', passwordHash: 'synthetic-hash', role: 'student', platform: 'skillup' });
    expect(values).toHaveBeenCalledWith({ email: 'shared@example.com', passwordHash: 'synthetic-hash', role: 'student', platform: 'skillup' });
  });
});
