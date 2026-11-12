# Critical items 5 and 6

11 November 2026. Reviewed local main f245e11ee5584018a0f751080595192325e74ee6 plus existing and current uncommitted fixes. Existing dirty work was preserved. Use HTTP for the three local web applications.

## Deliverable status

| Item | Result | Remaining boundary |
| --- | --- | --- |
| 5, tenant-safe progress migration design | COMPLETE FOR OWNER REVIEW | No DDL, backfill or database execution approved or performed. Progress remains affected by the missing column until approved alignment. |
| 6, targeted critical security correction and verification | Implemented and verified for the paths below | Full three-app security acceptance remains pending the stated quality/runtime gaps and the wider V4 register. |

The migration design is PROGRESS_TENANT_ALIGNMENT_DESIGN.md beside this report. Fresh evidence is progress-design-readonly.json. It confirms the same remote TutorialDB fingerprint, an explicitly read-only transaction, zero progress rows, missing tenant_id and the old user/subtopic uniqueness. No rows were assigned a tenant. The design includes locked rechecks, provenance stop conditions, backup/rehearsal, exact journal ordering, constraint/index transition and data-preserving recovery. It is deliberately outside the executable migration directory.

## Security defects reproduced and corrected

### Fixture sessions in production

apps/skillup-web/src/app/api/auth/test-fixture-session/route.ts previously permitted NODE_ENV=production when PROJECT_LLM_ISOLATED_VERIFICATION=true and production deployment labels were absent. A new negative test reproduced HTTP 200 instead of the required 403.

The endpoint now rejects production processes regardless of that preview flag, preserves the deployment-label and explicit runtime-enable guards, and limits configured fixture tenants to skillup, matching the existing minted token. Development fixtures still require the configured secret, registered fixture and learner identity. No fixture session was minted by live HTTP probes. Tests mock the token issuer and verify zero calls for denial cases.

This intentionally closes the old production-preview exception. A production-build fixture-session workflow can no longer use that exception. Development fixture behavior remains available with the existing explicit settings.

### Backend CSRF origin and empty internal-key bypass

apps/api-server/src/modules/auth/csrf.middleware.ts previously accepted origin.includes(host). Spoofed host substrings and a missing Host could satisfy that condition. An empty configured INTERNAL_API_KEY also matched an empty supplied header and skipped token checking. Four new negative cases failed before correction.

The guard now compares exact configured origins or the request's exact origin, and accepts an internal-key bypass only when both configured and supplied keys are nonempty and match. Existing double-submit checks, trusted internal calls, safe methods and explicit endpoint exemptions are preserved. Tests verify spoofed origins are rejected even with matching CSRF tokens and valid same-origin/configured-origin requests remain allowed. The live backend probe returns 403 for the hostile host-substring origin.

### Learner BFF mutations and absent gateway configuration

src/share-branding/middleware/authProxy.ts now checks API mutation origins before public-auth shortcuts or JWT work. Cross-origin cookies cannot gain admission through an added Bearer header. Cookie-authenticated originless mutations require an exact same-origin referrer or the configured matching gateway credential. Browserless requests with no ambient session cookies still reach the route's actual authentication guard.

Origin comparison uses the actual Host plus the request protocol, preserving brand subdomains when Next normalizes its internal URL to localhost. It does not trust x-forwarded-host. The first live test exposed that normalization mismatch, which was corrected and covered by a new positive regression. Same-origin invalid sessions now reach authentication and receive 401. Cross-origin mutations receive 403.

The existing hasValidGatewaySecret helper returned true when its secret was unconfigured. Existing tests demonstrated this fail-open behavior. It now returns false for missing configuration. Current tests verify authenticated and unauthenticated nonpublic API cases fail closed.

Both learner src/proxy.ts matchers explicitly include /api/:path* so dotted API paths cannot skip this boundary through the previous asset exclusion.

### Worker authentication and signed destination

