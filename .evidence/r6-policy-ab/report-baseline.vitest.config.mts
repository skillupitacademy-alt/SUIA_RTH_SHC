import original from './report-tests.vitest.config.mts';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');const sources=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'BASELINE_TEST_SOURCE.json'),'utf8'));
export default {...original,plugins:[{name:'prior-policy-boundaries',enforce:'pre',load(id){const key=path.relative(root,id.split('?')[0]).replaceAll('\\','/');if(key in sources)return sources[key];}}]};
