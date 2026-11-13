const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const pnpm = path.join(os.homedir(), 'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const results = [];
function gate(name, args) {
  const file = path.join(__dirname, `${name}.log`);
  const descriptor = fs.openSync(file, 'w');
  const started = new Date().toISOString();
  const result = spawnSync(process.execPath, [pnpm, ...args], {
    cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED:'1', PROJECT_LLM_EXECUTION_MODE:'isolated_worker', SENTRY_AUTH_TOKEN:'', RUN_HIERARCHY_REMOTE_UAT:'' },
    stdio: ['ignore',descriptor,descriptor], timeout: 900000, windowsHide:true,
  });
  fs.closeSync(descriptor);
  results.push({name,command:`pnpm ${args.join(' ')}`,started,finished:new Date().toISOString(),exitCode:result.status,error:result.error?.code});
  fs.writeFileSync(path.join(__dirname,'quality-results.json'),JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),environment:'Local unit/static gates. Remote tests require separate opt-in. No Docker or deployment.',results},null,2));
  console.log(`${name} exit ${result.status}`);
}
gate('api-targeted-tests',['--filter','@quiz/api-server','exec','vitest','run',
 'src/modules/hierarchy/__tests__/hierarchy-sync.service.test.ts',
 'src/app/api/workers/retry-hierarchy-sync/__tests__/route.test.ts',
 'src/app/api/admin/hierarchy/sync/__tests__/route.test.ts',
 'src/app/api/auth/profile/__tests__/ownership.test.ts',
 'src/app/api/auth/me/__tests__/device-session.test.ts',
 'src/app/api/auth/sessions/__tests__/[sessionId].route.ownership.test.ts',
 'src/modules/auth/__tests__/batch-08-tenant-session-isolation.test.ts',
 '--pool=threads','--maxWorkers=1','--reporter=json','--outputFile=../../.evidence/r5-existing-p1/api-targeted-tests.json']);
gate('api-typecheck',['--filter','@quiz/api-server','exec','tsc','--noEmit']);
gate('api-source-lint',['--filter','@quiz/api-server','exec','eslint','--no-ignore',
 'src/modules/hierarchy/hierarchy-sync.service.ts',
 'src/modules/hierarchy/__tests__/hierarchy-sync.service.test.ts',
 'src/modules/hierarchy/__tests__/hierarchy-reconciliation.remote.integration.test.ts',
 'src/app/api/workers/retry-hierarchy-sync/route.ts',
 'src/app/api/workers/retry-hierarchy-sync/__tests__/route.test.ts',
 'src/app/api/auth/profile/route.ts','src/app/api/auth/profile/__tests__/ownership.test.ts','--max-warnings=0']);
gate('db-tutorial-typecheck',['--filter','@quiz/db-tutorial','type-check']);
gate('shared-proxy-tests',['exec','vitest','run','src/share-branding/middleware/__tests__/gateway-secret-configuration.test.ts','src/share-branding/middleware/__tests__/learner-mutation-origin.test.ts','--exclude','**/.worktrees/**','--pool=threads','--maxWorkers=1','--reporter=json','--outputFile=.evidence/r5-existing-p1/shared-proxy-tests.json']);
gate('shared-source-lint',['--filter','@quiz/skillup-web','exec','eslint','--config','.eslintrc.json','../../src/share-branding/middleware/authProxy.ts','--max-warnings=0']);
gate('shared-test-lint',['exec','eslint','--no-eslintrc','--config','packages/eslint-config/index.js','--parser-options','{"project":null}','src/share-branding/middleware/__tests__/gateway-secret-configuration.test.ts','--max-warnings=0']);
for(const app of ['skillup-web','realtutorialhub-web']) {
 gate(`${app}-tests`,['--filter',`@quiz/${app}`,'exec','vitest','run','--pool=threads','--maxWorkers=1','--reporter=json',`--outputFile=../../.evidence/r5-existing-p1/${app}-tests.json`]);
}
gate('shc-security',['--filter','@quiz/skillhubcore-admin','test:security']);
gate('shc-boundaries',['--filter','@quiz/skillhubcore-admin','check:boundaries']);
for(const app of ['skillhubcore-admin','skillup-web','realtutorialhub-web']) {
 gate(`${app}-typecheck`,['--filter',`@quiz/${app}`,'type-check']);
 gate(`${app}-lint`,['--filter',`@quiz/${app}`,'lint','--max-warnings=0']);
}
if(results.some(result=>result.exitCode!==0))process.exitCode=1;
