const fs=require('fs'),path=require('path');const root=__dirname;
const initial=JSON.parse(fs.readFileSync(path.join(root,'quality-results.json'),'utf8'));
const readExit=name=>Number(fs.readFileSync(path.join(root,name+'.exit'),'utf8').trim());
const final=initial.results.filter(row=>!['api-targeted-tests','api-source-lint','shared-source-lint','skillup-web-tests','realtutorialhub-web-tests'].includes(row.name));
const gates=[
 ['api-targeted-final','pnpm --filter @quiz/api-server exec vitest run src/modules/hierarchy/__tests__/hierarchy-sync.service.test.ts src/app/api/workers/retry-hierarchy-sync/__tests__/route.test.ts src/app/api/admin/hierarchy/sync/__tests__/route.test.ts src/app/api/auth/profile/__tests__/ownership.test.ts src/app/api/auth/me/__tests__/device-session.test.ts src/app/api/auth/sessions/__tests__/[sessionId].route.ownership.test.ts src/modules/auth/__tests__/batch-08-tenant-session-isolation.test.ts --pool=threads --maxWorkers=1 --reporter=verbose','api-tests-final'],
 ['api-source-tests-lint-final','pnpm --filter @quiz/api-server exec eslint --no-ignore src/modules/hierarchy/hierarchy-sync.service.ts src/modules/hierarchy/__tests__/hierarchy-sync.service.test.ts src/modules/hierarchy/__tests__/hierarchy-reconciliation.remote.integration.test.ts src/app/api/workers/retry-hierarchy-sync/route.ts src/app/api/workers/retry-hierarchy-sync/__tests__/route.test.ts src/app/api/auth/profile/route.ts src/app/api/auth/profile/__tests__/ownership.test.ts --max-warnings=0','api-lint-final'],
 ['suia-final','pnpm --filter @quiz/skillup-web exec vitest run --pool=threads --maxWorkers=1 --reporter=verbose','suia-threads-final'],
 ['rth-final','pnpm --filter @quiz/realtutorialhub-web exec vitest run --pool=threads --maxWorkers=1 --reporter=verbose','rth-threads-final'],
 ['real-hierarchy-worker-final','RUN_HIERARCHY_REMOTE_UAT=1 pnpm --filter @quiz/api-server exec vitest run src/modules/hierarchy/__tests__/hierarchy-reconciliation.remote.integration.test.ts --reporter=json --outputFile=../../.evidence/r5-existing-p1/hierarchy-remote-final-tests.json','hierarchy-remote-final-tests'],
 ['actual-local-http','node .evidence/r5-existing-p1/authenticated-http.cjs','authenticated-http-exam-final'],
 ['graphify','graphify update .','graphify-update'],
 ['whitespace','git diff --check','git-diff-check'],
];
for(const [name,command,log]of gates)final.push({name,command,exitCode:readExit(log),log:log+'.log',completed:fs.statSync(path.join(root,log+'.exit')).mtime.toISOString()});
final.push(...JSON.parse(fs.readFileSync(path.join(root,'shared-lint-results.json'),'utf8')));
const builds=fs.existsSync(path.join(root,'build-results.json'))?JSON.parse(fs.readFileSync(path.join(root,'build-results.json'),'utf8')).results:[];
const result={head:initial.head,finalGates:final,builds,buildsComplete:builds.length===4,failedInitialGates:initial.results.filter(row=>row.exitCode!==0),warnings:['Graphify emitted a tool cache-root warning, a no-symbol test-source warning and a stale community-label notice. No LLM labeling was run.'],acceptance:'PARTIAL. Method/resource matrix and owner decisions remain open.'};
fs.writeFileSync(path.join(root,'QUALITY_FINAL_RESULTS.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({finalGates:final.length,failed:final.filter(row=>row.exitCode!==0).map(row=>row.name),builds:builds.map(row=>[row.name,row.exitCode])}));
