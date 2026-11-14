const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const env = { ...process.env, NODE_ENV:'test', NEXT_TELEMETRY_DISABLED:'1' };
for(const key of Object.keys(env)) if(/DATABASE|UPSTASH|QSTASH|REDIS|SMTP|RESEND|OPENAI|GEMINI/.test(key)) delete env[key];
env.NODE_OPTIONS = ((env.NODE_OPTIONS || '') + ' --require=' + path.join(__dirname,'offline-guard.cjs')).trim();
const pnpm = path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const jobs = [
 ['package-typecheck',['--filter','@quiz/db-people','type-check']],
 ['cli-typecheck',['exec','tsc','--noEmit','-p','.evidence/r6-final-migration/tsconfig.cli.json']],
 ['affected-lint',['--filter','@quiz/db-people','exec','eslint','--no-ignore','--max-warnings=0','--parser-options','{"project":"../../.evidence/r6-final-migration/tsconfig.cli.json"}','src/migration-compatibility.ts','scripts/migrate.mts']],
 ['focused-regressions',['--filter','@quiz/db-people','exec','vitest','run','src/__tests__/seed-user-conflict.test.ts','src/utils/__tests__/email-normalization.test.ts','--maxWorkers=1']],
 ['package-build',['--filter','@quiz/db-people','build']],
];
const results=[];
for(const [name,args] of jobs){
 const file=fs.openSync(path.join(__dirname,name+'.log'),'w');const started=new Date().toISOString();
 const result=spawnSync(process.execPath,[pnpm,...args],{cwd:path.resolve(__dirname,'../..'),env,windowsHide:true,timeout:600000,stdio:['ignore',file,file]});fs.closeSync(file);
 results.push({name,command:'pnpm '+args.join(' '),started,finished:new Date().toISOString(),exitCode:result.status,error:result.error?.code});
 fs.writeFileSync(path.join(__dirname,'QUALITY_RESULTS.json'),JSON.stringify({environment:'Network transport blocked; no database/provider calls',results},null,2));console.log(name+' exit '+result.status);
}
