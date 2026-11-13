# R4 security and hierarchy qualification

13 November 2026. Reviewed working tree starts at `bf1e39bc2d59e779a72629a28e7c55cf3b733492`. Scope covers the approved learner-session, method-authorization, hierarchy-integrity and accessibility continuation for SHC Admin, SUIA Web and RTH Web. The owner approved the two reproduced defect corrections in this chat.

## Current recommendation

R4 has passing runtime evidence for the corrected device-session replay and MainDB/TutorialDB application-writer race. Full Q01–Q48 acceptance remains pending the exceptions below and the existing owner-controlled release/governance decisions.

## Changes and compatibility

Learner login and refresh now sign the SHA-256 hash of the exact issued refresh credential into the access JWT. The identity handler and protected backend resource admission compare that binding with the presented refresh credential and its active, unexpired, user-owned persisted row. The common SUIA/RTH browser proxy requires both cookies. The backend gate also covers protected auth-session endpoints and credentialed tutorial requests. Tokenless trusted services, separately signed workers and administrative token classes keep their established authentication boundaries.

Older learner access credentials lack a device binding. They require canonical refresh or login before protected browser admission. The isolated access-only fixture-session issuer also lacks a persisted device pair. Its credential alone cannot qualify real private learner admission. This compatibility consequence is recorded in `APPROVED_CORRECTION_INVENTORY.md`.

The current-account checks use the actual brand-local user and role authority. Effective permissions are the intersection of signed and current roles. An existing learner-purpose credential cannot gain newly assigned administrative privileges. Private profile responses carry `private, no-store` and vary by cookies/authorization. Session revocation checks both row identity and owner and reports a missing/foreign session truthfully.

Canonical TutorialDB writers now acquire MainDB ancestor locks in domain, subject, topic, subtopic order with sorted UUIDs. They revalidate parent existence, deletion state and relationships after acquiring the locks and hold them through the actual TutorialDB commit or rollback. Covered entry points include SHC sidebar draft/publication, canonical section creation, API hierarchy synchronization and the RTH signed hierarchy-sync worker. Alternate backend hierarchy deletion engines now acquire the exclusive parent lock and inspect retained TutorialDB dependencies before their existing repository mutation. SHC deletion also checks physically retained mappings.

Existing section content updates, publication snapshots and soft deletion preserve their parent mapping. Retaining that mapping prevents deletion of the associated MainDB hierarchy. Sidebar page/group IDs remain navigation identifiers. They are not treated as academic subtopic UUIDs by the new relationship check.

These locks coordinate participating application writers across two databases. TutorialDB can commit successfully before the MainDB lock transaction reports a failure. The committed dependency and parent are retained, deletion rejects the dependency, and a retry can reconcile the operation. The protocol provides no distributed transactional atomicity. Direct SQL maintenance requires the documented lock convention or a maintenance window. Historical scripts and dedicated verification-only provisioning are outside the production writer convention.

## Executed runtime evidence

All evidence below is under `.evidence/r4-acceptance-20261112/`.

