const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const pnpm = path.join(os.homedir(), 'AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.cjs');
const results = [];
function gate(name, arguments_) {
  const descriptor = fs.openSync(path.join(__dirname, `${name}.log`), 'w');
  const started = new Date().toISOString();
  const result = spawnSync(process.execPath, [pnpm, ...arguments_], {
    cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED:'1', PROJECT_LLM_EXECUTION_MODE:'isolated_worker', SENTRY_AUTH_TOKEN:'' },
    stdio: ['ignore', descriptor, descriptor], timeout: 600000, windowsHide: true,
  });
  fs.closeSync(descriptor);
  results.push({ name, command:`pnpm ${arguments_.join(' ')}`, started, finished:new Date().toISOString(), exitCode:result.status, error:result.error?.code });
  fs.writeFileSync(path.join(__dirname,'quality-final-results.json'),JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),results},null,2));
  console.log(`${name} exit ${result.status}`);
}
gate('api-typecheck',['--filter','@quiz/api-server','exec','tsc','--noEmit']);
gate('api-auth-source-lint',['--filter','@quiz/api-server','exec','eslint',
  'src/lib/auth-context.ts','src/app/api/auth/me/route.ts','src/modules/auth/global-logout.service.ts',
  'src/modules/auth/repositories/token.repository.ts','src/modules/auth/login.service.ts',
  'src/modules/auth/token-refresh.service.ts','src/proxy.ts','src/lib/hierarchy-deletion.ts',
  'src/modules/hierarchy/hierarchy-sync.service.ts','src/modules/admin-engine/admin.domain.engine.ts',
  'src/modules/admin-engine/admin.subject.engine.ts','src/modules/admin-engine/admin.topic.engine.ts',
  'src/modules/admin-engine/admin.subtopic.engine.ts','--max-warnings=0']);

gate('db-tutorial-typecheck',['--filter','@quiz/db-tutorial','type-check']);
gate('auth-typecheck',['--filter','@quiz/auth','type-check']);
gate('suia-tests',['--filter','@quiz/skillup-web','exec','vitest','run','--maxWorkers=1','--reporter=json','--outputFile=../../.evidence/r4-acceptance-20261112/suia-tests.json']);
gate('rth-tests',['--filter','@quiz/realtutorialhub-web','exec','vitest','run','--reporter=json','--outputFile=../../.evidence/r4-acceptance-20261112/rth-tests.json']);
gate('shared-proxy-tests',['exec','vitest','run','src/share-branding/middleware/__tests__/learner-mutation-origin.test.ts','src/share-branding/middleware/__tests__/gateway-secret-configuration.test.ts','--exclude','**/.worktrees/**','--maxWorkers=1','--reporter=json','--outputFile=.evidence/r4-acceptance-20261112/shared-proxy-tests.json']);
gate('shc-security',['--filter','@quiz/skillhubcore-admin','test:security']);
gate('shc-boundaries',['--filter','@quiz/skillhubcore-admin','check:boundaries']);
for (const app of ['skillhubcore-admin','skillup-web','realtutorialhub-web']) {
  gate(`${app}-typecheck`,['--filter',`@quiz/${app}`,'type-check']);
  gate(`${app}-lint`,['--filter',`@quiz/${app}`,'lint','--max-warnings=0']);
}
for (const app of ['skillhubcore-admin','skillup-web','realtutorialhub-web']) {
  gate(`${app}-build`,['--filter',`@quiz/${app}`,'build']);
}
if (results.some(result=>result.exitCode!==0)) process.exitCode=1;
