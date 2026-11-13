const fs=require('fs'),cp=require('child_process');
for(const file of ['apps/api-server/next-env.d.ts','apps/skillup-web/next-env.d.ts','apps/realtutorialhub-web/next-env.d.ts']){
 const current=fs.readFileSync(file,'utf8');const original=cp.execFileSync('git',['show','HEAD:'+file]);const baseline=original.toString('utf8');
 const normalize=s=>s.replace(/\r\n/g,'\n').replace('./.next/dev/types/routes.d.ts','./.next/types/routes.d.ts');
 if(normalize(current)!==normalize(baseline))throw new Error('Unexpected generated declaration change '+file);
 fs.writeFileSync(file,original);
}
