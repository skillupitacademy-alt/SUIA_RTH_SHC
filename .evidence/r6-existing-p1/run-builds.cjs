const fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'../..');const pnpm=path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');const results=[];
for(const app of (process.env.R6_BUILD_APPS ? process.env.R6_BUILD_APPS.split(',') : ['api-server','skillhubcore-admin','skillup-web','realtutorialhub-web'])){
 const name=app+'-build';const fd=fs.openSync(path.join(__dirname,name+'.log'),'w');const started=new Date().toISOString();
 const r=spawnSync(process.execPath,[pnpm,'--filter','@quiz/'+app,'build'],{cwd:root,windowsHide:true,timeout:900000,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',PROJECT_LLM_EXECUTION_MODE:'isolated_worker',SENTRY_AUTH_TOKEN:''},stdio:['ignore',fd,fd]});
 fs.closeSync(fd);results.push({name,command:'pnpm --filter @quiz/'+app+' build',started,finished:new Date().toISOString(),exitCode:r.status,error:r.error?.code});
 fs.writeFileSync(path.join(__dirname,'build-results.json'),JSON.stringify({environment:'Local production builds only; local dev listeners stopped to avoid .next collisions. No Docker image or deployment.',results},null,2));console.log(name+' exit '+r.status);
}
if(results.some(r=>r.exitCode!==0))process.exitCode=1;
