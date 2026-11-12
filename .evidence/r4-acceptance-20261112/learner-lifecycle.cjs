const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { chromium } = require('@playwright/test');
neonConfig.webSocketConstructor = require('ws');
const root = path.resolve(__dirname, '../..');
const environment = require('dotenv').parse(fs.readFileSync(path.join(root, '.env.local')));
const runId = `r4-${crypto.randomUUID()}`;
const results = [];
const fixtures = [];
const pools = {};
let browser;
let cleanupVerified = false;
function record(name, expected, actual, details = {}) {
  const pass = Array.isArray(expected) ? expected.includes(actual) : expected === actual;
  const result = { name, expected, actual, pass, ...details };
  results.push(result);
  console.log(JSON.stringify(result));
  save();
  return pass;
}
function save() {
  fs.writeFileSync(path.join(__dirname, 'learner-lifecycle-results.json'), JSON.stringify({ runId, timestamp: new Date().toISOString(), boundary: 'Actual local BFF/gateway/backend HTTP and headless Chromium with real password login, remote brand-local refresh session records and bounded synthetic identities. Secrets stay in memory. Database mutations and cleanup target only run-created UUIDs.', results, cleanupVerified }, null, 2));
}
async function request(context, fixture, route, method = 'GET', body, headers = {}) {
  const cookies = await context.cookies(fixture.base);
  const csrf = cookies.find(cookie => cookie.name === 'csrfToken')?.value;
  return context.request.fetch(fixture.base + route, {
    method, headers: { origin: fixture.base, ...(csrf ? { 'x-csrf-token': csrf } : {}), ...headers },
    ...(body !== undefined ? { data: body } : {}), timeout: 180000, maxRedirects: 0,
  });
}
async function login(context, fixture) {
  return request(context, fixture, '/api/auth/login', 'POST', { email: fixture.email, password: fixture.password, platform: fixture.brand }, { 'x-device-id': crypto.randomUUID() });
}
async function createFixture(brand, label) {
  const id = crypto.randomUUID();
  const shadowId = crypto.randomUUID();
  const email = `${runId}-${brand}-${label}@example.invalid`;
  const password = crypto.randomBytes(24).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 10);
  const fixture = { id, shadowId, brand, email, password, base: `http://${brand}.localhost:${brand === 'skillup' ? 3009 : 3003}` };
  fixtures.push(fixture);
  await pools.people.query('INSERT INTO users(id,email,password_hash,role,platform,is_active,external_id,external_brand) VALUES($1,$2,$3,$4,$5,true,$6,$7)', [shadowId, email, passwordHash, 'student', brand, id, brand]);
  await pools.people.query('INSERT INTO platform_access(user_id,platform) VALUES($1,$2)', [shadowId, brand]);
  await pools[brand].query('INSERT INTO users(id,email,password_hash,email_verified,is_onboarded,shadow_user_id) VALUES($1,$2,$3,true,true,$4)', [id, email, passwordHash, shadowId]);
  await pools[brand].query("INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE name='student'", [id]);
  await pools[brand].query('INSERT INTO user_profiles(user_id,name,onboarding_completed) VALUES($1,$2,true)', [id, `Synthetic ${label}`]);
  return fixture;
}
async function cleanup() {
  let allRemoved = true;
  for (const fixture of fixtures) {
    // Both ID and synthetic email guard the owning row before cascaded fixture cleanup.
    const owned = (await pools[fixture.brand].query('SELECT id FROM users WHERE id=$1 AND email=$2', [fixture.id, fixture.email])).rowCount;
    if (owned) {
      await pools[fixture.brand].query('DELETE FROM audit_logs WHERE user_id=$1', [fixture.id]);
      await pools[fixture.brand].query('DELETE FROM users WHERE id=$1 AND email=$2', [fixture.id, fixture.email]);
    }
    await pools.people.query('DELETE FROM platform_access WHERE user_id=$1', [fixture.shadowId]);
    await pools.people.query('DELETE FROM users WHERE id=$1 AND email=$2', [fixture.shadowId, fixture.email]);
    const remaining = await pools[fixture.brand].query('SELECT count(*)::int AS n FROM users WHERE id=$1', [fixture.id]);
    const shadow = await pools.people.query('SELECT count(*)::int AS n FROM users WHERE id=$1', [fixture.shadowId]);
    allRemoved = allRemoved && remaining.rows[0].n === 0 && shadow.rows[0].n === 0;
  }
  cleanupVerified = allRemoved;
  save();
  assert.ok(cleanupVerified, 'Run-created identity cleanup must complete');
}
async function qualifyBrand(brand) {
  const { SignJWT, decodeJwt } = await import('jose');
  const a = await createFixture(brand, 'a');
  const b = await createFixture(brand, 'b');
  const context = await browser.newContext();
  try {
    const response = await login(context, a);
    const cookieMetadata = (await context.cookies()).filter(cookie => ['accessToken','refreshToken','csrfToken'].includes(cookie.name)).map(({name,domain,path,httpOnly,secure,sameSite}) => ({name,domain,path,httpOnly,secure,sameSite}));
    if (!record(`${brand} real password login A`, 200, response.status(), { cookies: cookieMetadata })) return;
    const accessBefore = (await context.cookies()).find(cookie => cookie.name === 'accessToken')?.value;
    const refreshBefore = (await context.cookies()).find(cookie => cookie.name === 'refreshToken')?.value;
    record(`${brand} browser context has issued access and refresh cookies`, true, Boolean(accessBefore && refreshBefore));
    const sessionsCount = (await pools[brand].query('SELECT count(*)::int AS n FROM refresh_tokens WHERE user_id=$1 AND revoked=false', [a.id])).rows[0].n;
    record(`${brand} real persisted refresh session`, true, sessionsCount > 0);
    const me = await request(context, a, '/api/profile');
    record(`${brand} authenticated profile`, 200, me.status());
    const page = await context.newPage();
    const route = brand === 'realtutorialhub' ? '/dashboard' : '/student/exams';
    const loaded = await page.goto(a.base + route, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForTimeout(2500);
    record(`${brand} real-session authenticated page`, route, loaded.status() === 200 ? new URL(page.url()).pathname : `HTTP ${loaded.status()}`, { httpStatus: loaded.status() });
    const refresh = await request(context, a, '/api/auth/refresh', 'POST', {});
    record(`${brand} refresh rotation`, 200, refresh.status());
    const accessAfter = (await context.cookies()).find(cookie => cookie.name === 'accessToken')?.value;
    const refreshAfter = (await context.cookies()).find(cookie => cookie.name === 'refreshToken')?.value;
    record(`${brand} refresh credential rotates`, true, Boolean(refreshAfter && refreshAfter !== refreshBefore));
    if (refreshBefore) {
      const oldHash = crypto.createHash('sha256').update(refreshBefore).digest('hex');
      const old = await pools[brand].query('SELECT revoked FROM refresh_tokens WHERE user_id=$1 AND token=$2', [a.id, oldHash]);
      record(`${brand} prior refresh revoked in DB`, true, old.rowCount === 1 && old.rows[0].revoked === true);
    }
    const logoutA = await request(context, a, '/api/auth/logout', 'POST', {});
    record(`${brand} logout A`, 200, logoutA.status());
    record(`${brand} A cookies cleared`, true, !(await context.cookies()).some(cookie => ['accessToken','refreshToken'].includes(cookie.name) && cookie.value));
    const denied = await request(context, a, '/api/profile');
    record(`${brand} post-logout profile denied`, 401, denied.status());
    const loginB = await login(context, b);
    record(`${brand} account switch real login B`, 200, loginB.status());
    const profileB = await request(context, b, '/api/profile');
    const bodyB = await profileB.json().catch(() => ({}));
    const profile = bodyB.user || bodyB.data?.user || bodyB.data || bodyB;
    const userId = profile.userId || profile.id;
    record(`${brand} B profile identity`, b.id, userId, { status: profileB.status() });
    record(`${brand} profile private cache control`, true, /(?:private|no-store)/i.test(profileB.headers()['cache-control'] || ''));
    const bCookies = await context.cookies();
    const bAccess = bCookies.find(cookie => cookie.name === 'accessToken')?.value;
    const bRefresh = bCookies.find(cookie => cookie.name === 'refreshToken')?.value;
    assert.ok(bAccess && bRefresh, 'Real account B session required for adversarial probes');
    const csrfResponse = await request(context, b, '/api/profile', 'PATCH', {name:'must-not-write'}, {origin:'http://evil.example'});
    record(`${brand} cross-origin authenticated profile mutation denied`,403,csrfResponse.status());
    const forged = await request(context, b, `/api/profile?userId=${a.id}`, 'GET', undefined, {'x-user-id':a.id,'x-original-user-id':a.id,'x-shadow-user-id':a.shadowId,'x-user-roles':'super_admin'});
    const forgedBody = await forged.json();
    const actualProfile = forgedBody.data || forgedBody;
    record(`${brand} forged foreign profile identity ignored`, b.id, actualProfile.userId, {status:forged.status()});
    const ownSessions = await request(context,b,'/api/auth/sessions');
    const sessionsBody = await ownSessions.json();
    const sessions = sessionsBody.data?.sessions || sessionsBody.sessions || [];
    const bSessionIds = (await pools[brand].query('SELECT id FROM refresh_tokens WHERE user_id=$1',[b.id])).rows.map(row=>row.id);
    record(`${brand} session listing contains only own sessions`, true, ownSessions.status() === 200 && sessions.every(session=>bSessionIds.includes(session.id)));
    const foreignSession = (await pools[brand].query('SELECT id,revoked FROM refresh_tokens WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1',[a.id])).rows[0];
    const revokeForeign = await request(context,b,`/api/auth/sessions/${foreignSession.id}`,'DELETE',{});
    record(`${brand} foreign session revoke denied`,[403,404],revokeForeign.status());
    const afterForeignRevoke = (await pools[brand].query('SELECT revoked FROM refresh_tokens WHERE id=$1 AND user_id=$2',[foreignSession.id,a.id])).rows[0];
    record(`${brand} foreign session remains unmodified`,foreignSession.revoked,afterForeignRevoke.revoked);
    await pools[brand].query('UPDATE users SET is_blocked=true WHERE id=$1 AND email=$2',[b.id,b.email]);
    try { record(`${brand} blocked live account denied`,403,(await request(context,b,'/api/profile')).status()); }
    finally { await pools[brand].query('UPDATE users SET is_blocked=false WHERE id=$1 AND email=$2',[b.id,b.email]); }
    await pools[brand].query('UPDATE users SET deleted_at=now() WHERE id=$1 AND email=$2',[b.id,b.email]);
    try { record(`${brand} deleted live account denied`,401,(await request(context,b,'/api/profile')).status()); }
    finally { await pools[brand].query('UPDATE users SET deleted_at=NULL WHERE id=$1 AND email=$2',[b.id,b.email]); }
    const roleIds = (await pools[brand].query('DELETE FROM user_roles WHERE user_id=$1 RETURNING role_id',[b.id])).rows.map(row=>row.role_id);
    try { record(`${brand} removed live role membership denied`,403,(await request(context,b,'/api/profile')).status()); }
    finally { for(const roleId of roleIds) await pools[brand].query('INSERT INTO user_roles(user_id,role_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[b.id,roleId]); }
    const expiryContext = await browser.newContext();
    try {
      const original = decodeJwt(bAccess);
      const expired = await new SignJWT({...original,exp:Math.floor(Date.now()/1000)-10}).setProtectedHeader({alg:'HS256'}).sign(new TextEncoder().encode(environment.JWT_SECRET));
      await expiryContext.addCookies([{name:'accessToken',value:expired,domain:`${brand}.localhost`,path:'/',httpOnly:true}]);
      record(`${brand} actual expired signed access token denied`,401,(await request(expiryContext,b,'/api/profile')).status());
    } finally { await expiryContext.close(); }
    const foreignBrand = brand === 'skillup' ? 'realtutorialhub' : 'skillup';
    const foreign = await browser.newContext();
    try {
      await foreign.addCookies([{name:'accessToken',value:bAccess,domain:`${foreignBrand}.localhost`,path:'/',httpOnly:true}]);
      const foreignFixture = {...b,base:`http://${foreignBrand}.localhost:${foreignBrand === 'skillup' ? 3009 : 3003}`};
      record(`${brand} session rejected on foreign brand`,403,(await request(foreign,foreignFixture,'/api/profile')).status());
    } finally { await foreign.close(); }
    const bSessionHash = crypto.createHash('sha256').update(bRefresh).digest('hex');
    await pools[brand].query('UPDATE refresh_tokens SET expires_at=now()-interval \'1 minute\' WHERE user_id=$1 AND token=$2',[b.id,bSessionHash]);
    record(`${brand} expired persisted session denied`,401,(await request(context,b,'/api/profile')).status());
    record(`${brand} expired refresh rejected`,401,(await request(context,b,'/api/auth/refresh','POST',{})).status());
    if (accessAfter && refreshAfter) {
      const replay = await browser.newContext();
      try {
        await replay.addCookies([{name:'accessToken',value:accessAfter,domain:`${brand}.localhost`,path:'/',httpOnly:true},{name:'refreshToken',value:refreshAfter,domain:`${brand}.localhost`,path:'/',httpOnly:true}]);
        const stale = await request(replay, a, '/api/profile');
        record(`${brand} revoked A session replay denied`, 401, stale.status());
        const direct = await fetch('http://127.0.0.1:3000/api/auth/profile', {
          headers:{cookie:`accessToken=${accessAfter}; refreshToken=${refreshAfter}`,'x-original-host':`${brand}.localhost`,'x-brand':brand},
          signal:AbortSignal.timeout(180000),
        });
        record(`${brand} direct backend revoked A session denied`,401,direct.status);
        await direct.body?.cancel();
      } finally { await replay.close(); }
    }
  } finally { await context.close(); }
}
(async () => {
  for (const [name,key] of [['people','DATABASE_URL_PEOPLE'],['skillup','DATABASE_URL_SKILLUP'],['realtutorialhub','DATABASE_URL_RTH']]) {
    pools[name] = new Pool({connectionString:environment[key],max:2,connectionTimeoutMillis:10000,statement_timeout:15000});
  }
  browser = await chromium.launch({headless:true});
  try {
    for (const brand of ['skillup','realtutorialhub']) {
      try { await qualifyBrand(brand); }
      catch(error) { record(`${brand} lifecycle execution`, 'completed', error.name, { code:error.code }); }
    }
  } finally {
    try { await cleanup(); }
    finally { await browser.close(); await Promise.all(Object.values(pools).map(pool=>pool.end())); }
  }
  if(results.some(result=>!result.pass))process.exitCode=1;
})().catch(error=>{ console.error(JSON.stringify({name:error.name,code:error.code})); save(); process.exitCode=1; });
