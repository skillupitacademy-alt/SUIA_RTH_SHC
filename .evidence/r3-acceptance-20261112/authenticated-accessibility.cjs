const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { chromium } = require('@playwright/test');
const { default: AxeBuilder } = require('@axe-core/playwright');
neonConfig.webSocketConstructor = require('ws');
const root = path.resolve(__dirname, '../..');
function environment(dir) {
  const values = {};
  for (const filename of ['.env', '.env.local']) {
    const file = path.join(root, dir, filename);
    if (fs.existsSync(file)) Object.assign(values, require('dotenv').parse(fs.readFileSync(file)));
  }
  return values;
}
const env = environment('.');
const results = [];
(async () => {
  const { SignJWT } = await import('jose');
  const pool = new Pool({ connectionString: env.DATABASE_DIRECT_URL_PEOPLE || env.DATABASE_URL_PEOPLE, max: 1, connectionTimeoutMillis: 10000 });
  const client = await pool.connect();
  const accounts = {};
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout='10s'");
    for (const brand of ['skillhubcore','skillup','realtutorialhub']) {
      accounts[brand] = (await client.query("SELECT id,role FROM users WHERE platform=$1 AND is_active=true AND deleted_at IS NULL AND role::text=ANY($2::text[]) LIMIT 1", [brand, brand === 'skillhubcore' ? ['admin','super_admin'] : ['student']])).rows[0];
      assert.ok(accounts[brand], 'Active development account required');
    }
  } finally { await client.query('ROLLBACK'); client.release(); await pool.end(); }
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync(path.join(root,'.evidence/screenshots/r3-20261112'), { recursive: true });
  try {
    for (const [brand, app, port, route] of [
      ['skillhubcore','skillhubcore-admin',3007,'/dashboard'],
      ['skillup','skillup-web',3009,'/student/exams'],
      ['realtutorialhub','realtutorialhub-web',3003,'/dashboard'],
    ]) {
      if (process.env.R3_ONLY_BRAND && process.env.R3_ONLY_BRAND !== brand) continue;
      if (process.env.R3_SKIP_BRAND === brand) continue;
      const config = environment(`apps/${app}`);
      const admin = brand === 'skillhubcore';
      const secret = admin ? config.ADMIN_JWT_SECRET || config.JWT_SECRET || env.ADMIN_JWT_SECRET : config.JWT_SECRET || env.JWT_SECRET;
      assert.ok(secret, 'Configured signing key required');
      const jwt = await new SignJWT({ userId: accounts[brand].id, originalUserId: accounts[brand].id, shadowUserId: accounts[brand].id, roles: [accounts[brand].role], brand, tokenType: admin ? 'admin' : 'user', isAdmin: admin, isActive: true, onboardingCompleted: true })
        .setProtectedHeader({ alg:'HS256' }).setIssuer('skillhubcore.in').setAudience(admin ? 'shc-admin':'user').setIssuedAt().setExpirationTime('20m').sign(new TextEncoder().encode(secret));
      for (const [size, viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]) {
        if (process.env.R3_ONLY_SIZE && process.env.R3_ONLY_SIZE !== size) continue;
        const context = await browser.newContext({ viewport, reducedMotion:'reduce' });
        const page = await context.newPage();
        const entry = { brand, route, size, pass:false };
        try {
          await context.addCookies([{ name:'accessToken', value:jwt, domain:`${brand}.localhost`, path:'/', httpOnly:true, sameSite:'Lax' }]);
          if (brand === 'skillhubcore') {
            const control = await context.request.get(`http://${brand}.localhost:${port}/api/auth/me`, {timeout:180000});
            entry.identityControlStatus = control.status();
          }
          if (brand === 'realtutorialhub') {
            const probes = [];
            for (const suffix of ['/auth/me','/api/auth/me']) {
              const upstream = await context.request.get(`${config.GATEWAY_URL.replace(/\/+$/,'')}${suffix}`, { headers: { cookie:`accessToken=${jwt}`, 'x-original-host':`${brand}.localhost`, 'x-internal-secret':config.INTERNAL_GATEWAY_SECRET || env.INTERNAL_GATEWAY_SECRET }, timeout:180000 });
              probes.push({ suffix, status:upstream.status() });
            }
            fs.writeFileSync(path.join(__dirname,'rth-identity-path-probes.json'),JSON.stringify(probes,null,2));
          }
          const response = await page.goto(`http://${brand}.localhost:${port}${route}`, {waitUntil:'domcontentloaded',timeout:180000});
          entry.status = response.status();
          assert.equal(entry.status,200);
          await page.waitForTimeout(2500);
          entry.path = new URL(page.url()).pathname;
          assert.equal(entry.path,route,'Authenticated page must remain accessible');
          await page.getByRole('heading', { name: brand === 'skillhubcore' ? 'Core Engines & Services' : brand === 'skillup' ? 'Assessments' : /Dashboard/i }).first().waitFor({state:'visible',timeout:90000});
          entry.overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
          for (let step=0; step<12; step++) {
            await page.keyboard.press('Tab');
            entry.keyboardTarget = await page.evaluate(() => document.activeElement?.tagName);
            if (['A','BUTTON','INPUT','SELECT','TEXTAREA'].includes(entry.keyboardTarget)) break;
          }
          const axe = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
          entry.violations = axe.violations.map(v => ({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));
          await page.screenshot({path:path.join(root,'.evidence/screenshots/r3-20261112',`${brand}-${size}.png`),fullPage:true});
          assert.equal(entry.overflow,false,'No horizontal overflow');
          assert.ok(['A','BUTTON','INPUT','SELECT','TEXTAREA'].includes(entry.keyboardTarget),'Keyboard focus must enter an application control');
          assert.equal(entry.violations.filter(v=>['serious','critical'].includes(v.impact)).length,0,'No serious/critical automated axe violations');
          entry.pass=true;
        } catch(error) {
          entry.error = error instanceof Error ? error.message.slice(0,500).replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[redacted-token]') : 'Unknown error';
        }
        finally {
          await context.close(); results.push(entry);
          fs.writeFileSync(path.join(__dirname,process.env.R3_REPORT_NAME || 'authenticated-accessibility-results.json'),JSON.stringify({boundary:'Actual headless Chromium, signed development sessions for current active accounts, read-only pages and axe/keyboard/viewport checks. Not password lifecycle or full accessibility certification.',results},null,2));
          console.log(JSON.stringify(entry));
        }
      }
    }
  } finally { await browser.close(); }
  if(results.some(r=>!r.pass)) process.exitCode=1;
})().catch(error=>{ console.error(JSON.stringify({name:error.name,code:error.code})); process.exitCode=1; });
