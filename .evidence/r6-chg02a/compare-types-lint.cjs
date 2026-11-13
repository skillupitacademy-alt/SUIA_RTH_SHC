const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),filename='packages/types/src/tutorial-repositories.types.ts';
const current=fs.readFileSync(path.join(root,filename),'utf8');
const original=current.replace('  /** A missing platform is permitted only for unambiguous legacy shared-admin login. */\n  findByEmail(email: string, platform?: PeoplePlatform): Promise<PeopleUserRecord | undefined>;', '  findByEmail(email: string): Promise<PeopleUserRecord | undefined>;').replace('  /** A missing platform is permitted only for unambiguous legacy shared-admin login. */\r\n  findByEmail(email: string, platform?: PeoplePlatform): Promise<PeopleUserRecord | undefined>;', '  findByEmail(email: string): Promise<PeopleUserRecord | undefined>;');
const normalize=s=>s.replace(/\r\n/g,'\n');
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'BASELINE.json'),'utf8'));
const matches=crypto.createHash('sha256').update(original).digest('hex')===baseline.hashes[filename];
if(!matches) throw new Error('Reconstructed baseline does not match frozen hash');
const pnpm=path.join(os.homedir(),'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const outputs=[];
for(const [name,input]of [['baseline',original],['current',current]]){
 const result=spawnSync(process.execPath,[pnpm,'exec','eslint','--no-ignore','--config','packages/eslint-config/index.js','--max-warnings=0','--stdin','--stdin-filename',filename,'--format','json'],{cwd:root,input,encoding:'utf8',windowsHide:true});
 const parsed=JSON.parse(result.stdout);
 fs.writeFileSync(path.join(__dirname,'types-lint-'+name+'.json'),JSON.stringify(parsed,null,2));
 outputs.push({name,exitCode:result.status,errorCount:parsed[0].errorCount,warningCount:parsed[0].warningCount,messages:parsed[0].messages.map(({ruleId,line,column,message,severity})=>({ruleId,line,column,message,severity}))});
}
fs.writeFileSync(path.join(__dirname,'SHARED_TYPES_LINT_COMPARISON.json'),JSON.stringify({baselineHashVerified:matches,unchangedDiagnostics:JSON.stringify(outputs[0].messages)===JSON.stringify(outputs[1].messages),outputs},null,2));
console.log(JSON.stringify(outputs.map(({messages,...summary})=>summary)));
