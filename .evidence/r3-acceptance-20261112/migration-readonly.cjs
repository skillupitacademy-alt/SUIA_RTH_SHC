const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {Pool,neonConfig} = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = require('ws');
const root = path.resolve(__dirname,'../..');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
(async()=>{
  const env = require('dotenv').parse(fs.readFileSync(path.join(root,'.env.local')));
  const pool = new Pool({connectionString:env.DATABASE_DIRECT_URL_TUTORIAL || env.DATABASE_URL_TUTORIAL,max:1,connectionTimeoutMillis:10000});
  const client = await pool.connect();
  const live = {};
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout='15s'");
    live.ledger = (await client.query('SELECT hash,created_at::text FROM drizzle.__drizzle_migrations ORDER BY created_at,id')).rows;
    live.enums = (await client.query("SELECT t.typname,e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname IN ('brand','section_type') ORDER BY t.typname,e.enumsortorder")).rows;
    live.tables = (await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(r=>r.tablename);
    live.indexes = (await client.query("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN ('tutorial_sections','tutorial_progress','tutorial_page_content_v2') ORDER BY tablename,indexname")).rows;
    live.constraints = (await client.query("SELECT c.conname,pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c WHERE c.conrelid='public.tutorial_progress'::regclass ORDER BY c.conname")).rows;
    live.backfill = (await client.query('SELECT count(*)::int AS total, count(*) FILTER (WHERE educational_architecture_id IS NULL)::int AS missing_architecture, count(*) FILTER (WHERE ui_architecture_id IS NULL)::int AS missing_ui_architecture FROM tutorial_sections')).rows[0];
  } finally { await client.query('ROLLBACK'); client.release(); await pool.end(); }
  const dir=path.join(root,'packages/db-tutorial/migrations');
  const candidates=fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).map(file=>{
    const raw=fs.readFileSync(path.join(dir,file));
    return {file,raw:hash(raw),lf:hash(raw.toString().replace(/\r\n/g,'\n'))};
  });
  const target='833cf27c73ba6de093f2e73e2ba0ac7dd77fe908bb190e91ea8cfd23aa4a3578';
  let objects = [];
  let historyScanStatus = 'completed';
  try {
    objects=execFileSync('git',['rev-list','--objects','--all','--','packages/db-tutorial/migrations'],{cwd:root,encoding:'utf8',timeout:30000,env:{...process.env,GIT_NO_LAZY_FETCH:'1'}}).trim().split(/\r?\n/).filter(line=>line.endsWith('.sql'));
  } catch {
    historyScanStatus = 'Full local history traversal unavailable within 30 seconds; retain prior 79-object R2 scan and independent exact historical blob checks. Target remains unresolved.';
  }
  const matches=[];
  for(const line of objects) {
    const [oid,...parts]=line.split(' ');
    const raw=execFileSync('git',['cat-file','blob',oid],{cwd:root,env:{...process.env,GIT_NO_LAZY_FETCH:'1'},stdio:['ignore','pipe','ignore']});
    if(hash(raw)===target || hash(raw.toString().replace(/\r\n/g,'\n'))===target) matches.push({oid,path:parts.join(' '),rawHash:hash(raw)});
  }
  const journal=JSON.parse(fs.readFileSync(path.join(dir,'meta/_journal.json'))).entries;
  const last=Math.max(...live.ledger.map(r=>Number(r.created_at)));
  const skipped=journal.filter(j=>j.when<=last && !live.ledger.some(r=>candidates.some(c=>c.file===`${j.tag}.sql` && [c.raw,c.lf].includes(r.hash)))).map(j=>j.tag);
  const report={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),timestamp:new Date().toISOString(),boundary:'Fresh BEGIN READ ONLY PostgreSQL metadata/counts; exact local historical Git SQL blob fingerprints. No migration or ledger/data edits.',historyScanStatus,historicalSqlBlobsChecked:objects.length,unresolvedTarget:target,exactHistoricalMatches:matches,currentSourceMatchedLedgerRows:live.ledger.filter(r=>candidates.some(c=>[c.raw,c.lf].includes(r.hash))).length,skippedJournalTags:skipped,pendingJournalTags:journal.filter(j=>j.when>last).map(j=>j.tag),live};
  fs.writeFileSync(path.join(__dirname,'migration-readonly-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({historicalBlobs:objects.length,matches:matches.length,ledgerRows:live.ledger.length,currentMatched:report.currentSourceMatchedLedgerRows,skippedJournal:skipped.length,pending:report.pendingJournalTags}));
})().catch(error=>{console.error(JSON.stringify({name:error.name,code:error.code}));process.exitCode=1;});
