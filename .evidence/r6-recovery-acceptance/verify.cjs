const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const dotenv=require('dotenv');
const {Pool}=require('pg');
const {readMigrationFiles}=require('drizzle-orm/migrator');
const settings=dotenv.parse(fs.readFileSync('.env.local'));
const production=new URL(settings.DATABASE_DIRECT_URL_PEOPLE||settings.DATABASE_URL_PEOPLE);
const protectedHost='ep-young-wildflower-a1frkuuj.ap-southeast-1.aws.neon.tech';
if(production.hostname.replace('-pooler.','.')!==protectedHost||production.pathname!=='/people_prod')throw new Error('Unexpected protected connection');
const restored=new URL(production);restored.hostname='ep-purple-water-a1tdj2jd.ap-southeast-1.aws.neon.tech';
const pools=[];
const report={startedUtc:new Date().toISOString(),command:'node .evidence/r6-recovery-acceptance/verify.cjs',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),readOnly:true,snapshot:{name:'production at 2026-11-14 12:31:12 UTC (manual)',timestampUtc:'2026-11-14T12:31:12Z',expiryDisplayed:'Never',historyHours:6,managementEvidence:'Authenticated Neon console previously confirmed snapshot creation. Owner confirms restore into br-withered-wave-a17wttsi.'},checks:[]};
const record=(name,pass)=>report.checks.push({name,status:pass?'PASS':'FAIL'});
const quote=value=>'"'+value.replaceAll('"','""')+'"';
async function inspect(url,branch){
 const pool=new Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:15000,options:'-c default_transaction_read_only=on -c statement_timeout=60000'});pool.on('error',()=>{});pools.push(pool);
 const client=await pool.connect();
 try{
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const result={};
  result.identity=(await client.query("SELECT current_database() AS database,current_user AS role,current_setting('neon.project_id') AS project,current_setting('neon.branch_id') AS branch,current_setting('transaction_read_only') AS read_only,clock_timestamp() AS observed_at")).rows[0];
  if(result.identity.project!=='bitter-tree-18287476'||result.identity.branch!==branch||result.identity.database!=='people_prod'||result.identity.read_only!=='on')throw new Error('Server-side target mismatch');
  result.ledger=(await client.query('SELECT hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at,id')).rows;
  result.tables=(await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name")).rows.map(row=>row.table_name);
  result.columns=(await client.query("SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position")).rows;
  result.constraints=(await client.query("SELECT t.relname AS table_name,c.conname,c.contype,c.convalidated,pg_get_constraintdef(c.oid,true) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE c.connamespace='public'::regnamespace ORDER BY t.relname,c.conname")).rows;
  result.indexes=(await client.query("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname")).rows;
  result.enums=(await client.query("SELECT t.typname,e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder")).rows;
  result.tableFingerprints=[];
  for(const table of result.tables){
   const row=(await client.query(`SELECT count(*)::int AS count,md5(COALESCE(string_agg(md5(to_jsonb(r)::text),'' ORDER BY md5(to_jsonb(r)::text)),'')) AS fingerprint FROM public.${quote(table)} r`)).rows[0];
   result.tableFingerprints.push({table,...row});
  }
  const foreignKeys=(await client.query("SELECT c.conname,c.convalidated,ns.nspname AS child_schema,ch.relname AS child_table,nr.nspname AS parent_schema,pr.relname AS parent_table,ARRAY(SELECT attname::text FROM unnest(c.conkey) WITH ORDINALITY k(num,ord) JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num ORDER BY k.ord) AS child_columns,ARRAY(SELECT attname::text FROM unnest(c.confkey) WITH ORDINALITY k(num,ord) JOIN pg_attribute a ON a.attrelid=c.confrelid AND a.attnum=k.num ORDER BY k.ord) AS parent_columns FROM pg_constraint c JOIN pg_class ch ON ch.oid=c.conrelid JOIN pg_namespace ns ON ns.oid=ch.relnamespace JOIN pg_class pr ON pr.oid=c.confrelid JOIN pg_namespace nr ON nr.oid=pr.relnamespace WHERE c.contype='f' AND ns.nspname='public' ORDER BY c.conname")).rows;
  result.foreignKeys=[];
  for(const key of foreignKeys){
   const present=key.child_columns.map(column=>'c.'+quote(column)+' IS NOT NULL').join(' AND ');
   const match=key.child_columns.map((column,index)=>'p.'+quote(key.parent_columns[index])+'=c.'+quote(column)).join(' AND ');
   const query=`SELECT count(*)::int AS count FROM ${quote(key.child_schema)}.${quote(key.child_table)} c WHERE ${present} AND NOT EXISTS(SELECT 1 FROM ${quote(key.parent_schema)}.${quote(key.parent_table)} p WHERE ${match})`;
   const orphans=(await client.query(query)).rows[0].count;
   result.foreignKeys.push({name:key.conname,validated:key.convalidated,orphans});
  }
  result.normalizedDuplicateGroups=Number((await client.query('SELECT count(*) AS count FROM (SELECT lower(trim(email)),platform FROM users WHERE deleted_at IS NULL GROUP BY lower(trim(email)),platform HAVING count(*)>1) duplicates')).rows[0].count);
  await client.query('ROLLBACK');return result;
 }finally{client.release();}
}
(async()=>{
 report.recovery=await inspect(restored,'br-withered-wave-a17wttsi');record('Restored target positively verified as owner-named branch',true);
 report.production=await inspect(production,'br-misty-wildflower-a1jalxmd');record('Production target positively verified and read-only',true);
 const same=key=>JSON.stringify(report.production[key])===JSON.stringify(report.recovery[key]);
 record('Both ledgers match pre-migration source through 0008',same('ledger')&&report.production.ledger.length===9&&report.production.ledger.every((row,index)=>{const m=readMigrationFiles({migrationsFolder:'packages/db-people/migrations'})[index];return row.hash===m.hash&&Number(row.created_at)===m.folderMillis;}));
 for(const key of ['tables','columns','constraints','indexes','enums'])record('Restored '+key+' match protected schema',same(key));
 record('Representative users, platform grants and session tables exist',['users','platform_access','sso_sessions'].every(table=>report.recovery.tables.includes(table)));
 record('All public table row counts and server-side fingerprints match',same('tableFingerprints'));
 record('Restored foreign keys validated with zero orphan rows',report.recovery.foreignKeys.every(key=>key.validated&&key.orphans===0));
 record('Protected foreign keys validated with zero orphan rows',report.production.foreignKeys.every(key=>key.validated&&key.orphans===0));
 record('Both branches have zero normalized same-platform conflicts',report.recovery.normalizedDuplicateGroups===0&&report.production.normalizedDuplicateGroups===0);
 const previous=JSON.parse(fs.readFileSync('.evidence/r6-cutover-preflight/PREFLIGHT.json'));
 record('Protected migration ledger unchanged from prior preflight',JSON.stringify(previous.ledger)===JSON.stringify(report.production.ledger));
})().catch(error=>{report.failure=/^[A-Z0-9]{5}$/.test(error.code||'')?error.code:error.name;report.failureLocations=String(error.stack||'').split('\n').filter(line=>line.includes('verify.cjs')).map(line=>line.replace(/.*verify.cjs/,'verify.cjs'));process.exitCode=1;}).finally(async()=>{
 for(const pool of pools)await pool.end();report.finishedUtc=new Date().toISOString();report.status=report.failure||report.checks.some(check=>check.status!=='PASS')?'FAIL_OR_REVIEW_REQUIRED':'PASS';
 fs.writeFileSync('.evidence/r6-recovery-acceptance/RECOVERY_ACCEPTANCE.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({status:report.status,checks:report.checks,recoveryIdentity:report.recovery?.identity,tableCount:report.recovery?.tables.length,foreignKeyCount:report.recovery?.foreignKeys.length,failure:report.failure}));
});
