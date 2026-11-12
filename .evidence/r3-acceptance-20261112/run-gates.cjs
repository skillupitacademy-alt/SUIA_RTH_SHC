const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const pnpm=path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const results=[];
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1',PROJECT_LLM_EXECUTION_MODE:'isolated_worker',SENTRY_AUTH_TOKEN:''};
function gate(name,args) {
  const started=new Date().toISOString();
  const log=fs.openSync(path.join(__dirname,`${name}-final.log`),'w');
  let result;
  try { result=spawnSync(process.execPath,[pnpm,...args],{cwd:root,env,stdio:['ignore',log,log],timeout:600000,windowsHide:true}); }
  finally {fs.closeSync(log);}
  results.push({name,command:`pnpm ${args.join(' ')}`,started,finished:new Date().toISOString(),exitCode:result.status,error:result.error?.code,signal:result.signal});
  fs.writeFileSync(path.join(__dirname,'gates-final.json'),JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),boundary:'Actual local commands on R2 HEAD plus uncommitted R3 changes. No container images, deployment or Sentry publication. Previous PowerShell runner interrupted after SHC typecheck; these are the final native-process receipts.',results},null,2));
  console.log(`${name}: exit ${result.status}${result.error ? ` ${result.error.code}`:''}`);
}
for(const app of ['skillhubcore-admin','skillup-web','realtutorialhub-web']) {
  gate(`${app}-typecheck`,['--filter',`@quiz/${app}`,'type-check']);
  gate(`${app}-lint`,['--filter',`@quiz/${app}`,'lint','--max-warnings=0']);
}
gate('shc-security',['--filter','@quiz/skillhubcore-admin','test:security']);
gate('shc-boundaries',['--filter','@quiz/skillhubcore-admin','check:boundaries']);
gate('shc-build',['--filter','@quiz/skillhubcore-admin','exec','next','build','--webpack']);
gate('suia-build',['--filter','@quiz/skillup-web','build']);
gate('rth-build',['--filter','@quiz/realtutorialhub-web','build']);
if(results.some(r=>r.exitCode!==0))process.exitCode=1;
