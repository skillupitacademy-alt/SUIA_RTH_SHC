import { it, expect, vi } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
vi.mock('../../packages/identity-bridge/src/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
import { schema } from '../../packages/db-people/src/schema';
import type { DbClient } from '../../packages/db-people/src/db';
import { UserIdentityBridgeService } from '../../packages/identity-bridge/src/UserIdentityBridgeService';
it('rolls back a real bridge person insert when the following grant INSERT fails in PostgreSQL, then recovers', async () => {
    const url = new URL(process.env.R6_NEON_TEST_URL || '');
    if (url.hostname !== 'ep-fragrant-brook-a1mhx5dm-pooler.ap-southeast-1.aws.neon.tech' || url.pathname !== '/people_prod')
        throw Error('Wrong endpoint');
    url.hostname = url.hostname.replace('-pooler.', '.');
    const pool = new Pool({ connectionString: url.toString(), max: 1, options: '-c search_path=public', statement_timeout: 15000 });
    const run = 'r6b_rollback_' + crypto.randomBytes(5).toString('hex'), externalId = crypto.randomUUID();
    const receipt: Record<string, unknown> = { run, status: 'RUNNING' };
    try {
        const actual = (await pool.query("SELECT current_database() AS database,current_setting('neon.branch_id') AS branch,current_setting('neon.project_id') AS project")).rows[0];
        expect(actual).toEqual({ database: 'people_prod', branch: 'br-young-silence-a1b1ta26', project: 'bitter-tree-18287476' });
        receipt.identity = actual;
        await pool.query(`CREATE FUNCTION public.${run}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF EXISTS(SELECT 1 FROM public.users WHERE id=NEW.user_id AND external_id='${externalId}'::uuid) THEN RAISE EXCEPTION 'r6 synthetic grant failure' USING ERRCODE='P0001'; END IF; RETURN NEW; END $$; CREATE TRIGGER ${run} BEFORE INSERT ON public.platform_access FOR EACH ROW EXECUTE FUNCTION public.${run}()`);
        const bridge = new UserIdentityBridgeService(drizzle(pool, { schema }) as unknown as DbClient);
        const input = { externalId, externalBrand: 'skillup' as const, platform: 'skillup' as const, email: run + '@example.invalid' };
        await expect(bridge.syncUser(input)).rejects.toMatchObject({ code: 'PROJECTION_UNAVAILABLE' });
        expect((await pool.query('SELECT count(*)::int AS count FROM public.users WHERE external_id=$1', [externalId])).rows[0].count).toBe(0);
        await pool.query(`DROP TRIGGER ${run} ON public.platform_access; DROP FUNCTION public.${run}()`);
        const recovered = await bridge.syncUser(input);
        expect((await pool.query('SELECT count(*)::int AS count FROM public.platform_access WHERE user_id=$1', [recovered.shadowUserId])).rows[0].count).toBe(1);
        receipt.status = 'PASS';
        receipt.personInsertRolledBack = true;
        receipt.postFailureRetryPassed = true;
        receipt.injectedSQLSTATE = 'P0001';
    }
    finally {
        await pool.query(`DROP TRIGGER IF EXISTS ${run} ON public.platform_access; DROP FUNCTION IF EXISTS public.${run}()`);
        const ids = (await pool.query('SELECT id FROM public.users WHERE external_id=$1', [externalId])).rows.map(row => row.id);
        await pool.query('DELETE FROM public.platform_access WHERE user_id=ANY($1::uuid[])', [ids]);
        await pool.query('DELETE FROM public.users WHERE id=ANY($1::uuid[])', [ids]);
        receipt.remainingPeople = (await pool.query('SELECT count(*)::int AS count FROM public.users WHERE external_id=$1', [externalId])).rows[0].count;
        await pool.end();
        fs.writeFileSync('.evidence/r6-neon-qualification/BRIDGE_DATABASE_ROLLBACK.json', JSON.stringify(receipt, null, 2));
    }
}, 60000);
