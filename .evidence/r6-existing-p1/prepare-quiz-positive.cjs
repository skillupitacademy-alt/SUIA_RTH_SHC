const fs = require('node:fs');
const path = require('node:path');
const original = fs.readFileSync(path.join(__dirname, 'authenticated-http.cjs'), 'utf8');
const prefix = original.slice(0, original.indexOf('async function probe(brand)'));
const suffix = original.slice(original.lastIndexOf('(async()=>{'));
const probe = `async function probe(brand) {
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
`;
fs.writeFileSync(path.join(__dirname, 'quiz-positive-http.cjs'), (prefix + probe + suffix).replaceAll('authenticated-http-results.json', 'quiz-positive-http-results.json'));
