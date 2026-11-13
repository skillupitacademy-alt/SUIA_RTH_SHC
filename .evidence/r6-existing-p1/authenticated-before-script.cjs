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
  fs.writeFileSync(path.join(__dirname, 'authenticated-http-results.json'), JSON.stringify({ runId, timestamp: new Date().toISOString(), boundary: 'Actual local BFF/gateway/backend HTTP and headless Chromium with real password login, remote brand-local refresh session records and bounded synthetic identities. Secrets stay in memory. Database mutations and cleanup target only run-created UUIDs.', results, cleanupVerified }, null, 2));
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
  const a = await createFixture(brand, 'owner-a');
  const b = await createFixture(brand, 'owner-b');
  const first = await browser.newContext();
  const second = await browser.newContext();
  try {
    const firstLogin=await login(first,a);
    record(`${brand} synthetic A local password login`,200,firstLogin.status());
    assert.equal(firstLogin.status(),200);
    const secondLogin=await login(second,b);
    record(`${brand} synthetic B local password login`,200,secondLogin.status());
    assert.equal(secondLogin.status(),200);
    const progress = pools.tutorial;
    for (const [fixture,blocks] of [[a,['notes']],[b,['code']]]) {
      await progress.query('INSERT INTO tutorial_progress(user_id,subtopic_id,tenant_id,blocks_completed) VALUES($1,$2,$3,$4)',[fixture.id,progressSubtopic,brand,JSON.stringify(blocks)]);
    }
    for (const [context,fixture] of [[first,a],[second,b]]) {
      const profile = await request(context,fixture,'/api/profile');
      const body = await profile.json();
      const data = body.data?.user || body.data || body.user || body;
      record(`${brand} own profile identity`,fixture.id,data.userId || data.id,{route:'/api/profile',method:'GET',status:profile.status()});
      record(`${brand} own private profile cache`,true,/private/.test(profile.headers()['cache-control']||'')&&/no-store/.test(profile.headers()['cache-control']||''));
    }
    const attempted = await request(first,a,`/api/profile?userId=${b.id}`, 'GET',undefined,{'x-user-id':b.id,'x-original-user-id':b.id,'x-user-roles':'super_admin','x-brand':brand});
    const attemptedBody = await attempted.json();
    const attemptedData = attemptedBody.data?.user || attemptedBody.data || attemptedBody.user || attemptedBody;
    record(`${brand} forged profile subject cannot read B`,true,attempted.status()===403 || (attempted.status()===200 && (attemptedData.userId||attemptedData.id)===a.id));
    // Started empty exams exercise ownership without invoking scoring or providers.
    for (const fixture of [a,b]) {
      await pools.main.query('INSERT INTO users(id,email,password_hash,email_verified) VALUES($1,$2,$3,true)',[fixture.id,fixture.email,'synthetic-unusable-password-hash']);
      fixture.examId = crypto.randomUUID(); examIds.push(fixture.examId);
      await pools.main.query("INSERT INTO exams(id,user_id,status,duration_seconds) VALUES($1,$2,'started',3600)",[fixture.examId,fixture.id]);
    }
    const ownExam=await request(first,a,`/api/quiz/result?examId=${a.examId}`);
    record(`${brand} own started exam result positive`,202,ownExam.status(),{route:'/api/quiz/result',method:'GET'});
    const foreignExam=await request(first,a,`/api/quiz/result?examId=${b.examId}`);
    record(`${brand} foreign exam result denied`,403,foreignExam.status(),{route:'/api/quiz/result',method:'GET'});
    const forgedExam=await request(first,a,`/api/quiz/result?examId=${b.examId}`,'GET',undefined,{'x-user-id':b.id,'x-original-user-id':b.id,'x-user-roles':'super_admin'});
    record(`${brand} forged headers cannot grant foreign exam access`,403,forgedExam.status());
    const deniedSubmit=await request(first,a,'/api/quiz/submit','POST',{examId:b.examId,userId:b.id});
    record(`${brand} foreign exam submit denied`,403,deniedSubmit.status(),{route:'/api/quiz/submit',method:'POST'});
    const foreignExamState=(await pools.main.query('SELECT status FROM exams WHERE id=$1',[b.examId])).rows[0]?.status;
    record(`${brand} foreign submit leaves persisted exam untouched`,'started',foreignExamState);
    const deniedAnswer=await request(first,a,'/api/quiz/answer','POST',{examId:b.examId,questionId:crypto.randomUUID(),answer:'A',userId:b.id});
    record(`${brand} foreign exam answer denied`,[401,403],deniedAnswer.status(),{route:'/api/quiz/answer',method:'POST'});
    const sessions = await request(first,a,'/api/auth/sessions');
    record(`${brand} own session listing positive`,200,sessions.status(),{route:'/api/auth/sessions',method:'GET'});
    const bHash = crypto.createHash('sha256').update((await second.cookies()).find(cookie=>cookie.name==='refreshToken').value).digest('hex');
    const bSession=(await pools[brand].query('SELECT id FROM refresh_tokens WHERE user_id=$1 AND token=$2',[b.id,bHash])).rows[0];
    record(`${brand} foreign device revocation denied`,404,(await request(first,a,`/api/auth/sessions/${bSession.id}`,'DELETE')).status(),{route:'/api/auth/sessions/[sessionId]',method:'DELETE'});
    record(`${brand} B remains valid after foreign revocation attempt`,200,(await request(second,b,'/api/profile')).status());
    const profileMutation = await request(first,a,'/api/profile','PATCH',{name:'R6 owner A',userId:b.id});
    record(`${brand} allowed profile edit or strict field rejection`,[200,400,422],profileMutation.status(),{route:'/api/profile',method:'PATCH'});
    const bName=(await pools[brand].query('SELECT name FROM user_profiles WHERE user_id=$1',[b.id])).rows[0]?.name;
    record(`${brand} forged profile update cannot change B`, 'Synthetic owner-b',bName);
    const ownedProfiles = (await pools[brand].query('SELECT user_id,name FROM user_profiles WHERE user_id=ANY($1::uuid[])', [[a.id,b.id]])).rows;
    record(`${brand} profile ownership rows cannot be reassigned or duplicated`,true,
      ownedProfiles.filter(row=>row.user_id===a.id).length===1 && ownedProfiles.filter(row=>row.user_id===b.id).length===1 && ownedProfiles.find(row=>row.user_id===b.id)?.name==='Synthetic owner-b');
    record(`${brand} hostile-origin profile mutation denied`,403,(await request(first,a,'/api/profile','PATCH',{name:'Rejected'},{origin:'https://evil.example'})).status());
    for (const [context,fixture,expected] of [[first,a,['notes']],[second,b,['code']]]) {
      const response=await request(context,fixture,`/api/tutorial/progress?subtopicId=${progressSubtopic}`);
      const body=await response.json();
      record(`${brand} own progress ${fixture===a?'A':'B'} positive`,200,response.status(),{route:'/api/tutorial/progress',method:'GET'});
      record(`${brand} own progress ${fixture===a?'A':'B'} data isolated`,JSON.stringify(expected),JSON.stringify(body.data?.blocksCompleted));
    }
    const foreignProgress=await request(first,a,`/api/tutorial/progress?subtopicId=${progressSubtopic}&userId=${b.id}`,'GET',undefined,{'x-user-id':b.id});
    const progressBody=await foreignProgress.json();
    record(`${brand} progress client subject override denied or scoped to A`,true,foreignProgress.status()===403 || (foreignProgress.status()===200 && JSON.stringify(progressBody.data?.blocksCompleted)==='["notes"]'));
    const otherBrand=brand==='skillup'?'realtutorialhub':'skillup';
    const foreign=await browser.newContext();
    try {
      const credentials=(await first.cookies()).filter(cookie=>['accessToken','refreshToken'].includes(cookie.name));
      await foreign.addCookies(credentials.map(cookie=>({...cookie,domain:`${otherBrand}.localhost`})));
      const other={...a,base:`http://${otherBrand}.localhost:${otherBrand==='skillup'?3009:3003}`};
      record(`${brand} complete cookie pair rejected by foreign brand`,403,(await request(foreign,other,`/api/tutorial/progress?subtopicId=${progressSubtopic}`)).status());
    } finally {await foreign.close();}
    const writeProgress=await request(first,a,'/api/tutorial/progress','POST',{subtopicId:progressSubtopic,blockType:'technical',status:'viewed',userId:b.id});
    record(`${brand} own progress mutation positive`,200,writeProgress.status(),{route:'/api/tutorial/progress',method:'POST'});
    const retainedB=(await pools.tutorial.query('SELECT blocks_completed FROM tutorial_progress WHERE user_id=$1 AND subtopic_id=$2 AND tenant_id=$3',[b.id,progressSubtopic,brand])).rows[0];
    record(`${brand} progress mutation cannot overwrite B`, '["code"]',JSON.stringify(retainedB.blocks_completed));
    if (brand==='realtutorialhub') {
      await pools.tutorial.query("INSERT INTO tutorial_projects(id,scope,parent_id,level,title,deliverable_type,evaluation_type) VALUES($1,'topic',$2,'simple',$3,'repo','manual')",[privateIds.project,progressSubtopic,runId]);
      for(const fixture of [a,b]){
        fixture.submissionId=crypto.randomUUID();privateIds.submissions.push(fixture.submissionId);
        fixture.requestId=crypto.randomUUID();privateIds.requests.push(fixture.requestId);
        await pools.tutorial.query("INSERT INTO tutorial_project_submissions(id,user_id,project_id,project_level,difficulty,submission_content) VALUES($1,$2,$3,'simple','simple',$4)",[fixture.submissionId,fixture.id,privateIds.project,JSON.stringify({marker:fixture.id})]);
        await pools.tutorial.query("INSERT INTO live_session_requests(id,student_id,subtopic_id,doubt_text) VALUES($1,$2,$3,$4)",[fixture.requestId,fixture.id,progressSubtopic,runId]);
      }
      for(const [context,fixture,other] of [[first,a,b],[second,b,a]]){
        for(const [route,ownId,foreignId] of [
          ['/api/tutorial/projects/submissions',fixture.submissionId,other.submissionId],
          ['/api/tutorial/sessions/my-requests',fixture.requestId,other.requestId],
        ]){
          const response=await request(context,fixture,route+`?userId=${other.id}&studentId=${other.id}`,'GET',undefined,{'x-user-id':other.id});
          const payload=await response.json();const records=payload.data;
          record(`RTH populated ${route} authorized positive`,200,response.status(),{route,method:'GET'});
          record(`RTH populated ${route} includes own and excludes foreign`,true,Array.isArray(records)&&records.some(row=>row.id===ownId)&&!records.some(row=>row.id===foreignId));
          record(`RTH populated ${route} private cache`,true,/private/.test(response.headers()['cache-control']||'')&&/no-store/.test(response.headers()['cache-control']||''));
        }
      }
      const foreignCancel=await request(first,a,`/api/tutorial/sessions/${b.requestId}`,'DELETE');
      record('RTH foreign session-request cancellation denied',403,foreignCancel.status(),{route:'/api/tutorial/sessions/[requestId]',method:'DELETE'});
      const ownCancel=await request(first,a,`/api/tutorial/sessions/${a.requestId}`,'DELETE');
      record('RTH authorized own session-request cancellation succeeds',200,ownCancel.status(),{route:'/api/tutorial/sessions/[requestId]',method:'DELETE'});
      const foreignRow=(await pools.tutorial.query('SELECT status FROM live_session_requests WHERE id=$1',[b.requestId])).rows[0];
      record('RTH denied cancellation preserves foreign request','pending',foreignRow?.status);
    }
  } finally {await Promise.all([first.close(),second.close()]);}
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
