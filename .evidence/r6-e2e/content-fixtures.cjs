const fs = require('node:fs');
const crypto = require('node:crypto');
const { Pool } = require('pg');
const stateFile = '.local-secrets/r6-e2e-runtime.json';
const s = JSON.parse(fs.readFileSync(stateFile));
const pools = [];
async function pool(kind) {
  const p = new Pool({ connectionString: s.databases[kind], max: 1 });
  p.on('error', () => undefined); pools.push(p);
  const r = (await p.query("SELECT current_database() AS database,current_setting('neon.branch_id') AS branch")).rows[0];
  if (!r.database.startsWith(s.run + '_') || r.branch !== 'br-young-silence-a1b1ta26') throw new Error('Fixture target mismatch');
  return p;
}
async function main() {
  const tutorial = await pool('tutorial');
  const main = await pool('main');
  s.tutorialIds = {};
  for (const [key, table, parentKey, parentColumn] of [
    ['domains', 'tutorial_domains', null, null], ['subjects', 'tutorial_subjects', 'domains', 'domain_id'],
    ['topics', 'tutorial_topics', 'subjects', 'subject_id'], ['subtopics', 'tutorial_subtopics', 'topics', 'topic_id'],
  ]) {
    const id = crypto.randomUUID(); s.tutorialIds[key] = id;
    const names = ['id', 'external_id', 'name', 'slug'];
    const slug = s.run.replaceAll('_', '-') + '-' + key;
    const values = [id, s.ids[key], slug, slug];
    if (parentColumn) { names.push(parentColumn); values.push(s.tutorialIds[parentKey]); }
    await tutorial.query(`INSERT INTO ${table}(${names.join(',')}) VALUES(${values.map((_,i)=>'$'+(i+1)).join(',')})`, values);
  }
  s.nodeId = 'r6-qualified-page';
  s.tutorialPath = '/tutorial-v2/' + ['domains', 'subjects', 'topics', 'subtopics'].map(k => s.run.replaceAll('_', '-') + '-' + k).join('/') + '/' + s.nodeId;
  const document = { schemaVersion: 1, blocks: [
    { id: 'r6-heading', type: 'heading', content: { text: 'R6 isolated learning fixture', level: 1 } },
    { id: 'r6-paragraph', type: 'paragraph', content: { text: 'Synthetic content used only for database identity qualification.' } },
  ] };
  for (const brand of ['skillup', 'realtutorialhub']) {
    const tree = { topics: [{ id: s.nodeId, name: 'R6 qualified page', type: 'page', slug: s.nodeId, url: s.tutorialPath }] };
    await tutorial.query("INSERT INTO tutorial_sidebar_trees_v2(brand_id,domain_id,subject_id,topic_id,active_subtopic_id,tree,source_content,status) VALUES($1,$2,$3,$4,$5,$6,$7,'published')", [brand,s.ids.domains,s.ids.subjects,s.ids.topics,s.ids.subtopics,JSON.stringify(tree),JSON.stringify(tree)]);
    await tutorial.query("INSERT INTO tutorial_sections(subtopic_id,navigation_node_id,content,status,brand_id,brand_visibility,published_at) VALUES($1,$2,$3,'deployed',$4,'brand_exclusive',now())",[s.tutorialIds.subtopics,s.nodeId,JSON.stringify(document),brand]);
  }
  s.examIds = {};
  s.questionId = crypto.randomUUID();
  await main.query("INSERT INTO questions(id,topic_id,difficulty,type,question_text,options,correct_answer) VALUES($1,$2,'simple','mcq','Synthetic R6 question',$3,'A')", [s.questionId,s.ids.topics,JSON.stringify(['A','B'])]);
  for (const f of s.fixtures.filter(f => f.brand !== 'skillhubcore')) {
    const id = crypto.randomUUID(); s.examIds[f.brand] = id;
    await main.query("INSERT INTO exams(id,user_id,status,duration_seconds) VALUES($1,$2,'started',3600)",[id,f.id]);
    await main.query('INSERT INTO exam_questions(exam_id,question_id,"order") VALUES($1,$2,1)', [id,s.questionId]);
  }
  fs.writeFileSync(stateFile,JSON.stringify(s,null,2));
  fs.writeFileSync('.evidence/r6-e2e/CONTENT_FIXTURES.json',JSON.stringify({syntheticOnly:true,canonicalTutorialPath:s.tutorialPath,brands:['skillup','realtutorialhub'],distinctTutorialMappingIds:true,exams:2},null,2));
  console.log('Canonical synthetic tutorial and exam fixtures prepared');
}
main().catch(e=>{console.error(JSON.stringify({error:'Sanitized fixture failure',sqlstate:/^[A-Z0-9]{5}$/.test(e.code||'')?e.code:null}));process.exitCode=1;}).finally(async()=>{for(const p of pools)await p.end();});
