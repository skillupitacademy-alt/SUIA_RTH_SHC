const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const pnpm=path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const results=[];
for(const [name,args] of [ ['service-build',['--filter','@quiz/skillhubcore-service','build']], ['people-typecheck',['--filter','@quiz/db-people','type-check']] ]) {
 const fd=fs.openSync(path.join(__dirname,name+'.log'),'w'),started=new Date().toISOString();
 const result=spawnSync(process.execPath,[pnpm,...args],{cwd:path.resolve(__dirname,'../..'),windowsHide:true,timeout:600000,stdio:['ignore',fd,fd]});fs.closeSync(fd);
 results.push({name,command:'pnpm '+args.join(' '),started,finished:new Date().toISOString(),exitCode:result.status,error:result.error?.code});
 fs.writeFileSync(path.join(__dirname,'ADDITIONAL_QUALITY_RESULTS.json'),JSON.stringify({results},null,2));console.log(name+' exit '+result.status);
}
