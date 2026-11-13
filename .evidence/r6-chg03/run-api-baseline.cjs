const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const env={...process.env,NODE_ENV:'test',JWT_SECRET:'chg03-disposable-access-key-00000000',JWT_REFRESH_SECRET:'chg03-disposable-refresh-key-000000'};
for(const key of Object.keys(env))if(/DATABASE|UPSTASH|QSTASH|REDIS|SMTP|RESEND|GEMINI|OPENAI/.test(key))delete env[key];
const pnpm=path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const args=['--filter','@quiz/api-server','exec','vitest','run','src/modules/auth/__tests__','--config','../../.evidence/r6-chg03/baseline-auth.vitest.config.mts','--maxWorkers=1','--reporter=verbose'];
const fd=fs.openSync(path.join(__dirname,'api-auth-baseline.log'),'w'),started=new Date().toISOString();
const result=spawnSync(process.execPath,[pnpm,...args],{cwd:path.resolve(__dirname,'../..'),env,windowsHide:true,timeout:600000,stdio:['ignore',fd,fd]});fs.closeSync(fd);fs.writeFileSync(path.join(__dirname,'API_AUTH_BASELINE_RESULT.json'),JSON.stringify({command:'pnpm '+args.join(' '),started,finished:new Date().toISOString(),exitCode:result.status},null,2));console.log('api auth exit '+result.status);
