const fs = require('node:fs');
const path = require('node:path');
const original = fs.readFileSync(path.join(__dirname, 'authenticated-http.cjs'), 'utf8');
const prefix = original.slice(0, original.indexOf('async function probe(brand)'));
const suffix = original.slice(original.lastIndexOf('(async()=>{'));
const probe = `async function probe(brand) {
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
`;
fs.writeFileSync(path.join(__dirname, 'quiz-answer-http.cjs'), (prefix + probe + suffix).replaceAll('authenticated-http-results.json', 'quiz-answer-http-results.json'));