All 11 RTH worker routes were traced to either the shared createQStashHandler or verifyQStashRequest signature boundary. The learner proxy now forwards worker paths to those handler guards without requiring a learner session or treating them as browser cookie mutations. Each worker remains responsible for its queue signature. All 11 real unsigned HTTP requests returned 401.

The QStash Receiver already verified signature, issuer, body hash and timing, but destination checking was omitted because no URL was supplied. packages/events/src/worker-destination.ts now checks the signed subject's worker pathname and query after successful cryptographic verification. It is reused by packages/events/src/consumer.ts and the RTH qstash helper. Missing or mismatched destination is a SignatureError before handler effects.

Public and internal origins can differ behind the gateway, so this correction binds exact path/query and preserves that deployment behavior. It does not claim full signed-origin or cross-environment replay binding. Existing signing-key separation and the shared consumer's explicit tenant-scope/type enforcement remain necessary. Custom raw notification workers do not receive a new tenant-membership policy from this patch.

The real-signature suite tests current/next keys, missing/forged signature, body tampering, expired/future tokens, issuer mismatch, cross-worker/query replay, internal-origin delivery, missing keys, explicit tenant/type mismatch and sequential event deduplication. These tests use the actual QStash Receiver and signed synthetic JWTs, forbid network calls, and use an in-memory effect/lease store. No paid queue requests, Redis writes or database writes occur.

Existing worker/event unit tests that explicitly mock signature verification were updated to provide structurally valid signed-destination fixtures. They remain mocked tests. Actual cryptography is proven by the separate suite and is not bypassed in production code.

### Progress ownership and migration compatibility

The active RTH remediation service directly accessed tutorial_progress without tenant predicates and used the old two-column upsert identity. apps/realtutorialhub-web/src/server/remediation.service.ts now explicitly scopes its progress reads, updates and inserts to realtutorialhub and uses tenant/user/subtopic as the conflict target. This preserves its existing RTH-only authority and requires the approved schema alignment before durable progress can work.

Its tests inspect real Drizzle-generated predicate SQL, insertion values and conflict columns with mocked persistence. The previously stale test lease adapter was updated to exercise the current owner-token lease interface instead of relying on removed non-atomic semantics. No deployed Redis behavior is claimed from that mock.

## Executed evidence

| Check | Actual result | Evidence kind |
| --- | --- | --- |
| security-http-negative.cjs | 20/20 passed, exit 0 | Real local HTTP against all three web applications and backend. Includes all 11 RTH unsigned workers, forged identity headers, cross-origin mutation rejection, same-origin invalid-token rejection, SHC login CSRF and fixture denial. |
| Shared learner origin and gateway configuration tests | 14 passed, exit 0 | Real proxy functions, mocked JWT verifier. Tests exact Host, forwarded-host spoofing and configured gateway behavior. |
| Backend CSRF tests | 14 passed, exit 0 | Actual middleware, mocked origin configuration. Included again in the 94-case API run. |
| Selected API account/session/export/ILS identity matrix | 94 passed across 7 files, exit 0 | Mix of real service/guard code, synthetic/in-memory identity stores and mocked persistence. No production membership/status mutation. |
| SUIA fixture and selected learner-brand guards | 19 passed, 4 excluded cases, exit 0 | Route/guard calls with mocked token verification/issuance. Exact selection and excluded old content cases recorded in log. |
| RTH worker routes, real queue signatures and remediation service | 58 passed across 12 files, exit 0 | Actual cryptography in 16 dedicated cases. Other worker/service effects are mocked. |
| RTH selected assignment/learner identity tests | 10 passed, 5 excluded cases, exit 0 | Actual authorization helpers, mocked token/repository. |
| Shared event package regression | 22 passed, exit 0 | Explicitly mocked verifier/transport and in-memory leases. |
| Progress repository and completion-membership tests | 32 passed, exit 0 | Mocked database boundaries. Does not prove PostgreSQL concurrency or locks. |
| API-server tsc --noEmit | Exit 0 | Typecheck. |
| Event-package type-check | Exit 0 | Typecheck. |
| Backend changed production CSRF file lint | Exit 0, max-warnings=0 | Focused ESLint. |
| SUIA changed fixture route lint | Exit 0, max-warnings=0 | Focused ESLint. |
| Event consumer/destination/export lint | Exit 0, max-warnings=0 | Focused ESLint. |
| git diff --check | Exit 0 | Whitespace gate. |
| graphify update . | Exit 0 | Incremental AST graph refresh, no paid model use. |

