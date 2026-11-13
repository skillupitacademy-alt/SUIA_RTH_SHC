const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { chromium } = require('@playwright/test');
neonConfig.webSocketConstructor = require('ws');
const root = path.resolve(__dirname, '../..');
const environment = require('dotenv').parse(fs.readFileSync(path.join(root, '.env.local')));
const ids = Object.fromEntries(['user', 'domain', 'subject', 'topic', 'question'].map(key => [key, crypto.randomUUID()]));
const marker = 'r6-shc-populated-' + ids.user;
const email = marker + '@example.invalid';
const password = crypto.randomBytes(24).toString('base64url');
const people = new Pool({ connectionString: environment.DATABASE_URL_PEOPLE, max: 1, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
const main = new Pool({ connectionString: environment.DATABASE_URL, max: 1, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
const results = [];
let cleanupVerified = false;
let browser;
function save() {
  fs.writeFileSync(path.join(__dirname, 'shc-populated-http-results.json'), JSON.stringify({
    baseline: '62f920f4782b8bbb277f88dc27930cd3b86f1b15',
    boundary: 'Real local SHC password login/BFF/backend and run-owned populated MainDB question. Remote development fixture writes only. No existing question mutated.',
    timestamp: new Date().toISOString(), results, cleanupVerified,
  }, null, 2));
}
function record(name, expected, actual) {
  results.push({ name, expected, actual, pass: expected === actual });
  console.log(JSON.stringify(results.at(-1)));
  save();
}
(async () => {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const base = 'http://skillhubcore.localhost:3007';
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await people.query("INSERT INTO users(id,email,password_hash,role,platform,is_active) VALUES($1,$2,$3,'admin','skillhubcore',true)", [ids.user, email, passwordHash]);
    await main.query('INSERT INTO users(id,email,password_hash,email_verified) VALUES($1,$2,$3,true)', [ids.user, email, passwordHash]);
    await main.query('INSERT INTO domains(id,name) VALUES($1,$2)', [ids.domain, marker]);
    await main.query('INSERT INTO subjects(id,domain_id,name) VALUES($1,$2,$3)', [ids.subject, ids.domain, marker]);
    await main.query('INSERT INTO topics(id,subject_id,name) VALUES($1,$2,$3)', [ids.topic, ids.subject, marker]);
    await main.query("INSERT INTO questions(id,topic_id,difficulty,type,question_text,options,correct_answer) VALUES($1,$2,'simple','mcq',$3,$4,'A')", [ids.question, ids.topic, marker, JSON.stringify(['A', 'B'])]);
    const login = await context.request.post(base + '/api/auth/login', { data: { email, password }, headers: { origin: base }, timeout: 240000 });
    record('SHC synthetic real password login', 200, login.status());
    if (login.status() !== 200) return;
    const cookies = await context.cookies(base);
    const access = cookies.find(cookie => cookie.name === 'accessToken')?.value;
    if (!access) throw new Error('Missing SHC access cookie');
    const target = '/api/admin/questions/' + ids.question;
    async function check(name, status, backend = false, method = 'GET') {
      const response = await context.request.fetch((backend ? 'http://localhost:3000' : base) + target, {
        method, timeout: 240000,
        headers: backend ? { authorization: 'Bearer ' + access, 'x-portal-identity': 'shc-admin' } : { origin: base },
      });
      record(name, status, response.status());
      if (response.status() === 200) {
        const body = await response.json();
        record(name + ' returns the run-owned question', ids.question, body.id || body.data?.id);
      }
    }
    await check('SHC authorized BFF populated question read', 200);
    await check('SHC authorized backend populated question read', 200, true);
    await people.query("UPDATE users SET role='super_admin' WHERE id=$1 AND email=$2", [ids.user, email]);
    await check('SHC current super-admin retains existing read', 200);
    await people.query('UPDATE users SET is_active=false WHERE id=$1 AND email=$2', [ids.user, email]);
    await check('SHC disabled account denied at BFF', 403);
    await check('SHC disabled account denied at backend', 403, true);
    await people.query("UPDATE users SET is_active=true,role='faculty' WHERE id=$1 AND email=$2", [ids.user, email]);
    await check('SHC demoted faculty cannot delete populated question', 403, true, 'DELETE');
    await people.query("UPDATE users SET role='student' WHERE id=$1 AND email=$2", [ids.user, email]);
    await check('SHC demoted student cannot delete populated question', 403, true, 'DELETE');
    record('Denied mutations preserve the populated question', 1, (await main.query('SELECT id FROM questions WHERE id=$1 AND question_text=$2', [ids.question, marker])).rowCount);
  } finally {
    try {
      await main.query('DELETE FROM questions WHERE id=$1 AND question_text=$2', [ids.question, marker]);
      await main.query('DELETE FROM topics WHERE id=$1 AND name=$2', [ids.topic, marker]);
      await main.query('DELETE FROM subjects WHERE id=$1 AND name=$2', [ids.subject, marker]);
      await main.query('DELETE FROM domains WHERE id=$1 AND name=$2', [ids.domain, marker]);
      await main.query('DELETE FROM audit_logs WHERE user_id=$1', [ids.user]);
      await main.query('DELETE FROM users WHERE id=$1 AND email=$2', [ids.user, email]);
      await people.query('DELETE FROM users WHERE id=$1 AND email=$2', [ids.user, email]);
      const counts = await Promise.all([
        main.query('SELECT count(*) AS n FROM questions WHERE id=$1', [ids.question]),
        main.query('SELECT count(*) AS n FROM domains WHERE id=$1', [ids.domain]),
        main.query('SELECT count(*) AS n FROM users WHERE id=$1', [ids.user]),
        people.query('SELECT count(*) AS n FROM users WHERE id=$1', [ids.user]),
      ]);
      cleanupVerified = counts.every(result => Number(result.rows[0].n) === 0);
      save();
    } finally {
      await context.close();
      await browser.close();
      await Promise.all([main.end(), people.end()]);
    }
  }
  if (!cleanupVerified || results.some(result => !result.pass)) process.exitCode = 1;
})().catch(error => { console.error(JSON.stringify({ name: error.name, code: error.code })); process.exitCode = 1; });
