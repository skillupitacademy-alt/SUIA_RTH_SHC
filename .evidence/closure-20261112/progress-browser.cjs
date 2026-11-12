const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { chromium } = require('@playwright/test');
neonConfig.webSocketConstructor = require('ws');
const root = path.resolve(__dirname, '../..');
const rootEnv = require('dotenv').parse(fs.readFileSync(path.join(root, '.env.local')));
const user = crypto.randomUUID(); const topic = crypto.randomUUID();
const results = [];
const pool = new Pool({ connectionString: rootEnv.DATABASE_DIRECT_URL_TUTORIAL || rootEnv.DATABASE_URL_TUTORIAL, max: 1, connectionTimeoutMillis: 10000 });
const screenshotDir = path.join(root, '.evidence/screenshots/closure-20261112');
fs.mkdirSync(screenshotDir, { recursive: true });
async function main() {
  const { SignJWT } = await import('jose');
  const browser = await chromium.launch({ headless: true });
  let cleanupVerified = false;
  async function token(brand, subject = user) {
    const app = brand === 'skillup' ? 'skillup-web' : 'realtutorialhub-web';
    const env = require('dotenv').parse(fs.readFileSync(path.join(root, 'apps', app, '.env.local')));
    const secret = env.JWT_SECRET || rootEnv.JWT_SECRET;
    assert.ok(secret);
    return new SignJWT({ userId: subject, originalUserId: subject, shadowUserId: subject, roles: ['student'], brand, tokenType: 'user', isAdmin: false, isActive: true })
      .setProtectedHeader({ alg: 'HS256' }).setIssuer('skillhubcore.in').setAudience('user').setIssuedAt().setExpirationTime('5m').sign(new TextEncoder().encode(secret));
  }
  async function probe(brand, port, name, jwt, expectedStatus, expectedBlocks) {
    const context = await browser.newContext();
    try {
      await context.addCookies([{ name: 'accessToken', value: jwt, domain: `${brand}.localhost`, path: '/', httpOnly: true, sameSite: 'Lax' }]);
      const page = await context.newPage();
      const response = await page.goto(`http://${brand}.localhost:${port}/api/tutorial/progress?subtopicId=${topic}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
      assert.equal(response.status(), expectedStatus);
      if (expectedStatus === 200) {
        assert.match(response.headers()['cache-control'] || '', /private.*no-store/);
        const body = await response.json();
        assert.deepEqual(body.data.blocksCompleted, expectedBlocks);
        const reload = await page.reload({ waitUntil: 'domcontentloaded' });
        assert.equal(reload.status(), 200);
        assert.match(reload.headers()['cache-control'] || '', /private.*no-store/);
        assert.deepEqual((await reload.json()).data.blocksCompleted, expectedBlocks);
        await page.screenshot({ path: path.join(screenshotDir, `${brand}-${name}-progress-api.png`) });
      }
      results.push({ name: `${brand}_${name}`, expectedStatus, actualStatus: response.status(), pass: true, cacheControl: response.headers()['cache-control'] });
    } catch (e) { results.push({ name: `${brand}_${name}`, expectedStatus, pass: false, error: e instanceof assert.AssertionError ? e.message : e.name }); }
    finally { await context.close(); }
  }
  try {
    await pool.query('INSERT INTO public.tutorial_progress(user_id,subtopic_id,tenant_id,blocks_completed) VALUES($1,$2,$3,$4::jsonb),($1,$2,$5,$6::jsonb)', [user, topic, 'skillup', '["notes","code"]', 'realtutorialhub', '["notes"]']);
    for (const [brand, port, otherBrand, blocks] of [['skillup', 3009, 'realtutorialhub', ['notes', 'code']], ['realtutorialhub', 3003, 'skillup', ['notes']]]) {
      await probe(brand, port, 'persisted_reload', await token(brand), 200, blocks);
      await probe(brand, port, 'reissued_session_new_context', await token(brand), 200, blocks);
      await probe(brand, port, 'other_user', await token(brand, crypto.randomUUID()), 200, []);
      // Learner proxies reject signed credentials bound to the other brand.
      const foreign = await token(otherBrand);
      const context = await browser.newContext();
      try {
        const response = await context.request.get(`http://${brand}.localhost:${port}/api/tutorial/progress?subtopicId=${topic}`, { headers: { Authorization: `Bearer ${foreign}` }, timeout: 120000 });
        results.push({ name: `${brand}_foreign_brand`, expectedStatus: '401/403', actualStatus: response.status(), pass: [401, 403].includes(response.status()) });
      } finally { await context.close(); }
    }
  } finally {
    await browser.close();
    await pool.query('DELETE FROM public.tutorial_progress WHERE user_id=$1 AND subtopic_id=$2', [user, topic]);
    cleanupVerified = (await pool.query('SELECT count(*)::int AS n FROM public.tutorial_progress WHERE user_id=$1 AND subtopic_id=$2', [user, topic])).rows[0].n === 0;
    await pool.end();
    const report = { timestamp: new Date().toISOString(), boundary: 'Actual headless Chromium -> learner BFF -> backend -> remote PostgreSQL. Synthetic signed learner sessions in memory; no password-login or live account-status claim. Existing tutorial content/authoring journeys excluded.', cleanupVerified, results };
    fs.writeFileSync(path.join(__dirname, 'progress-browser-results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    if (!cleanupVerified || results.some(r => !r.pass)) process.exitCode = 1;
  }
}
main().catch(e => { console.error(JSON.stringify({ name: e.name, code: e.code })); process.exitCode = 1; });
