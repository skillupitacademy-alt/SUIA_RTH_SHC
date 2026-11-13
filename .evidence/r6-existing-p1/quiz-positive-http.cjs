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
const runId = `r6-${crypto.randomUUID()}`;
const selectedBrands = process.env.R6_TEST_BRANDS ? process.env.R6_TEST_BRANDS.split(',') : ['skillup','realtutorialhub'];
assert.ok(selectedBrands.every(brand => ['skillup','realtutorialhub'].includes(brand)));
const results = [];
const fixtures = [];
const examIds = [];
const privateIds = { project: crypto.randomUUID(), submissions: [], requests: [] };
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
  fs.writeFileSync(path.join(__dirname, 'quiz-positive-http-results.json'), JSON.stringify({ runId, timestamp: new Date().toISOString(), boundary: 'Actual local BFF/gateway/backend HTTP and headless Chromium with real password login, remote brand-local refresh session records and bounded synthetic identities. Secrets stay in memory. Database mutations and cleanup target only run-created UUIDs.', results, cleanupVerified }, null, 2));
}
async function request(context, fixture, route, method = 'GET', body, headers = {}) {
  const cookies = await context.cookies(fixture.base);
  const csrf = cookies.find(cookie => cookie.name === 'csrfToken')?.value;
  return context.request.fetch(fixture.base + route, {
    method, headers: { origin: fixture.base, ...(csrf ? { 'x-csrf-token': csrf } : {}), ...headers },
    ...(body !== undefined ? { data: body } : {}), timeout: 240000, maxRedirects: 0,
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
  const examsRemaining=Number((await pools.main.query('SELECT count(*) AS n FROM exams WHERE id=ANY($1::uuid[])',[examIds])).rows[0].n);
  const mainUsersRemaining=Number((await pools.main.query('SELECT count(*) AS n FROM users WHERE id=ANY($1::uuid[])',[fixtures.map(f=>f.id)])).rows[0].n);
  const submissionResidue=Number((await pools.tutorial.query('SELECT count(*) AS n FROM tutorial_project_submissions WHERE id=ANY($1::uuid[])',[privateIds.submissions])).rows[0].n);
  const requestResidue=Number((await pools.tutorial.query('SELECT count(*) AS n FROM live_session_requests WHERE id=ANY($1::uuid[])',[privateIds.requests])).rows[0].n);
  cleanupVerified = allRemoved && examsRemaining===0 && mainUsersRemaining===0 && submissionResidue===0 && requestResidue===0;
  save();
  assert.ok(cleanupVerified, 'Run-created identity cleanup must complete');
}

const progressSubtopic = crypto.randomUUID();
async function probe(brand) {
  const fixture = await createFixture(brand, 'quiz-owner');
  const context = await browser.newContext();
  try {
    record(brand + ' real password login', 200, (await login(context, fixture)).status());
    await pools.main.query('INSERT INTO users(id,email,password_hash,email_verified) VALUES($1,$2,$3,true)', [fixture.id, fixture.email, 'synthetic-unusable-password-hash']);
    const examId = crypto.randomUUID();
    examIds.push(examId);
    await pools.main.query("INSERT INTO exams(id,user_id,status,duration_seconds) VALUES($1,$2,'started',3600)", [examId, fixture.id]);
    const response = await request(context, fixture, '/api/quiz/result?examId=' + examId);
    const body = await response.json();
    record(brand + ' warmed own started quiz result', 202, response.status(), {route:'/api/quiz/result',method:'GET',publicCode:body.code,requestId:response.headers()['x-request-id']});
  } finally { await context.close(); }
}
(async()=>{
  for(const [name,key] of [['people','DATABASE_URL_PEOPLE'],['skillup','DATABASE_URL_SKILLUP'],['realtutorialhub','DATABASE_URL_RTH'],['tutorial','DATABASE_URL_TUTORIAL'],['main','DATABASE_URL']]) {
    pools[name]=new Pool({connectionString:environment[key],max:2,connectionTimeoutMillis:10000,statement_timeout:15000});
  }
  browser=await chromium.launch({headless:true});
  try {
    for(const brand of selectedBrands) {
      try {await probe(brand);} catch(error){record(`${brand} authenticated probe execution`,'complete',error.name,{code:error.code});}
    }
  } finally {
    try {
      await pools.tutorial.query('DELETE FROM tutorial_project_submissions WHERE id=ANY($1::uuid[])',[privateIds.submissions]);
      await pools.tutorial.query('DELETE FROM tutorial_projects WHERE id=$1 AND title=$2',[privateIds.project,runId]);
      await pools.tutorial.query('DELETE FROM live_session_requests WHERE id=ANY($1::uuid[])',[privateIds.requests]);
      await pools.main.query('DELETE FROM exams WHERE id=ANY($1::uuid[])',[examIds]);
      for(const fixture of fixtures) await pools.main.query('DELETE FROM users WHERE id=$1 AND email=$2',[fixture.id,fixture.email]);
      for(const fixture of fixtures) await pools.tutorial.query('DELETE FROM tutorial_progress WHERE user_id=$1 AND subtopic_id=$2 AND tenant_id=$3',[fixture.id,progressSubtopic,fixture.brand]);
      await cleanup();
      const ids=fixtures.map(fixture=>fixture.id);
      assert.equal(Number((await pools.tutorial.query('SELECT count(*) AS n FROM tutorial_progress WHERE user_id=ANY($1::uuid[])',[ids])).rows[0].n),0);
    } finally {await browser.close();await Promise.all(Object.values(pools).map(pool=>pool.end()));}
  }
  if(results.some(result=>!result.pass))process.exitCode=1;
})().catch(error=>{console.error(JSON.stringify({name:error.name,code:error.code}));process.exitCode=1;});
