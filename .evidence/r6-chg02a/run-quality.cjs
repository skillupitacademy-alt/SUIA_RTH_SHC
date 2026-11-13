const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const pnpm=path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const env={...process.env,NODE_ENV:'test',JWT_SECRET:'chg02a-isolated-test-access-secret-000000',JWT_REFRESH_SECRET:'chg02a-isolated-test-refresh-secret-00000'};
for(const key of Object.keys(env)) if(/DATABASE|REDIS|UPSTASH|QSTASH/.test(key)) delete env[key];
const results=[];
for(const [name,args] of [
 ['auth-tests',['--filter','@quiz/skillhubcore-service','exec','vitest','run','src/modules/auth','src/modules/user/__tests__','src/middleware/__tests__/verify-jwt.test.ts','--reporter=verbose']],
 ['typecheck',['--filter','@quiz/skillhubcore-service','type-check']],
 ['lint',['--filter','@quiz/skillhubcore-service','lint']],
 ['types-lint',['exec','eslint','--no-ignore','--config','packages/eslint-config/index.js','--max-warnings=0','packages/types/src/tutorial-repositories.types.ts']],
 ['chg01b-regressions',['--filter','@quiz/skillup-web','exec','vitest','run','src/lib/student-auth.test.ts','src/lib/student-auth-callers.test.ts','src/lib/student-auth-token-contract.test.ts','--pool=threads','--maxWorkers=1','--reporter=verbose']],
]){
 const fd=fs.openSync(path.join(__dirname,name+'.log'),'w'),started=new Date().toISOString();
 const result=spawnSync(process.execPath,[pnpm,...args],{cwd:root,env,windowsHide:true,timeout:600000,stdio:['ignore',fd,fd]});
 fs.closeSync(fd);results.push({name,command:'pnpm '+args.join(' '),started,finished:new Date().toISOString(),exitCode:result.status,error:result.error?.code});
 fs.writeFileSync(path.join(__dirname,'QUALITY_RESULTS.json'),JSON.stringify({baseline:'db2f5a6d0db1fb2f8ee7ae56942030b87c76898a',environment:'Controlled in-memory persistence, mocked providers, disposable signing keys; DB/Redis/QStash environment removed.',results},null,2));
 console.log(name+' exit '+result.status);
}
