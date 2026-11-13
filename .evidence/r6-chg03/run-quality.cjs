const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');const root=path.resolve(__dirname,'../..'),pnpm=path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');const env={...process.env,NODE_ENV:'test',JWT_SECRET:'chg03-disposable-access-key-00000000',JWT_REFRESH_SECRET:'chg03-disposable-refresh-key-000000'};for(const k of Object.keys(env))if(/DATABASE|REDIS|UPSTASH|QSTASH|SMTP|RESEND|GEMINI|OPENAI/.test(k))delete env[k];
const jobs=[
 ['bridge-tests',['--filter','@quiz/identity-bridge','test']],
 ['seed-tests',['--filter','@quiz/db-people','exec','vitest','run','src/__tests__/seed-user-conflict.test.ts']],
 ['chg02a-tests',['--filter','@quiz/skillhubcore-service','exec','vitest','run','src/modules/auth','src/modules/user/__tests__','src/middleware/__tests__/verify-jwt.test.ts']],
 ['chg01b-tests',['--filter','@quiz/skillup-web','exec','vitest','run','src/lib/student-auth.test.ts','src/lib/student-auth-callers.test.ts','src/lib/student-auth-token-contract.test.ts','--maxWorkers=1']],
 ['bridge-typecheck',['--filter','@quiz/identity-bridge','type-check']],
 ['people-typecheck',['--filter','@quiz/db-people','type-check']],
 ['api-typecheck',['--filter','@quiz/api-server','exec','tsc','--noEmit']],
 ['bridge-lint',['exec','eslint','--config','packages/eslint-config/index.js','--max-warnings=0','packages/identity-bridge/src/UserIdentityBridgeService.ts','packages/identity-bridge/src/types.ts','packages/identity-bridge/src/index.ts','packages/identity-bridge/src/__tests__/bridge.service.test.ts']],
 ['people-lint',['--filter','@quiz/db-people','exec','eslint','--no-ignore','--max-warnings=0','src/seed-skillup.ts','src/__tests__/seed-user-conflict.test.ts']],
 ['api-lint',['--filter','@quiz/api-server','exec','eslint','--no-ignore','--max-warnings=0','src/modules/auth/login.service.ts','src/modules/auth/signup.service.ts','src/modules/auth/admin-auth.service.ts']],
 ['admin-typecheck',['--filter','@quiz/skillup-admin','exec','tsc','--noEmit']],
 ['admin-lint',['--filter','@quiz/skillup-admin','exec','eslint','--no-ignore','--max-warnings=0','src/app/api/admin/students/route.ts','src/app/api/admin/students/[id]/route.ts']],
];let results=[];for(const [name,args]of jobs){const fd=fs.openSync(path.join(__dirname,name+'-final.log'),'w'),started=new Date().toISOString();const r=spawnSync(process.execPath,[pnpm,...args],{cwd:root,env,windowsHide:true,timeout:600000,stdio:['ignore',fd,fd]});fs.closeSync(fd);results.push({name,command:'pnpm '+args.join(' '),started,finished:new Date().toISOString(),exitCode:r.status,error:r.error?.code});fs.writeFileSync(path.join(__dirname,'QUALITY_RESULTS.json'),JSON.stringify({results,environment:'Controlled adapters; database/provider environment removed'},null,2));console.log(name+' exit '+r.status);}
