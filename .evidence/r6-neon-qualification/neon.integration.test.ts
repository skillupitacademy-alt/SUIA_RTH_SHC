import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgSchema, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
vi.mock('@quiz/db', () => ({ withTimeout: async (promise: Promise<unknown>) => promise, STANDARD_QUERY_TIMEOUT: 10000 }));
vi.mock('../../packages/identity-bridge/src/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
import { schema, users, platformAccess } from '../../packages/db-people/src/schema';
import type { DbClient } from '../../packages/db-people/src/db';
import { UserIdentityBridgeService } from '../../packages/identity-bridge/src/UserIdentityBridgeService';
import { DrizzleUserRepository } from '../../services/skillhubcore-service/src/modules/user/user.repository';
import { SsoService } from '../../services/skillhubcore-service/src/modules/auth/sso/sso.service';
const evidence = path.resolve('.evidence/r6-neon-qualification');
const url = process.env.R6_NEON_TEST_URL;
if (!url)
    throw new Error('Explicit test connection required');
const endpoint = new URL(url);
if (endpoint.hostname !== 'ep-fragrant-brook-a1mhx5dm-pooler.ap-southeast-1.aws.neon.tech' || endpoint.pathname !== '/people_prod')
    throw new Error('Test target not allowlisted');
const pool = new Pool({ connectionString: url, max: 6, connectionTimeoutMillis: 15000, statement_timeout: 15000, application_name: 'r6b-synthetic-qualification' });
const database = drizzle(pool, { schema });
// The production bridge is parameterized by Drizzle's Neon driver type. This test
// supplies its PostgreSQL driver implementation and executes the same SQL/transactions.
const bridge = new UserIdentityBridgeService(database as unknown as DbClient);
const repository = new DrizzleUserRepository(database as unknown as DbClient);
const sso = new SsoService(repository);
const run = 'r6b_' + crypto.randomBytes(5).toString('hex');
const skillupSchema = run + '_skillup';
const rthSchema = run + '_rth';
const brandTables = {
    skillup: pgSchema(skillupSchema).table('users', { id: uuid('id').primaryKey(), shadowUserId: uuid('shadow_user_id'), deletedAt: timestamp('deleted_at') }),
    realtutorialhub: pgSchema(rthSchema).table('users', { id: uuid('id').primaryKey(), shadowUserId: uuid('shadow_user_id'), deletedAt: timestamp('deleted_at') }),
};
const receipts: Array<Record<string, unknown>> = [];
let baselineDigest: string;
let migrated = false;
let initialLedger: Array<Record<string, unknown>>;
function save() { fs.writeFileSync(path.join(evidence, 'POSTGRESQL_SCENARIOS.json'), JSON.stringify({ run, target: { projectId: 'bitter-tree-18287476', branchId: 'br-young-silence-a1b1ta26', database: 'people_prod', endpoint: endpoint.hostname }, receipts }, null, 2)); }
async function verifyTarget() {
    const row = (await pool.query(`SELECT current_database() AS database, current_setting('neon.branch_id') AS branch, current_setting('neon.project_id') AS project, current_setting('neon.endpoint_id') AS endpoint`)).rows[0];
    expect(row).toEqual({ database: 'people_prod', branch: 'br-young-silence-a1b1ta26', project: 'bitter-tree-18287476', endpoint: 'ep-fragrant-brook-a1mhx5dm' });
}
async function scenario(name: string, body: () => Promise<unknown>) {
    await verifyTarget();
    const started = new Date().toISOString();
    try {
        const detail = await body();
        receipts.push({ name, result: 'PASS', started, finished: new Date().toISOString(), detail });
    }
    catch (error) {
        receipts.push({ name, result: 'FAIL', started, finished: new Date().toISOString(), error: { name: error instanceof Error ? error.name : 'Unknown', code: typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined, message: error instanceof Error ? error.message.replaceAll(url!, '[REDACTED]') : 'Failure' } });
        throw error;
    }
    finally {
        save();
    }
}
function identity(label: string, platform: 'skillup' | 'realtutorialhub' = 'skillup', email = `${run}_${label}@example.invalid`) { return { externalId: crypto.randomUUID(), externalBrand: platform, platform, email }; }
async function createPerson(label: string, platform: 'skillup' | 'realtutorialhub' = 'skillup', role = 'student') {
    const id = crypto.randomUUID();
    await pool.query('INSERT INTO users(id,email,password_hash,role,platform) VALUES($1,$2,$3,$4,$5)', [id, `${run}_${label}@example.invalid`, 'synthetic-inert-no-login', role, platform]);
    return id;
}
async function ownGrant(id: string, platform = 'skillup') { await pool.query('INSERT INTO platform_access(user_id,platform) VALUES($1,$2)', [id, platform]); }
beforeAll(async () => {
    await verifyTarget();
    const digest = await pool.query(`SELECT md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'')) AS digest FROM users u`);
    baselineDigest = digest.rows[0].digest;
    initialLedger = (await pool.query('SELECT id,hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
    const journal = JSON.parse(fs.readFileSync('packages/db-people/migrations/meta/_journal.json', 'utf8'));
    const hashes = journal.entries.map((entry: {
        tag: string;
        when: number;
    }) => ({ tag: entry.tag, when: entry.when, hash: crypto.createHash('sha256').update(fs.readFileSync(`packages/db-people/migrations/${entry.tag}.sql`)).digest('hex') }));
    const comparisons = initialLedger.map(row => ({ ...row, matchingFiles: hashes.filter((file: {
            hash: string;
        }) => file.hash === row.hash).map((file: {
            tag: string;
        }) => file.tag) }));
    expect(comparisons.every(row => row.matchingFiles.length === 1)).toBe(true);
    expect((await pool.query("SELECT to_regclass('public.student_invitations') AS relation")).rows[0].relation).toBeNull();
    fs.writeFileSync(path.join(evidence, 'MIGRATION_BASELINE.json'), JSON.stringify({ initialLedger, hashes, comparisons, baselineDigest }, null, 2));
    // Synthetic brand fixtures use schema-qualified tables on the verified branch.
    await pool.query(`CREATE SCHEMA "${skillupSchema}"; CREATE SCHEMA "${rthSchema}"; CREATE TABLE "${skillupSchema}".users(id uuid PRIMARY KEY, shadow_user_id uuid, deleted_at timestamp); CREATE TABLE "${rthSchema}".users(id uuid PRIMARY KEY, shadow_user_id uuid, deleted_at timestamp)`);
}, 120000);
describe.sequential('R6-B real PostgreSQL qualification on verified disposable Neon branch', () => {
    it('01 reproduces old global email uniqueness with SQLSTATE 23505', () => scenario('01 global email constraint', async () => {
        const email = `${run}_same@example.invalid`;
        const id = await createPerson('same');
        await expect(pool.query('INSERT INTO users(email,password_hash,platform) VALUES($1,$2,$3)', [email, 'synthetic-inert', 'realtutorialhub'])).rejects.toMatchObject({ code: '23505', constraint: 'users_email_unique' });
        return { SQLSTATE: '23505', constraint: 'users_email_unique', syntheticId: id };
    }));
    it('02 rehearses 0009 followed by candidate uniqueness with rollback and actual ledger', () => scenario('02 migration order and candidate index', async () => {
        const duplicateGroups = (await pool.query('SELECT count(*)::int AS count FROM (SELECT 1 FROM users WHERE deleted_at IS NULL GROUP BY lower(trim(email)),platform HAVING count(*) > 1) d')).rows[0].count;
        expect(duplicateGroups).toBe(0);
        const migration9 = fs.readFileSync('packages/db-people/migrations/0009_student_invitations.sql', 'utf8');
        const hash9 = crypto.createHash('sha256').update(migration9).digest('hex');
        const candidate = 'CREATE UNIQUE INDEX uniq_users_email_platform ON public.users (LOWER(TRIM(email)), platform) WHERE deleted_at IS NULL; ALTER TABLE public.users DROP CONSTRAINT users_email_unique;';
        fs.writeFileSync(path.join(evidence, 'CANDIDATE_UNIQUENESS_REHEARSAL.sql'), candidate);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query("SET LOCAL lock_timeout='3s'");
            await client.query(candidate);
            await expect(client.query('SELECT 1/0')).rejects.toMatchObject({ code: '22012' });
            await client.query('ROLLBACK');
            expect((await client.query("SELECT count(*)::int AS count FROM pg_constraint WHERE conrelid='users'::regclass AND conname='users_email_unique'")).rows[0].count).toBe(1);
            expect((await client.query("SELECT to_regclass('public.uniq_users_email_platform') AS relation")).rows[0].relation).toBeNull();
            await client.query('BEGIN');
            await client.query(migration9.replaceAll('--> statement-breakpoint', ''));
            await client.query('INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES($1,$2)', [hash9, 1791600000000]);
            await client.query(candidate);
            await client.query('INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES($1,$2)', [crypto.createHash('sha256').update(candidate).digest('hex'), 1794618000000]);
            await client.query('COMMIT');
            migrated = true;
        }
        finally {
            await client.query('ROLLBACK').catch(() => { });
            client.release();
        }
        const ledger = (await pool.query('SELECT id,hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
        expect(ledger.length).toBe(initialLedger.length + 2);
        expect(ledger.slice(0, initialLedger.length)).toEqual(initialLedger);
        const indexes = (await pool.query("SELECT indexname,indexdef FROM pg_indexes WHERE tablename='users' ORDER BY indexname")).rows;
        fs.writeFileSync(path.join(evidence, 'MIGRATION_AFTER.json'), JSON.stringify({ ledger, indexes, mode: 'Explicit transactional rehearsal with unmodified 0009 SQL and append-only isolated test candidate receipt; normal application migration runner not exercised' }, null, 2));
        return { duplicateGroups, migration9AppliedBeforeCandidate: true, failedDdlTransactionRolledBack: true, SQLSTATE: '22012', originalLedgerRowsPreserved: true };
    }));
    it('03 preserves same-email separate-brand identities and normalized duplicate denial', () => scenario('03 independent same-email identities', async () => {
        expect(migrated).toBe(true);
        const email = `${run}_dual@example.invalid`;
        const a = identity('dual', 'skillup', '  ' + email.toUpperCase() + '  ');
        const b = identity('dual', 'realtutorialhub', email);
        const [pa, pb] = await Promise.all([bridge.syncUser(a), bridge.syncUser(b)]);
        expect(pa.shadowUserId).not.toBe(pb.shadowUserId);
        expect(pa.shadowUserId).not.toBe(a.externalId);
        expect(pb.shadowUserId).not.toBe(b.externalId);
        expect((await repository.findByEmail(email, 'skillup'))?.id).toBe(pa.shadowUserId);
        expect((await repository.findByEmail(email, 'realtutorialhub'))?.id).toBe(pb.shadowUserId);
        await expect(repository.findByEmail(email)).rejects.toThrow('Invalid credentials');
        await expect(pool.query('INSERT INTO users(email,password_hash,platform) VALUES($1,$2,$3)', [' ' + email.toUpperCase() + ' ', 'synthetic', 'skillup'])).rejects.toMatchObject({ code: '23505', constraint: 'uniq_users_email_platform' });
        return { independentPeopleUuids: true, independentLocalUuids: true, ambiguousSelectionDenied: true, normalizedConflictSQLSTATE: '23505' };
    }));
    it('04 reconciles eight concurrent requests and repeated retries to one projection and grant', () => scenario('04 bridge concurrency and retry', async () => {
        const input = identity('concurrent');
        const results = await Promise.all(Array.from({ length: 8 }, () => bridge.syncUser(input)));
        expect(new Set(results.map(row => row.shadowUserId)).size).toBe(1);
        expect(results.filter(row => row.created)).lengthOf(1);
        const repeat = await bridge.syncUser(input);
        expect(repeat.created).toBe(false);
        expect((await pool.query('SELECT count(*)::int AS count FROM users WHERE external_id=$1 AND platform=$2', [input.externalId, input.platform])).rows[0].count).toBe(1);
        expect((await pool.query('SELECT count(*)::int AS count FROM platform_access WHERE user_id=$1', [repeat.shadowUserId])).rows[0].count).toBe(1);
        return { parallelRequests: 8, people: 1, grants: 1 };
    }));
    it('05 repairs authorized missing own-platform access and preserves revocations', () => scenario('05 grant recovery and revocation', async () => {
        const input = identity('grant');
        const person = await bridge.syncUser(input);
        await pool.query('DELETE FROM platform_access WHERE user_id=$1', [person.shadowUserId]);
        await bridge.syncUser({ ...input, expectedShadowUserId: person.shadowUserId });
        expect((await pool.query('SELECT count(*)::int AS count FROM platform_access WHERE user_id=$1 AND deleted_at IS NULL', [person.shadowUserId])).rows[0].count).toBe(1);
        await pool.query('UPDATE platform_access SET deleted_at=now() WHERE user_id=$1', [person.shadowUserId]);
        await expect(bridge.syncUser(input)).rejects.toMatchObject({ code: 'ACCESS_REVOKED' });
        await expect(bridge.grantPlatformAccess(person.shadowUserId, 'realtutorialhub', { externalId: input.externalId, externalBrand: 'skillup' })).rejects.toMatchObject({ code: 'IDENTITY_CONFLICT' });
        expect((await pool.query('SELECT count(*)::int AS count FROM platform_access WHERE user_id=$1 AND deleted_at IS NULL', [person.shadowUserId])).rows[0].count).toBe(0);
        return { authorizedMissingGrantRepaired: true, softDeletedGrantPreserved: true, crossBrandDenied: true, hardDeletedGrantHistory: 'Absence cannot distinguish interrupted creation from intentional hard deletion; existing approved reconciliation authority remains a required operating contract' };
    }));
    it('06 rolls back interrupted projection and handles shadow conflicts and brand-link failure', () => scenario('06 partial failures and linking', async () => {
        const input = identity('interrupted');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('INSERT INTO users(id,email,password_hash,platform,external_id) VALUES($1,$2,$3,$4,$5)', [crypto.randomUUID(), input.email, 'synthetic', 'skillup', input.externalId]);
            await client.query('ROLLBACK');
        }
        finally {
            client.release();
        }
        expect((await pool.query('SELECT count(*)::int AS count FROM users WHERE external_id=$1', [input.externalId])).rows[0].count).toBe(0);
        const person = await bridge.syncUser(input);
        await pool.query(`INSERT INTO "${skillupSchema}".users(id) VALUES($1)`, [input.externalId]);
        await bridge.updateShadowUserId(database as unknown as DbClient, brandTables.skillup, input.externalId, person.shadowUserId, 'skillup');
        const wrong = crypto.randomUUID();
        await pool.query(`UPDATE "${skillupSchema}".users SET shadow_user_id=$1 WHERE id=$2`, [wrong, input.externalId]);
        await expect(bridge.updateShadowUserId(database as unknown as DbClient, brandTables.skillup, input.externalId, person.shadowUserId, 'skillup')).rejects.toMatchObject({ code: 'SHADOW_LINK_CONFLICT' });
        await expect(bridge.syncUser({ ...input, expectedShadowUserId: wrong })).rejects.toMatchObject({ code: 'SHADOW_LINK_CONFLICT' });
        expect((await pool.query(`SELECT shadow_user_id FROM "${skillupSchema}".users WHERE id=$1`, [input.externalId])).rows[0].shadow_user_id).toBe(wrong);
        const rth = identity('rth_link', 'realtutorialhub');
        const rp = await bridge.syncUser(rth);
        await expect(bridge.updateShadowUserId(database as unknown as DbClient, brandTables.realtutorialhub, rth.externalId, rp.shadowUserId, 'realtutorialhub')).rejects.toMatchObject({ code: 'SHADOW_LINK_CONFLICT' });
        await pool.query(`INSERT INTO "${rthSchema}".users(id) VALUES($1)`, [rth.externalId]);
        await bridge.updateShadowUserId(database as unknown as DbClient, brandTables.realtutorialhub, rth.externalId, rp.shadowUserId, 'realtutorialhub');
        return { rollbackObserved: true, conflictingLinkRetained: true, peopleCommitRetainedAfterBrandFailure: true, conditionalBrandRetryPassed: true, isolation: 'Two schema-qualified synthetic brand fixture stores on the verified disposable branch; separate database/server outages not qualified' };
    }));
    it('07 enforces real administrative permissions, locks, timeout and transactional audit failure', () => scenario('07 SSO authorization locks and audit rollback', async () => {
        const admin = await createPerson('admin', 'skillup', 'admin');
        const target = await createPerson('target');
        const foreign = await createPerson('foreign', 'realtutorialhub');
        await ownGrant(admin);
        const actor = { shadowUserId: admin, roles: ['admin' as const], platforms: ['skillup' as const] };
        expect(await sso.administerAccess(actor, target, 'grant', 'skillup')).toEqual(['skillup']);
        await expect(sso.administerAccess(actor, foreign, 'grant', 'realtutorialhub')).rejects.toMatchObject({ status: 403 });
        await expect(sso.administerAccess({ ...actor, roles: ['student'] }, target, 'revoke', 'skillup')).rejects.toMatchObject({ status: 403 });
        const locker = await pool.connect();
        const contender = await pool.connect();
        try {
            await locker.query('BEGIN');
            await locker.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [target]);
            await contender.query('BEGIN');
            await contender.query("SET LOCAL lock_timeout='150ms'");
            await expect(contender.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [target])).rejects.toMatchObject({ code: '55P03' });
            await contender.query('ROLLBACK');
            await locker.query('ROLLBACK');
        }
        finally {
            await locker.query('ROLLBACK').catch(() => { });
            await contender.query('ROLLBACK').catch(() => { });
            locker.release();
            contender.release();
        }
        const auditTarget = await createPerson('auditrollback');
        const failingRepository = new DrizzleUserRepository(database as unknown as DbClient);
        const originalTransaction = failingRepository.transaction.bind(failingRepository);
        // Failure injection preserves the real PostgreSQL transaction and grant mutation.
        failingRepository.transaction = callback => originalTransaction(async (repo) => {
            repo.createAuditLog = async () => { throw new Error('Injected audit-store failure'); };
            return callback(repo);
        });
        await expect(new SsoService(failingRepository).administerAccess(actor, auditTarget, 'grant', 'skillup')).rejects.toMatchObject({ status: 503 });
        expect((await pool.query('SELECT count(*)::int AS count FROM platform_access WHERE user_id=$1', [auditTarget])).rows[0].count).toBe(0);
        await sso.administerAccess(actor, target, 'revoke', 'skillup');
        await expect(sso.administerAccess(actor, target, 'grant', 'skillup')).rejects.toMatchObject({ status: 403 });
        await pool.query('UPDATE users SET is_active=false WHERE id=$1', [admin]);
        await expect(sso.administerAccess(actor, auditTarget, 'grant', 'skillup')).rejects.toMatchObject({ status: 403 });
        return { samePlatformGrantRevoke: true, crossPlatformDenied: true, missingPermissionDenied: true, disabledActorDenied: true, lockTimeoutSQLSTATE: '55P03', grantRolledBackOnAuditFailure: true, implicitRestoreDenied: true };
    }));
    it('08 verifies the exact seed conflict expression without full seeding or credential overwrite', () => scenario('08 seed target compatibility', async () => {
        const email = `${run}_seed@example.invalid`;
        const execute = (platform: string, password: string) => pool.query(`INSERT INTO public.users(email,password_hash,role,platform,is_active) VALUES($1,$2,'student',$3,true) ON CONFLICT (lower(trim(email)), platform) WHERE deleted_at IS NULL DO NOTHING RETURNING id`, [email, password, platform]);
        const a = await execute('skillup', 'synthetic-original');
        const b = await execute('realtutorialhub', 'synthetic-other');
        const repeat = await execute('skillup', 'synthetic-replacement');
        expect(a.rowCount).toBe(1);
        expect(b.rowCount).toBe(1);
        expect(repeat.rowCount).toBe(0);
        expect((await pool.query('SELECT password_hash FROM users WHERE id=$1', [a.rows[0].id])).rows[0].password_hash).toBe('synthetic-original');
        return { exactExpressionAccepted: true, repeatNoop: true, otherBrandPreserved: true, credentialOverwritePrevented: true };
    }));
});
afterAll(async () => {
    try {
        await verifyTarget();
        const ids = (await pool.query('SELECT id FROM users WHERE email LIKE $1', [run + '_%@example.invalid'])).rows.map(row => row.id);
        if (ids.length) {
            await pool.query('DELETE FROM auth_audit_log WHERE actor_id=ANY($1::uuid[])', [ids]);
            await pool.query('DELETE FROM platform_access WHERE user_id=ANY($1::uuid[])', [ids]);
            await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])', [ids]);
        }
        await pool.query(`DROP SCHEMA IF EXISTS "${skillupSchema}" CASCADE; DROP SCHEMA IF EXISTS "${rthSchema}" CASCADE`);
        const digest = (await pool.query(`SELECT md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'')) AS digest FROM users u`)).rows[0].digest;
        fs.writeFileSync(path.join(evidence, 'SYNTHETIC_CLEANUP.json'), JSON.stringify({ run, syntheticUsersDeleted: ids.length, remainingSyntheticUsers: (await pool.query('SELECT count(*)::int AS count FROM users WHERE email LIKE $1', [run + '_%@example.invalid'])).rows[0].count, inheritedUserDigestMatches: digest === baselineDigest, syntheticSchemasDropped: [skillupSchema, rthSchema], branchSchemaRehearsalRetained: migrated }, null, 2));
        expect(digest).toBe(baselineDigest);
    }
    finally {
        await pool.end();
        save();
    }
}, 120000);
