# R5 executed quality receipts

Source HEAD 7f8c952a5a19b0e1ca04c4ed307b1a8c7abefc86. Final corrected invocations are listed below. Original failures remain in quality-results.json, raw logs and the initial JSON reports. Test counts describe their own boundaries and include overlap.

| Gate | Actual command | Exit |
| --- | --- | --- |
| api-typecheck | `pnpm --filter @quiz/api-server exec tsc --noEmit` | 0 |
| db-tutorial-typecheck | `pnpm --filter @quiz/db-tutorial type-check` | 0 |
| shared-proxy-tests | `pnpm exec vitest run src/share-branding/middleware/__tests__/gateway-secret-configuration.test.ts src/share-branding/middleware/__tests__/learner-mutation-origin.test.ts --exclude **/.worktrees/** --maxWorkers=1 --reporter=json --outputFile=.evidence/r5-existing-p1/shared-proxy-tests.json` | 0 |
| shc-security | `pnpm --filter @quiz/skillhubcore-admin test:security` | 0 |
| shc-boundaries | `pnpm --filter @quiz/skillhubcore-admin check:boundaries` | 0 |
| skillhubcore-admin-typecheck | `pnpm --filter @quiz/skillhubcore-admin type-check` | 0 |
| skillhubcore-admin-lint | `pnpm --filter @quiz/skillhubcore-admin lint --max-warnings=0` | 0 |
| skillup-web-typecheck | `pnpm --filter @quiz/skillup-web type-check` | 0 |
| skillup-web-lint | `pnpm --filter @quiz/skillup-web lint --max-warnings=0` | 0 |
| realtutorialhub-web-typecheck | `pnpm --filter @quiz/realtutorialhub-web type-check` | 0 |
| realtutorialhub-web-lint | `pnpm --filter @quiz/realtutorialhub-web lint --max-warnings=0` | 0 |
| api-targeted-final | `pnpm --filter @quiz/api-server exec vitest run src/modules/hierarchy/__tests__/hierarchy-sync.service.test.ts src/app/api/workers/retry-hierarchy-sync/__tests__/route.test.ts src/app/api/admin/hierarchy/sync/__tests__/route.test.ts src/app/api/auth/profile/__tests__/ownership.test.ts src/app/api/auth/me/__tests__/device-session.test.ts src/app/api/auth/sessions/__tests__/[sessionId].route.ownership.test.ts src/modules/auth/__tests__/batch-08-tenant-session-isolation.test.ts --pool=threads --maxWorkers=1 --reporter=verbose` | 0 |
| api-source-tests-lint-final | `pnpm --filter @quiz/api-server exec eslint --no-ignore src/modules/hierarchy/hierarchy-sync.service.ts src/modules/hierarchy/__tests__/hierarchy-sync.service.test.ts src/modules/hierarchy/__tests__/hierarchy-reconciliation.remote.integration.test.ts src/app/api/workers/retry-hierarchy-sync/route.ts src/app/api/workers/retry-hierarchy-sync/__tests__/route.test.ts src/app/api/auth/profile/route.ts src/app/api/auth/profile/__tests__/ownership.test.ts --max-warnings=0` | 0 |
| suia-final | `pnpm --filter @quiz/skillup-web exec vitest run --pool=threads --maxWorkers=1 --reporter=verbose` | 0 |
| rth-final | `pnpm --filter @quiz/realtutorialhub-web exec vitest run --pool=threads --maxWorkers=1 --reporter=verbose` | 0 |
| real-hierarchy-worker-final | `RUN_HIERARCHY_REMOTE_UAT=1 pnpm --filter @quiz/api-server exec vitest run src/modules/hierarchy/__tests__/hierarchy-reconciliation.remote.integration.test.ts --reporter=json --outputFile=../../.evidence/r5-existing-p1/hierarchy-remote-final-tests.json` | 0 |
| actual-local-http | `node .evidence/r5-existing-p1/authenticated-http.cjs` | 0 |
| graphify | `graphify update .` | 0 |
| whitespace | `git diff --check` | 0 |
| shared-source-lint-corrected | `pnpm exec eslint --config .eslintrc.json ../../src/share-branding/middleware/authProxy.ts --max-warnings=0` | 0 |
| shared-test-lint-corrected | `pnpm exec eslint --no-eslintrc --config packages/eslint-config/index.js --parser-options {"project":null} src/share-branding/middleware/__tests__/gateway-secret-configuration.test.ts --max-warnings=0` | 0 |
| api-server-build | `pnpm --filter @quiz/api-server build` | 0 |
| skillhubcore-admin-build | `pnpm --filter @quiz/skillhubcore-admin build` | 0 |
| skillup-web-build | `pnpm --filter @quiz/skillup-web build` | 0 |
| realtutorialhub-web-build | `pnpm --filter @quiz/realtutorialhub-web build` | 0 |

API targeted unit tests41, SUIA threads-pool tests218, RTH threads-pool tests244, shared proxy tests18 and SHC security tests65 passed. The boundary checker inspected80 handlers statically. Fourteen remote PostgreSQL/signed-worker tests passed with cleanup. Fifty actual local HTTP assertions passed with cleanup. Each receipt establishes its own tested boundary.

API and shared source/test lint passed without warnings. All three application lint/typecheck commands and four production builds completed with exit0. No lint rule was disabled. The shared test parser invocation follows the repository convention of parsing unit tests without a TypeScript project. Initial fork worker-startup failures were resolved by an isolated threads-pool rerun.

Graphify completed with exit0. Its cache-root, no-symbol test-file and stale-community-label notices remain in graphify-update.log. They are tool metadata warnings. No paid semantic labeling was run. No CI, Docker or deployment result is claimed.
