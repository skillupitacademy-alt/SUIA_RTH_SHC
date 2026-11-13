import original from '../../apps/api-server/vitest.config.ts';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const sources=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'BASELINE_AUTH_SOURCE.json'),'utf8'));
export default {...original,plugins:[{name:'frozen-prior-source',enforce:'pre',load(id){const key=path.relative(root,id.split('?')[0]).replaceAll('\\','/');if(key in sources)return sources[key];}}],test:{...original.test,exclude:[...original.test.exclude,'**/chg03-recovery.test.ts']}};