| Check | Actual result | Evidence |
| --- | --- | --- |
| Real gateway password login and device-pair admission for both brands | 52 passing HTTP scenarios, cleanup verified | `gateway-device-binding-results.json` |
| Access-only replay while another device is active | Originally HTTP 200, now HTTP 401 | `device-replay-before.json`, `gateway-device-binding-results.json` |
| Cross-device cookie mixing, old access with rotated refresh | HTTP 401 | `gateway-device-binding-results.json` |
| Device A logout, Device B continuity, refresh rotation | Old A and old B pairs rejected, current B pair admitted | `gateway-device-binding-results.json` |
| Independently signed positive control and expired access | Valid control HTTP 200, expired access HTTP 401 | `gateway-device-binding-results.json` |
| Persisted session expiry and revocation | HTTP 401 | `gateway-device-binding-results.json` |
| Live disabled account and role removal | Identity HTTP 403, protected profile denies disabled account | `gateway-device-binding-results.json` |
| MainDB/TutorialDB integrity | 15 passing real PostgreSQL scenarios, cleanup verified | `hierarchy-remote-tests.json`, `hierarchy-remote-results.json` |
| Original uncoordinated race | MainDB deletion HTTP-equivalent 200 followed by orphaning TutorialDB commit, retained as failing-before evidence | `hierarchy-remote-before.json`, `hierarchy-tests-before.json` |
| Coordinated writer first | Deletion waits and returns 409 after the writer commits | `hierarchy-remote-results.json` |
| Deletion first | Waiting writer rejects the missing parent before writing | `hierarchy-remote-results.json` |
| Lock timeout and retry | Blocked writer fails without mutation, subsequent retry succeeds | `hierarchy-remote-results.json` |
| Outage, FK, rollback, partial completion and forged hierarchy relationship | Expected rejection or retained state verified | `hierarchy-remote-results.json` |
| Anonymous/forged-header method sweep | 195 inventoried methods recorded, 3 Marketing HOLD, no final failing recorded probe | `anonymous-method-matrix-results.json` |
| Authenticated RTH accessibility | Dashboard and profile, desktop and mobile, 4 passing browser/axe checks | `rth-accessibility-results.json` |
| Authenticated SUIA accessibility | Attendance and payments returned HTTP 500 in 4 browser checks | `suia-accessibility-results.json` |
| Authenticated SUIA accessibility after correction | Desktop/mobile attendance and payments unavailable states return 200 with zero axe violations and no horizontal overflow, 4 passes, cleanup verified | `suia-accessibility-final.json` |
| Canonical browser BFF device replay | Each brand rejects logged-out A access-only replay, keeps B active and prevents administrative privilege gain from a newly assigned role, 6 total passes, cleanup verified | `suia-browser-device-final.json`, `rth-browser-device-final.json` |

The gateway probes use the actual running isolated local gateway, Next.js API handler, brand-local account lookup and persisted remote Neon sessions. Passwords and tokens remain in process memory. PostgreSQL fixtures are run-owned UUIDs with explicit cleanup verification. No schema operation was performed for R4.

The 195-method sweep proves the recorded anonymous and forged-header boundary outcomes. Public credential exchanges and validation responses are classified separately. It does not establish every authenticated role, resource owner, membership transition or positive product workflow. Those dimensions remain partial in the Q register.

## Regression and quality evidence

Exact final command strings, start/end timestamps and exit codes are recorded by `run-quality.cjs` in `quality-final-results.json`. Its logs retain failures as well as passing reruns. Build results must be read from the completed receipts.

All three production builds completed with exit 0. After the final SUIA recovery correction, its build ran again and completed with exit 0 in `skillup-web-final-build.log` and `skillup-web-final-build.exit`. The final SUIA zero-warning lint and typecheck also completed with exit 0. Seven identity-handler real-signature tests and the 19 SUIA availability/forwarding tests passed after the final corrections. `source-manifest.json` identifies the changed source paths and SHA-256 fingerprints.

The final Graphify AST refresh completed with exit 0, 36,761 nodes and 86,523 edges. Its external library emitted a path-normalization cache warning and community-label refresh advice. Those messages are retained in the execution record. All three local HTTP health endpoints returned 200 after restart. `final-service-and-graph-receipt.json` records these observed outcomes. Incidental generated `next-env.d.ts` differences were restored to the committed content after inspection.

- SUIA package tests passed 212 cases.
- RTH package tests passed 243 cases.
- Shared proxy origin/configuration tests passed 14 cases. The corrected command excludes `.worktrees/` so unrelated owner worktree copies do not contaminate the scoped run.
- Backend current-account/session/revocation regressions passed 32 cases.
- Canonical issuer and refresh authority/atomic-rotation/lifecycle regressions passed 55 cases.
- Identity handler tests use real signed JWTs and isolated account/session repositories, with 7 passing cases including missing/mixed/revoked credentials, expiry and actual response status 503 for session-store/TokenService construction failure.
- SUIA availability/authorization/SSR-forwarding regressions pass 19 cases.
- Hierarchy/sidebar isolated regression tests passed 42 cases.
- Alternate backend deletion regression tests passed 9 cases.
- RTH worker isolated regression tests passed 3 cases.
- Existing publication lifecycle regressions passed 20 cases.
- Typechecks, zero-warning lint, SHC security and boundary checks, and three production builds are recorded individually in the final quality receipts.

