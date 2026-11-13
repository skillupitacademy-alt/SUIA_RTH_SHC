import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
const h = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('../db', () => ({ db: { execute: h.execute } }));
vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(async () => 'synthetic-test-hash') } }));
import { upsertUser } from '../seed-skillup';
const account = { email: ' Learner@Example.test ', password: 'synthetic-input', name: 'Fixture', role: 'student' as const, platform: 'skillup' as const };
const query = (index: number) => new PgDialect().sqlToQuery(h.execute.mock.calls[index][0] as SQL);

describe('PeopleDB seed account conflict contract', () => {
  beforeEach(() => vi.clearAllMocks());
  it('uses the normalized expression and partial predicate with parameterized values', async () => {
    h.execute.mockResolvedValueOnce({ rows: [{ id: '22222222-2222-4222-8222-222222222222' }] });
    expect(await upsertUser(account)).toBe('22222222-2222-4222-8222-222222222222');
    const insert = query(0);
    expect(insert.sql).toContain('ON CONFLICT (lower(trim(email)), platform) WHERE deleted_at IS NULL');
    expect(insert.sql).toContain('DO NOTHING');
    expect(insert.sql).not.toContain('DO UPDATE');
    expect(insert.params).toEqual(['learner@example.test', 'synthetic-test-hash', 'student', 'skillup']);
    expect(h.execute).toHaveBeenCalledTimes(1);
  });
  it('retains existing credentials and activity state by reading the selected active platform account', async () => {
    h.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ id: 'existing-suia' }] });
    expect(await upsertUser(account)).toBe('existing-suia');
    const select = query(1);
    expect(select.sql).toContain('lower(trim(email)) =');
    expect(select.sql).toContain('platform =');
    expect(select.sql).toContain('deleted_at IS NULL AND is_active = true');
    expect(select.params).toEqual(['learner@example.test', 'skillup']);
    expect(select.sql).not.toContain('UPDATE');
  });
  it.each([{ rows: [] }, { rows: [{ id: 'one' }, { id: 'two' }] }])('fails closed for an absent or ambiguous active seed account', async ({ rows }) => {
    h.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows });
    await expect(upsertUser(account)).rejects.toThrow('A unique active seed account is required');
  });
  it('propagates a missing-index or legacy-global-constraint failure without fallback writes', async () => {
    h.execute.mockRejectedValueOnce(new Error('controlled index unavailable'));
    await expect(upsertUser(account)).rejects.toThrow('controlled index unavailable');
    expect(h.execute).toHaveBeenCalledTimes(1);
  });
});
