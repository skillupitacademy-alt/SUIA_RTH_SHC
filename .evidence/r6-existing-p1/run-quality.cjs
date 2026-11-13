const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');const root=path.resolve(__dirname,'../..');const pnpm=path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');const results=[];
function gate(name,args,cwd=root){const fd=fs.openSync(path.join(__dirname,name+'.log'),'w');const started=new Date().toISOString();const r=spawnSync(process.execPath,[pnpm,...args],{cwd,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},windowsHide:true,timeout:900000,stdio:['ignore',fd,fd]});fs.closeSync(fd);results.push({name,command:'pnpm '+args.join(' '),cwd,started,finished:new Date().toISOString(),exitCode:r.status,error:r.error?.code});fs.writeFileSync(path.join(__dirname,'QUALITY_RESULTS.json'),JSON.stringify({baseline:'62f920f4782b8bbb277f88dc27930cd3b86f1b15',results},null,2));console.log(name+' exit '+r.status);}
gate('api-exam-regressions',['--filter','@quiz/api-server','exec','vitest','run','src/modules/exam-engine/__tests__/exam.engine.tail2.test.ts','src/modules/exam-engine/__tests__/exam.engine.test.ts','--pool=threads','--maxWorkers=1','--reporter=verbose']);
gate('api-typecheck',['--filter','@quiz/api-server','exec','tsc','--noEmit']);
gate('api-lint',['--filter','@quiz/api-server','exec','eslint','src/modules/exam-engine/exam.engine.ts','src/modules/auth/admin-audience.util.ts','--max-warnings=0']);
gate('shc-typecheck',['--filter','@quiz/skillhubcore-admin','type-check']);
gate('shc-lint',['--filter','@quiz/skillhubcore-admin','exec','eslint','src/lib/__tests__/r6-action-authorization.test.ts','--max-warnings=0']);
gate('shared-source-lint',['exec','eslint','--config','.eslintrc.json','../../src/share-branding/middleware/authProxy.ts','--max-warnings=0'],path.join(root,'apps/skillup-web'));
gate('rth-targeted',['--filter','@quiz/realtutorialhub-web','exec','vitest','run','src/app/api/tutorial/sessions/__tests__/r6-cancellation-security.test.ts','src/app/api/tutorial/sessions/__tests__/routes.test.ts','--environment=node','--pool=threads','--maxWorkers=1','--reporter=verbose']);
gate('rth-typecheck',['--filter','@quiz/realtutorialhub-web','type-check']);
gate('rth-lint',['--filter','@quiz/realtutorialhub-web','lint','--max-warnings=0']);
gate('suia-typecheck',['--filter','@quiz/skillup-web','type-check']);
gate('suia-lint',['--filter','@quiz/skillup-web','lint','--max-warnings=0']);
gate('shc-boundaries',['--filter','@quiz/skillhubcore-admin','check:boundaries']);
if(results.some(r=>r.exitCode!==0))process.exitCode=1;
