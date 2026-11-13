const fs=require('fs'),cp=require('child_process');const file='apps/api-server/next-env.d.ts';const current=fs.readFileSync(file,'utf8');const baseline=cp.execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'});
const normalize=s=>s.replace(/\r\n/g,'\n');
if(normalize(current)!==normalize(baseline)){
 if(normalize(current).replace('"./.next/types/routes.d.ts"','"./.next/dev/types/routes.d.ts"')!==normalize(baseline))throw new Error('Unexpected generated declaration change');
 fs.writeFileSync(file,baseline);
 fs.writeFileSync('.evidence/r5-existing-p1/generated-file-review.json',JSON.stringify({file,reason:'Local production build switched the generated Next type-import mode. Restore the clean baseline dev declaration for the restarted local servers.',onlyExpectedModeChange:true},null,2));
}