Do not add these counts into a new full-application acceptance total. Some targeted checks intentionally overlap.

Commands and outputs are retained beside this report in security-*.log and security-http-negative.json. Core commands were targeted pnpm exec vitest run invocations using each package's existing configuration, pnpm --filter @quiz/events test/type-check, API-server exec tsc --noEmit, and the changed-path ESLint invocations. The HTTP runner uses only invalid/absent sessions, hostile synthetic headers and unsigned worker payloads. It never sends an authorized state-changing request.

## Failures and corrections retained honestly

- Before fixes, the CSRF suite returned 4 failures/10 passes, and the fixture suite returned 1 failure/5 passes. Their logs are security-csrf-before.log and security-fixture-before.log.
- The first shared proxy run also accidentally collected an old .worktrees checkout because root Vitest path filters are substring matches. The final command explicitly excludes .worktrees and .evidence, qualifies the current checkout, and passes all 14 cases. Old worktree source was untouched.
- The first live probe rejected valid same-origin invalid-token calls with 403 because Next used an internal localhost URL. The actual-Host correction resolved it. The failed run is retained in security-http-before-host-normalization.json, and final 20/20 results are in security-http-negative.json.
- Initial worker/event mocks lacked a signed destination and failed after the new guard. Updated mock fixtures preserve the destination contract. Separate real cryptographic tests prove the actual signature checks.
- A broader SUIA selection returned 21 passes and 2 failures in unchanged retired-content assertions expecting 200/403 instead of 410. The successful focused selection does not turn that broader run into PASS.
- A broader API selection returned 94 passes and 3 failures in an unchanged export-status test that mocks a user without a required brand and consequently gets 403. The focused ownership tests exercise the current tenant contract. No production guard was weakened to satisfy the stale test.
- The first remediation service run exposed its old non-atomic test adapter. It was updated to the current explicit owner-transition interface and the focused final worker/service suite passes.
- The initial API lint command included an ignored test file and exited 1 for the ignored-file warning. The final production-file-only command returned exit 0. It does not claim that every changed test has a zero-warning lint result.

## Remaining acceptance boundaries

RTH full typecheck still fails at the three unchanged shared learner-page-resolution test calls missing a third argument. SUIA full typecheck additionally fails for unchanged optional-request faculty/programs handler signatures in generated Next types. Both commands returned exit 2. No successful full production build is claimed. These known gates remain in the Gemini handoff.

Database-backed migration, rollback, concurrent insert/CAS, durable progress, assignment completion and multi-session persistence qualification remain NOT RUN pending isolated remote database approval. The separate tutorial_navigation_progress identity-key risk is documented in the migration design and is not repaired by the tutorial_progress change.

Live revocation, live current membership demotion, full session lifecycle and cross-user/private-record coverage across every existing route are not proved by a finite targeted matrix. The selected tests prove their specific guards and synthetic identity boundaries. The wider V4 route register and canonical acceptance ledger remain authoritative for pending qualification.

Full worker origin replay qualification, deployment configuration validation, broad lint/build closure, parked jobs and the already-recorded normal gateway signing-key mismatch remain separate concerns. No additional authorization roles, SHC brand author-scope claims or product features were introduced.

## Governance

No database DDL, migrations, row changes, deployments, commits, pushes, merges or canonical-ledger edits were performed. Tutorial authoring, publishing, blocks and delivery journeys were not rerun. Marketing remains HOLD. The canonical ledger SHA256 remains 7a6d7d43c7f535f24ca56e78781e9f98c747e7e249465121b06f37e2f56bc97e.
