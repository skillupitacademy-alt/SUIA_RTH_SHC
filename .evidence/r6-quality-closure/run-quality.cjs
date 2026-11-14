const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'../..'),pnpm=path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const env={...process.env,NODE_ENV:'test',NEXT_TELEMETRY_DISABLED:'1',JWT_SECRET:'quality-disposable-access-key-0000000',JWT_REFRESH_SECRET:'quality-disposable-refresh-key-000000'};
for(const key of Object.keys(env))if(/DATABASE|UPSTASH|QSTASH|REDIS|SMTP|RESEND|GEMINI|OPENAI/.test(key))delete env[key];
env.NODE_OPTIONS=((env.NODE_OPTIONS||'')+' --require='+path.join(__dirname,'offline-guard.cjs')).trim();
const jobs=[
['types-typecheck',['--filter','@quiz/types','exec','tsc','--noEmit','-p','tsconfig.json']],
['types-lint',['exec','eslint','--no-ignore','--config','packages/eslint-config/index.js','--max-warnings=0','packages/types/src/tutorial-repositories.types.ts']],
['api-typecheck',['--filter','@quiz/api-server','exec','tsc','--noEmit']],
['admin-typecheck',['--filter','@quiz/skillup-admin','type-check']],
['admin-lint',['--filter','@quiz/skillup-admin','lint','--max-warnings=0']],
['sso-auth-tests',['--filter','@quiz/skillhubcore-service','exec','vitest','run','src/modules/auth','src/modules/user/__tests__','src/middleware/__tests__/verify-jwt.test.ts']],
['report-tests',['exec','vitest','run','--config','.evidence/r6-policy-ab/report-tests.vitest.config.mts']],
['chg03-bridge-tests',['--filter','@quiz/identity-bridge','test']],
['chg01b-tests',['--filter','@quiz/skillup-web','exec','vitest','run','src/lib/student-auth.test.ts','src/lib/student-auth-callers.test.ts','src/lib/student-auth-token-contract.test.ts','--maxWorkers=1']],
['service-typecheck',['--filter','@quiz/skillhubcore-service','type-check']],
['service-lint',['--filter','@quiz/skillhubcore-service','lint']],
['service-build',['--filter','@quiz/skillhubcore-service','build']],
['admin-build',['--filter','@quiz/skillup-admin','exec','next','build','--webpack']],
['admin-typecheck-after-build',['--filter','@quiz/skillup-admin','type-check']],
];
let results=[];for(const [name,args]of jobs){const fd=fs.openSync(path.join(__dirname,name+'.log'),'w'),started=new Date().toISOString();const r=spawnSync(process.execPath,[pnpm,...args],{cwd:root,env:{...env,NODE_ENV:name==='admin-build'?'production':env.NODE_ENV},windowsHide:true,timeout:600000,stdio:['ignore',fd,fd]});fs.closeSync(fd);results.push({name,command:'pnpm '+args.join(' '),started,finished:new Date().toISOString(),exitCode:r.status,error:r.error?.code});fs.writeFileSync(path.join(__dirname,'QUALITY_RESULTS.json'),JSON.stringify({baseline:'ecbad61b9f117d83e724d3f9e6e3c8cb55f5665f',results,environment:'Cleared database/provider environment; network transport blocked by inherited Node preload; controlled persistence'},null,2));console.log(name+' exit '+r.status);}