Unit tests use mocked transports and repositories where stated by their source. The PostgreSQL concurrency suite uses real database transactions. The gateway suite uses real HTTP and real signed tokens. RTH accessibility evidence uses headless Chromium and actual persisted sessions. These evidence types should retain their individual labels.

## Remaining exceptions

1. SUIA attendance/payment backend dependencies remain unavailable. The first browser failure was traced through successful login to a mismatched server-side BFF trust credential. The helper now uses the `INTERNAL_GATEWAY_SECRET` validated by its own proxy. A second run reached the actual data handlers and exposed unavailable attendance/payment dependencies. Pages now render a typed unavailable state on dependency failure and continue propagating authorization denials. The four final desktop/mobile browser checks pass for those unavailable states. This evidence does not qualify actual attendance/payment data operations. Automatic approval review initially rejected background server relaunch. A tracked terminal launch later succeeded, allowing the runtime retests. The temporary app servers were paused for the final build and relaunched afterward through the tracked terminals.
2. Five pre-existing API hierarchy-sync tests expect removed `tutorialSyncStatus` fields and a populated failed-row retry registry. Current committed `retryFailed()` initializes an empty entity batch list. The executed combined suite recorded 11 passes and 5 failures in `backend-coordination-auth.json`. An independent rerun against the exact committed baseline module reproduced the same five failures in `hierarchy-sync-baseline-proof.json`. The temporary baseline module/test copies were removed after that probe. R4 preserves those failures. The original assertions were not removed or weakened. Retry recovery cannot be declared qualified from a signature check or an empty successful response.
3. A complete authenticated method/role/tenant/object-ownership matrix across the 195 handlers remains partial. Reuse the anonymous sweep and existing positive session evidence when continuing the missing cases.
4. Remote migration provenance, Marketing HOLD and owner-controlled Docker/release signoff remain governed by their earlier decisions. This review supplies no replacement decision for them.

## Q-register delta

| Q items | R4 disposition |
| --- | --- |
| Q15, Q24, Q25, Q32, Q33, Q41 | Current account, device-session replay, role removal and selected cross-user/brand controls gain actual runtime evidence. Wider lifecycle and resource matrix remain partial. |
| Q16, Q23, Q31 | 195-method anonymous boundary evidence completed within the recorded classifications. Authenticated method/owner coverage remains partial. |
| Q18, Q40, Q45 | Fifteen bounded remote MainDB/TutorialDB integrity/concurrency/rollback checks pass with cleanup. Broader backup, migration and release gates retain their earlier status. |
| Q30, Q38, Q46 | RTH dashboard/profile desktop/mobile accessibility passes. SUIA attendance/payments unavailable states pass desktop/mobile accessibility after the trust-header and recovery corrections. Broader authenticated-page coverage remains partial. |
| Q42, Q43, Q44 | Shared writer coordination, current-session admission, private cache headers and truthful session revocation corrections implemented. Final package/build receipts and the five preserved historical test failures govern the remaining qualification. |
| Q22 | HOLD. |
| Q48 | Pending remaining exceptions and owner acceptance. |

## Evidence handling and Git

The owner made commits while this continuation was running. The reviewed current baseline is the full SHA recorded above, with subsequent R4 corrections in the working tree. This agent performed no commit or push. The canonical SHC CSV hash remains `7a6d7d43c7f535f24ca56e78781e9f98c747e7e249465121b06f37e2f56bc97e`.

An earlier lifecycle harness reused `learner-lifecycle-results.json` for its accessibility mode and overwrote the original core JSON. The 56 passing core records were recovered from the retained execution console into `learner-lifecycle-final-core.json`, which explicitly states that recovery and the previously observed cleanup result. The harness now uses an explicit output filename per mode. The new 52-case gateway results and 15-case PostgreSQL results are separately retained original artifacts.

The scoped root test command initially picked up `.worktrees/` copies and one outdated unauthenticated status expectation. Its final command excludes those unrelated copies and expects the actual HTTP 401 authentication denial. Origin and gateway-secret negative assertions remain enforced. Legacy boundary-focused unit suites mock the new coordination/session adapter, while separate live gateway and database suites exercise the actual new controls.
