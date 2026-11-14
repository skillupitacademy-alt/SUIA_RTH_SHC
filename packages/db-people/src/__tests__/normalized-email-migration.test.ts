import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { preparePeopleMigrations } from '../migration-compatibility';

const folder = path.resolve(__dirname, '../../migrations');
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(folder, file), 'utf8'));

describe('Registered platform-qualified email migration', () => {
  it('appends after student invitations through the supported migration reader', () => {
    const migrations = preparePeopleMigrations(folder);
    const prior = migrations[migrations.length - 2];
    const latest = migrations[migrations.length - 1];
    expect(prior.tag).toBe('0009_student_invitations');
    expect(latest.tag).toBe('0010_normalized_platform_email');
    expect(latest.folderMillis).toBeGreaterThan(prior.folderMillis);
    expect(latest.sql).toHaveLength(2);
    expect(latest.originalHash).toMatch(/^[a-f0-9]{64}$/);
  });
  it('retains the historical snapshot and updates only email uniqueness metadata', () => {
    const before = read('meta/0009_snapshot.json');
    const after = read('meta/0010_snapshot.json');
    expect(after.prevId).toBe(before.id);
    expect(after.id).not.toBe(before.id);
    const users = after.tables['public.users'];
    expect(users.uniqueConstraints.users_email_unique).toBeUndefined();
    expect(users.indexes.uniq_users_email_platform).toMatchObject({
      isUnique: true, method: 'btree', where: '"users"."deleted_at" IS NULL',
    });
    expect(users.indexes.uniq_users_email_platform.columns).toEqual([
      { expression: 'LOWER(TRIM("users"."email"))', isExpression: true, asc: true, nulls: 'last' },
      { expression: 'platform', isExpression: false, asc: true, nulls: 'last' },
    ]);
    const restored = structuredClone(after);
    restored.id = before.id; restored.prevId = before.prevId;
    restored.tables['public.users'].uniqueConstraints.users_email_unique = before.tables['public.users'].uniqueConstraints.users_email_unique;
    delete restored.tables['public.users'].indexes.uniq_users_email_platform;
    expect(restored).toEqual(before);
  });
});
