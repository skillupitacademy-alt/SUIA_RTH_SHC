import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { Pool as PgPool } from 'pg';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { migratePeople } from '../../packages/db-people/src/migration-compatibility';

const evidence = path.resolve('.evidence/r6-shc-revocation');
const result: {
  status: string;
  checks: Array<Record<string, unknown>>;
  cleanup?: boolean;
  failure?: string;
  sqlstate?: string;
  scratchDatabase?: string;
  target?: { project: string; branch: string; endpoint: string };
} = { status: 'RUNNING', checks: [] };
const save = () => fs.writeFileSync(path.join(evidence, 'DISPOSABLE_RESULTS.json'), JSON.stringify(result, null, 2));
const supplied = process.env.R6_NEON_TEST_URL;
if (!supplied) {
  result.status = 'BLOCKED';
  result.failure = 'Approved disposable R6_NEON_TEST_URL is unavailable. No database connection attempted.';
  save();
  process.exit(2);
}
let target: URL;
try {
  target = new URL(supplied);
} catch {
  result.status = 'BLOCKED';
  result.failure = 'Invalid disposable connection configuration';
  save();
  process.exit(2);
}
assert.ok(['ep-fragrant-brook-a1mhx5dm-pooler.ap-southeast-1.aws.neon.tech', 'ep-fragrant-brook-a1mhx5dm.ap-southeast-1.aws.neon.tech'].includes(target.hostname));
assert.equal(target.pathname, '/people_prod');
target.hostname = target.hostname.replace('-pooler.', '.');
const database = 'r6b_shc_' + crypto.randomBytes(6).toString('hex');
result.scratchDatabase = database;
result.target = { project: 'bitter-tree-18287476', branch: 'br-young-silence-a1b1ta26', endpoint: target.hostname };
const connection = (name: string) => { const url = new URL(target); url.pathname = '/' + name; return url.toString(); };
const control = new PgPool({ connectionString: connection('people_prod'), max: 1 });
control.on('error', () => undefined);
neonConfig.webSocketConstructor = WebSocket;
let queries: PgPool | undefined;
let migration: Pool | undefined;
let created = false;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'r6b-shc-journal-'));
async function verify(pool: PgPool, expected: string) {
  const identity = (await pool.query("SELECT current_database() AS database,current_user AS role,current_setting('neon.branch_id') AS branch,current_setting('neon.project_id') AS project")).rows[0];
  assert.deepEqual(identity, { database: expected, role: 'neondb_owner', branch: 'br-young-silence-a1b1ta26', project: 'bitter-tree-18287476' });
}
function passed(check: string, details: Record<string, unknown> = {}) {
  result.checks.push({ check, result: 'PASS', ...details }); save();
}
try {
  await verify(control, 'people_prod');
  passed('Disposable branch identity verified before first write');
  await control.query('CREATE DATABASE "' + database + '"');
  created = true;
  save();
  queries = new PgPool({ connectionString: connection(database), max: 1 });
  queries.on('error', () => undefined);
  await verify(queries, database);
  migration = new Pool({ connectionString: connection(database), max: 1 });
  migration.on('error', () => undefined);
  const folder = path.resolve('packages/db-people/migrations');
  const journal = JSON.parse(fs.readFileSync(path.join(folder, 'meta/_journal.json'), 'utf8'));
  fs.mkdirSync(path.join(temp, 'meta'));
  const baseline = { ...journal, entries: journal.entries.filter((row: { idx: number }) => row.idx <= 9) };
  for (const entry of baseline.entries) fs.copyFileSync(path.join(folder, entry.tag + '.sql'), path.join(temp, entry.tag + '.sql'));
  fs.writeFileSync(path.join(temp, 'meta/_journal.json'), JSON.stringify(baseline));
  await migratePeople(migration, temp);
  const duplicateIds = [crypto.randomUUID(), crypto.randomUUID()];
  const email = crypto.randomUUID() + '@example.invalid';
  for (const [index, id] of duplicateIds.entries()) {
    await queries.query("INSERT INTO public.users(id,email,password_hash,platform) VALUES($1,$2,'test-hash','skillup')", [id, index === 0 ? email : ' ' + email.toUpperCase() + ' ']);
  }
  await assert.rejects(migratePeople(migration, folder), /23505/);
  assert.equal((await queries.query('SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations')).rows[0].n, 10);
  assert.equal((await queries.query("SELECT count(*)::int AS n FROM pg_constraint WHERE conrelid='public.users'::regclass AND conname='users_email_unique'")).rows[0].n, 1);
  passed('Normalized duplicate aborts registered 0010 with ledger and global constraint retained', { sqlstate: '23505' });
  await queries.query('DELETE FROM public.users WHERE id=ANY($1::uuid[])', [duplicateIds]);
  const upgrade = await migratePeople(migration, folder);
  assert.deepEqual(upgrade.executed.map(row => row.tag), ['0010_normalized_platform_email']);
  const repeat = await migratePeople(migration, folder);
  assert.equal(repeat.executed.length, 0);
  passed('Registered 0010 upgrade and supported repeat execution', { receipt: upgrade });
  for (const platform of ['skillup', 'realtutorialhub']) {
    await queries.query("INSERT INTO public.users(id,email,password_hash,platform,external_id) VALUES($1,$2,'test-hash',$3,$4)", [crypto.randomUUID(), email, platform, crypto.randomUUID()]);
  }
  await assert.rejects(queries.query("INSERT INTO public.users(email,password_hash,platform) VALUES($1,'test-hash','skillup')", [' ' + email.toUpperCase() + ' ']), { code: '23505' });
  passed('Independent same-email brands and normalized within-platform rejection');

  // The observed shared schema already has this label. Historical fresh replay
  // does not add it. This fixture mirrors that existing SHC prerequisite only
  // in the assignment-owned scratch database and is recorded explicitly.
  const labels = (await queries.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid=enumtypid WHERE typname='people_platform'")).rows.map(row => row.enumlabel);
  if (!labels.includes('skillhubcore')) {
    await queries.query("ALTER TYPE public.people_platform ADD VALUE 'skillhubcore'");
    passed('SHC fixture mirrors observed shared enum label', { historicalFreshSchemaLacksShcLabel: true });
  }
  const adminId = crypto.randomUUID();
  const password = crypto.randomBytes(24).toString('base64url');
  const adminEmail = crypto.randomUUID() + '@example.invalid';
  await queries.query("INSERT INTO public.users(id,email,password_hash,role,platform) VALUES($1,$2,$3,'admin','skillhubcore')", [adminId, adminEmail, await bcrypt.hash(password, 10)]);
  for (const key of Object.keys(process.env)) if (/DATABASE|QSTASH|UPSTASH|REDIS|SMTP|RESEND|OPENAI|GEMINI/.test(key)) delete process.env[key];
  Object.assign(process.env, {
    NODE_ENV: 'test', LOG_LEVEL: 'silent',
    DATABASE_URL_PEOPLE: connection(database), DATABASE_DIRECT_URL_PEOPLE: connection(database),
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    ADMIN_JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    JWT_REFRESH_SECRET: crypto.randomBytes(32).toString('hex'),
  });
  const { container } = await import('../../apps/api-server/src/modules/core/container');
  const { AuditService } = await import('../../apps/api-server/src/modules/auth/audit.service');
  container.register(AuditService, { log: async () => undefined } as never);
  const { SHCAuthService } = await import('../../apps/api-server/src/modules/auth/shc-auth.service');
  const { TokenService } = await import('../../apps/api-server/src/modules/auth/token.service');
  const { GET } = await import('../../apps/api-server/src/app/api/shc/auth/me/route');
  const { requireAdminRouteAccess } = await import('../../apps/api-server/src/modules/auth/admin-audience.util');
  const service = new SHCAuthService();
  const tokens = new TokenService();
  const first = await service.login(adminEmail, password);
  const payload = await tokens.verifyAdminAccessToken(first.accessToken, { audience: 'shc-admin' });
  const request = () => new NextRequest('http://localhost/api/admin/domains', { headers: {
    cookie: `admin_accessToken=${first.accessToken}; accessToken=${first.accessToken}; refreshToken=${first.refreshToken}`,
    'x-portal-identity': 'shc-admin',
  } });
  assert.equal((await GET(request())).status, 200);
  assert.equal((await requireAdminRouteAccess(request())).userId, adminId);
  await service.logout(payload);
  assert.equal((await GET(request())).status, 401);
  await assert.rejects(requireAdminRouteAccess(request()), { status: 401 });
  passed('Actual SHC service, identity handler and backend admin guard reject pre-logout credentials', { persistence: 'Real disposable PostgreSQL', audit: 'Controlled adapter to avoid protected MainDB writes' });
  const fresh = await service.login(adminEmail, password);
  await service.requireSession(await tokens.verifyAdminAccessToken(fresh.accessToken, { audience: 'shc-admin' }));
  passed('New legitimate SHC login remains usable');
  result.status = 'PASS';
} catch (error) {
  result.status = 'FAIL';
  result.failure = 'Sanitized disposable verification failure';
  if (typeof error === 'object' && error !== null && 'code' in error && /^[A-Z0-9]{5}$/.test(String(error.code))) result.sqlstate = String(error.code);
  process.exitCode = 1;
} finally {
  try {
    await migration?.end(); await queries?.end();
    if (created) {
      await verify(control, 'people_prod');
      // Only this generated, positively verified assignment-owned database.
      await control.query('DROP DATABASE "' + database + '" WITH (FORCE)');
      result.cleanup = (await control.query('SELECT 1 FROM pg_database WHERE datname=$1', [database])).rowCount === 0;
    }
  } catch {
    result.cleanup = false;
    result.status = 'FAIL';
    result.failure = 'Disposable cleanup requires review of the recorded owned resource';
    process.exitCode = 1;
  } finally {
    await control.end().catch(() => undefined);
    const absolute = path.resolve(temp);
    assert.ok(absolute.startsWith(path.join(os.tmpdir(), 'r6b-shc-journal-')));
    fs.rmSync(absolute, { recursive: true, force: true });
    save();
  }
}
