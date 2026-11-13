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
  fs.writeFileSync(path.join(__dirname, 'quiz-answer-http-results.json'), JSON.stringify({ runId, timestamp: new Date().toISOString(), boundary: 'Actual local BFF/gateway/backend HTTP and headless Chromium with real password login, remote brand-local refresh session records and bounded synthetic identities. Secrets stay in memory. Database mutations and cleanup target only run-created UUIDs.', results, cleanupVerified }, null, 2));
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
  const a = await createFixture(brand, 'answer-owner-a');
  const b = await createFixture(brand, 'answer-owner-b');
  const context = await browser.newContext();
  const ids = Object.fromEntries(['domain','subject','topic','question','examQuestion'].map(key => [key,crypto.randomUUID()]));
  const idempotencyKey = crypto.randomUUID();
  try {
    record(brand + ' real answer-owner login',200,(await login(context,a)).status());
    for(const fixture of [a,b]) {
      await pools.main.query('INSERT INTO users(id,email,password_hash,email_verified) VALUES($1,$2,$3,true)',[fixture.id,fixture.email,'synthetic-unusable-password-hash']);
      fixture.examId=crypto.randomUUID();examIds.push(fixture.examId);
      await pools.main.query("INSERT INTO exams(id,user_id,status,duration_seconds) VALUES($1,$2,'started',3600)",[fixture.examId,fixture.id]);
    }
    await pools.main.query('INSERT INTO domains(id,name) VALUES($1,$2)',[ids.domain,runId]);
    await pools.main.query('INSERT INTO subjects(id,domain_id,name) VALUES($1,$2,$3)',[ids.subject,ids.domain,runId]);
    await pools.main.query('INSERT INTO topics(id,subject_id,name) VALUES($1,$2,$3)',[ids.topic,ids.subject,runId]);
    await pools.main.query("INSERT INTO questions(id,topic_id,difficulty,type,question_text,options,correct_answer) VALUES($1,$2,'simple','mcq',$3,$4,'A')",[ids.question,ids.topic,runId,JSON.stringify(['A','B'])]);
    await pools.main.query('INSERT INTO exam_questions(id,exam_id,question_id,"order") VALUES($1,$2,$3,1)',[ids.examQuestion,a.examId,ids.question]);
    async function answer(name,expected,examId,questionId,useKey=false) {
      const response=await request(context,a,'/api/quiz/answer','POST',{examId,questionId,answer:'A'},useKey?{'idempotency-key':idempotencyKey}:{});
      record(brand+' '+name,expected,response.status(),{route:'/api/quiz/answer',method:'POST'});
    }
    await answer('owned populated exam answer succeeds',200,a.examId,ids.question,true);
    const saved=(await pools.main.query('SELECT user_answer,is_correct FROM exam_questions WHERE id=$1',[ids.examQuestion])).rows[0];
    record(brand+' allowed answer is persisted and evaluated',true,saved?.user_answer==='A'&&saved?.is_correct===true);
    await answer('foreign exam denied even with accepted idempotency key',403,b.examId,ids.question,true);
    await answer('unrelated question denied even with accepted idempotency key',404,a.examId,crypto.randomUUID(),true);
    await pools.main.query("UPDATE exams SET status='completed' WHERE id=$1 AND user_id=$2",[a.examId,a.id]);
    await answer('completed exam rejects new answer despite earlier header cache',400,a.examId,ids.question);
    await answer('accepted same-resource retry remains compatible',200,a.examId,ids.question,true);
  } finally {
    try {
      await pools.main.query('DELETE FROM exam_questions WHERE id=$1',[ids.examQuestion]);
      await pools.main.query('DELETE FROM questions WHERE id=$1 AND question_text=$2',[ids.question,runId]);
      await pools.main.query('DELETE FROM topics WHERE id=$1 AND name=$2',[ids.topic,runId]);
      await pools.main.query('DELETE FROM subjects WHERE id=$1 AND name=$2',[ids.subject,runId]);
      await pools.main.query('DELETE FROM domains WHERE id=$1 AND name=$2',[ids.domain,runId]);
      record(brand+' answer hierarchy fixture cleanup',0,Number((await pools.main.query('SELECT count(*) AS n FROM domains WHERE id=$1',[ids.domain])).rows[0].n));
      if(environment.UPSTASH_REDIS_REST_URL&&environment.UPSTASH_REDIS_REST_TOKEN){
        const {Redis}=require('@upstash/redis');
        const redis=new Redis({url:environment.UPSTASH_REDIS_REST_URL,token:environment.UPSTASH_REDIS_REST_TOKEN});
        const keys=['exam-header:'+a.id+':'+a.examId,'exam-header:'+a.id+':'+b.examId,'exam-state:'+a.examId+':q:'+ids.question,'idem:ans:'+a.id+':'+idempotencyKey];
        await redis.del(...keys);
        record(brand+' exact run-owned remote answer-cache cleanup',0,await redis.exists(...keys));
      }
    } finally {await context.close();}
  }
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
