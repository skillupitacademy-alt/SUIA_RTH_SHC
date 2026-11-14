const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');const root=path.resolve(__dirname,'../..'),pnpm=path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');const env={...process.env,NODE_ENV:'test',JWT_SECRET:'policy-ab-disposable-access-key-0000000',JWT_REFRESH_SECRET:'policy-ab-disposable-refresh-key-000000'};for(const k of Object.keys(env))if(/DATABASE|UPSTASH|REDIS|QSTASH|SMTP|RESEND|OPENAI|GEMINI/.test(k))delete env[k];
const jobs=[
 ['sso-auth-tests',['--filter','@quiz/skillhubcore-service','exec','vitest','run','src/modules/auth','src/modules/user/__tests__','src/middleware/__tests__/verify-jwt.test.ts']],
 ['report-tests',['exec','vitest','run','--config','.evidence/r6-policy-ab/report-tests.vitest.config.mts']],
 ['chg03-bridge-tests',['--filter','@quiz/identity-bridge','test']],
 ['chg01b-tests',['--filter','@quiz/skillup-web','exec','vitest','run','src/lib/student-auth.test.ts','src/lib/student-auth-callers.test.ts','src/lib/student-auth-token-contract.test.ts','--maxWorkers=1']],
 ['service-typecheck',['--filter','@quiz/skillhubcore-service','type-check']],
 ['service-lint',['--filter','@quiz/skillhubcore-service','lint']],
 ['service-build',['--filter','@quiz/skillhubcore-service','build']],
 ['admin-typecheck',['--filter','@quiz/skillup-admin','exec','tsc','--noEmit']],
 ['admin-lint',['--filter','@quiz/skillup-admin','exec','eslint','--no-ignore','--max-warnings=0','src/lib/skillup-admin-data.ts','src/app/api/admin/students/[id]/route.ts','src/lib/__tests__/student-report-identity.test.ts']],
];let results=[];for(const [name,args]of jobs){const fd=fs.openSync(path.join(__dirname,name+'.log'),'w'),started=new Date().toISOString();const r=spawnSync(process.execPath,[pnpm,...args],{cwd:root,env,windowsHide:true,timeout:600000,stdio:['ignore',fd,fd]});fs.closeSync(fd);results.push({name,command:'pnpm '+args.join(' '),started,finished:new Date().toISOString(),exitCode:r.status,error:r.error?.code});fs.writeFileSync(path.join(__dirname,'QUALITY_RESULTS.json'),JSON.stringify({results,environment:'Controlled adapters and cleared database/provider environment'},null,2));console.log(name+' exit '+r.status);}
