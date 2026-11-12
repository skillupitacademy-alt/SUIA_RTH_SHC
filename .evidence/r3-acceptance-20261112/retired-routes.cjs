const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { chromium } = require('@playwright/test');
neonConfig.webSocketConstructor = require('ws');
const root = path.resolve(__dirname, '../..');
function environment(dir) {
  const values = {};
  for (const name of ['.env', '.env.local']) {
    const file = path.join(root, dir, name);
    if (fs.existsSync(file)) Object.assign(values, require('dotenv').parse(fs.readFileSync(file)));
  }
  return values;
}
const env = environment('.');
const results = [];
async function main() {
  const { SignJWT } = await import('jose');
  const pool = new Pool({ connectionString: env.DATABASE_DIRECT_URL_PEOPLE || env.DATABASE_URL_PEOPLE, max: 1, connectionTimeoutMillis: 10000 });
  const client = await pool.connect();
  const accounts = {};
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout='10s'");
    for (const brand of ['skillup', 'realtutorialhub']) {
      accounts[brand] = (await client.query("SELECT id, role FROM users WHERE platform=$1 AND is_active=true AND deleted_at IS NULL AND role='student' LIMIT 1", [brand])).rows[0];
      assert.ok(accounts[brand], 'Active development learner required');
    }
  } finally { await client.query('ROLLBACK'); client.release(); await pool.end(); }
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [brand, app, port, paths] of [
      ['skillup', 'skillup-web', 3009, ['/student/learn', '/student/learn/']],
      ['realtutorialhub', 'realtutorialhub-web', 3003, ['/learn', '/learn/remediation', '/learn/domain/subject/topic/subtopic', '/learn/domain/subject/topic/subtopic/assignments', '/remediation', '/remediation/', '/tutorial/assignments', '/tutorial/assignments/', '/tutorial/assignments/domain/subject/topic/subtopic']],
    ]) {
      const config = environment(`apps/${app}`);
      const jwt = await new SignJWT({ userId: accounts[brand].id, originalUserId: accounts[brand].id, shadowUserId: accounts[brand].id, roles: [accounts[brand].role], brand, tokenType: 'user', isAdmin: false, isActive: true })
        .setProtectedHeader({ alg: 'HS256' }).setIssuer('skillhubcore.in').setAudience('user').setIssuedAt().setExpirationTime('10m').sign(new TextEncoder().encode(config.JWT_SECRET || env.JWT_SECRET));
      for (const authenticated of [false, true]) {
        const context = await browser.newContext();
        try {
          if (authenticated) {
            await context.addCookies([{ name: 'accessToken', value: jwt, domain: `${brand}.localhost`, path: '/', httpOnly: true, sameSite: 'Lax' }]);
            const control = await context.request.get(`http://${brand}.localhost:${port}/api/tutorial/progress?subtopicId=${crypto.randomUUID()}`, { timeout: 180000 });
            results.push({ brand, authenticated, path: '/api/tutorial/progress', request: 'valid-session control', expected: 200, actual: control.status(), pass: control.status() === 200 });
          }
          for (const retired of paths) {
            for (const [method, headers] of [['GET', {}], ['HEAD', {}], ['GET', { rsc: '1', 'next-router-prefetch': '1' }]]) {
              const response = await context.request.fetch(`http://${brand}.localhost:${port}${retired}`, { method, headers, maxRedirects: 1, timeout: 180000 });
              results.push({ brand, authenticated, path: retired, request: method + (headers.rsc ? ' RSC/prefetch' : ''), expected: 404, actual: response.status(), pass: response.status() === 404 });
            }
          }
        } finally { await context.close(); }
      }
    }
  } finally {
    await browser.close();
    const report = { head: 'f78bd048e2192e0f744ffe3fca6218aa1d9aedd2', timestamp: new Date().toISOString(), boundary: 'Actual local HTTP via Playwright Chromium contexts. Existing active development learners verified through read-only PeopleDB lookup. Signed short-lived learner credentials held in memory. GET/HEAD only. No account or content mutations.', results };
    fs.writeFileSync(path.join(__dirname, 'retired-routes-results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass) }));
    if (results.some(r => !r.pass)) process.exitCode = 1;
  }
}
main().catch(e => { console.error(JSON.stringify({ name: e.name, code: e.code })); process.exitCode = 1; });
