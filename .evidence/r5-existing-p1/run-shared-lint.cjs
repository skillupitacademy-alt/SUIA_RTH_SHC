const fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'../..'); const pnpm=path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs'); const results=[];
function run(name,args,cwd=root){const fd=fs.openSync(path.join(__dirname,name+'.log'),'w');const started=new Date().toISOString();const r=spawnSync(process.execPath,[pnpm,...args],{cwd,windowsHide:true,stdio:['ignore',fd,fd],timeout:600000});fs.closeSync(fd);results.push({name,args,started,finished:new Date().toISOString(),exitCode:r.status});fs.writeFileSync(path.join(__dirname,'shared-lint-results.json'),JSON.stringify(results,null,2));}
run('shared-source-lint-corrected',['exec','eslint','--config','.eslintrc.json','../../src/share-branding/middleware/authProxy.ts','--max-warnings=0'],path.join(root,'apps/skillup-web'));
// Existing repository test policy parses tests without a TypeScript project.
run('shared-test-lint-corrected',['exec','eslint','--no-eslintrc','--config','packages/eslint-config/index.js','--parser-options','{"project":null}','src/share-branding/middleware/__tests__/gateway-secret-configuration.test.ts','--max-warnings=0']);
if(results.some(r=>r.exitCode!==0))process.exitCode=1;
