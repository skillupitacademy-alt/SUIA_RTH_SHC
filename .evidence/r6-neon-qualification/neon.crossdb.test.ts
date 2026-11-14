import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
vi.mock('../../packages/identity-bridge/src/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
import { schema } from '../../packages/db-people/src/schema';
import type { DbClient } from '../../packages/db-people/src/db';
import { UserIdentityBridgeService } from '../../packages/identity-bridge/src/UserIdentityBridgeService';
const endpoint = new URL(process.env.R6_NEON_TEST_URL || '');
if (endpoint.hostname !== 'ep-fragrant-brook-a1mhx5dm-pooler.ap-southeast-1.aws.neon.tech' || endpoint.pathname !== '/people_prod')
    throw new Error('Explicit disposable target required');
endpoint.hostname = endpoint.hostname.replace('-pooler.', '.');
const run = 'r6b_crossdb_' + crypto.randomBytes(5).toString('hex');
const databases = { skillup: run + '_skillup', realtutorialhub: run + '_rth' };
const brandUsers = pgTable('users', { id: uuid('id').primaryKey(), shadowUserId: uuid('shadow_user_id'), deletedAt: timestamp('deleted_at') });
const pools: Pool[] = [];
const receipts: Record<string, unknown>[] = [];
const transportErrors: Array<{
    code?: string;
}> = [];
const resources: Record<string, unknown>[] = [];
let control: Pool;
let bridge: UserIdentityBridgeService;
let baselineDigest: string;
async function connect(database: string) {
    const url = new URL(endpoint);
    url.pathname = '/' + database;
    const pool = new Pool({ connectionString: url.toString(), max: 2, connectionTimeoutMillis: 15000, statement_timeout: 10000, options: '-c search_path=public' });
    pools.push(pool);
    pool.on('error', error => { transportErrors.push({ code: (error as NodeJS.ErrnoException).code }); });
    const actual = (await pool.query("SELECT current_database() AS database,current_setting('neon.branch_id') AS branch,current_setting('neon.project_id') AS project")).rows[0];
    expect(actual).toEqual({ database, branch: 'br-young-silence-a1b1ta26', project: 'bitter-tree-18287476' });
    receipts.push({ connectionVerified: actual });
    return pool;
}
beforeAll(async () => {
    control = await connect('people_prod');
    baselineDigest = (await control.query("SELECT md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'')) AS digest FROM public.users u")).rows[0].digest;
    bridge = new UserIdentityBridgeService(drizzle(control, { schema }) as unknown as DbClient);
    for (const database of Object.values(databases)) {
        await control.query('CREATE DATABASE "' + database + '"');
        resources.push({ database, created: true });
    }
}, 60000);
it('links deliberately colliding local UUIDs across separate synthetic brand databases and recovers a failed brand write', async () => {
    const a = await connect(databases.skillup), b = await connect(databases.realtutorialhub);
    for (const pool of [a, b])
        await pool.query('CREATE TABLE public.users(id uuid PRIMARY KEY,shadow_user_id uuid,deleted_at timestamp)');
    const id = crypto.randomUUID();
    const email = run + '@example.invalid';
    for (const pool of [a, b])
        await pool.query('INSERT INTO public.users(id) VALUES($1)', [id]);
    const sa = { externalId: id, externalBrand: 'skillup' as const, platform: 'skillup' as const, email };
    const rb = { externalId: id, externalBrand: 'realtutorialhub' as const, platform: 'realtutorialhub' as const, email };
    const pa = await bridge.syncUser(sa), pb = await bridge.syncUser(rb);
    expect(pa.shadowUserId).not.toBe(pb.shadowUserId);
    expect(pa.shadowUserId).not.toBe(id);
    expect(pb.shadowUserId).not.toBe(id);
    await bridge.updateShadowUserId(drizzle(a) as unknown as DbClient, brandUsers, id, pa.shadowUserId, 'skillup');
    await b.end();
    await expect(bridge.updateShadowUserId(drizzle(b) as unknown as DbClient, brandUsers, id, pb.shadowUserId, 'realtutorialhub')).rejects.toMatchObject({ code: 'PROJECTION_UNAVAILABLE' });
    expect(await bridge.getShadowUserId(id, 'realtutorialhub')).toBe(pb.shadowUserId);
    const resumed = await connect(databases.realtutorialhub);
    await bridge.updateShadowUserId(drizzle(resumed) as unknown as DbClient, brandUsers, id, pb.shadowUserId, 'realtutorialhub');
    await expect(bridge.updateShadowUserId(drizzle(a) as unknown as DbClient, brandUsers, id, pb.shadowUserId, 'skillup')).rejects.toMatchObject({ code: 'SHADOW_LINK_CONFLICT' });
    expect((await a.query('SELECT shadow_user_id FROM public.users WHERE id=$1', [id])).rows[0].shadow_user_id).toBe(pa.shadowUserId);
    expect((await resumed.query('SELECT shadow_user_id FROM public.users WHERE id=$1', [id])).rows[0].shadow_user_id).toBe(pb.shadowUserId);
    receipts.push({ result: 'PASS', collidingLocalUuid: true, independentPeopleUuids: true, realDatabases: databases, peopleCommitRetainedOnBrandClientFailure: true, conditionalLinkRecovery: true, foreignPersonLinkDenied: true });
}, 60000);
afterAll(async () => {
    try {
        for (const pool of pools.filter(value => value !== control))
            await pool.end().catch(() => { });
        await new Promise(resolve => setTimeout(resolve, 300));
        for (const resource of resources) {
            if (resource.created && Object.values(databases).includes(resource.database as string)) {
                await control.query('DROP DATABASE "' + resource.database + '"');
                resource.deleted = true;
            }
        }
        expect(transportErrors).toEqual([]);
        const ids = (await control.query('SELECT id FROM public.users WHERE email=$1', [run + '@example.invalid'])).rows.map(row => row.id);
        await control.query('DELETE FROM public.platform_access WHERE user_id=ANY($1::uuid[])', [ids]);
        await control.query('DELETE FROM public.users WHERE id=ANY($1::uuid[])', [ids]);
        const digest = (await control.query("SELECT md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'')) AS digest FROM public.users u")).rows[0].digest;
        expect(digest).toBe(baselineDigest);
        receipts.push({ cleanup: { inheritedDigestMatches: true, remainingOwnedDatabases: (await control.query('SELECT datname FROM pg_database WHERE datname=ANY($1::text[])', [Object.values(databases)])).rows, remainingSyntheticPeople: (await control.query('SELECT count(*)::int AS count FROM public.users WHERE email=$1', [run + '@example.invalid'])).rows[0].count } });
    }
    finally {
        await control?.end();
        fs.writeFileSync('.evidence/r6-neon-qualification/CROSS_DATABASE_RESULTS.json', JSON.stringify({ run, resources, receipts }, null, 2));
    }
}, 60000);
