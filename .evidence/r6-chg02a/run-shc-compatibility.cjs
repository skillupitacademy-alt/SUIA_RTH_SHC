const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const args=['--filter','@quiz/api-server','exec','vitest','run','src/modules/auth/__tests__/batch-08-shc-session-binding.test.ts','--reporter=verbose'];
const env={...process.env,NODE_ENV:'test'};for(const k of Object.keys(env)) if(/DATABASE|REDIS|UPSTASH|QSTASH/.test(k)) delete env[k];
const started=new Date().toISOString(),fd=fs.openSync(path.join(__dirname,'shc-compatibility.log'),'w');
const result=spawnSync(process.execPath,[path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs'),...args],{cwd:path.resolve(__dirname,'../..'),env,windowsHide:true,timeout:300000,stdio:['ignore',fd,fd]});fs.closeSync(fd);
fs.writeFileSync(path.join(__dirname,'SHC_COMPATIBILITY_RESULT.json'),JSON.stringify({command:'pnpm '+args.join(' '),started,finished:new Date().toISOString(),exitCode:result.status,classification:'Existing mocked SHC login/logout compatibility tests, no real database or browser request.'},null,2));console.log('SHC compatibility exit '+result.status);
