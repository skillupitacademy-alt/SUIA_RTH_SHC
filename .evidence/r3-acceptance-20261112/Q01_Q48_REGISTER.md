# Q01–Q48 R3 evidence reconciliation

Baseline: `f78bd048e2192e0f744ffe3fca6218aa1d9aedd2`; uncommitted R3 delta. This is an evidence register, **not owner acceptance or a replacement for the canonical 62-row CSV**. `BOUNDED VERIFIED` means the named objective/evidence only; `PARTIAL` retains the remainder of the original requirement. Previous runtime receipts carry their own earlier SHA/date and are reused only for the stated unchanged behavior.

Evidence locations:

- **V3:** owner-supplied V3 closure register and V4 scope overrides in this conversation.
- **LOGIN:** `.evidence/critical-v4-20261111/Q08_LOGIN_VERIFICATION.md`, its six Chromium tests/log/screenshots.
- **QUESTIONS:** `.evidence/critical-v4-20261111/Q09_Q10_QUESTIONS_AUTHORIZATION.md` and `.evidence/continuation-20261112/questions-normal-runtime.log`; actual read-path identity/gateway/BFF probes, not mutation acceptance.
- **PROGRESS:** `.evidence/continuation-20261112/progress-tenant-execution.json`, `.evidence/closure-20261112/progress-remote-results.json` (11 real PostgreSQL scenarios), `progress-browser-results.json` (8 real Chromium/BFF/persistence probes), verified synthetic cleanup. Earlier baseline; not re-executed in R3.
- **SECURITY:** `.evidence/closure-20261112/security-http-negative.json` (20 actual HTTP denials), `api-security.log` (69 selected mocked/backend tests), previous R6 evidence. These are bounded selections, not all routes/methods or real lifecycle transitions.
- **R3 HTTP:** `retired-routes-results.json`, 68 actual local HTTP checks with anonymous and signed-credential contexts, including positive progress controls, GET/HEAD/RSC-prefetch variants. No password/session lifecycle claim.
- **R3 ACCOUNT:** `canonical-account-before.log` (two real component failures), `suia-tests-final.json` (200 passing tests, including eight canonical shell/provider account/brand isolation cases). React/jsdom with mocked network/decorative components; not browser cookie/cache eviction qualification.
- **R3 HIERARCHY:** `hierarchy-remote.log`, `hierarchy-remote-results.json`: six real Neon MainDB scenarios through the actual hierarchy service, transaction/FK/lock enforcement, fault injection, cleanup verified. Domain/subject boundary only.
- **R3 MIGRATIONS:** `MIGRATION_RECONCILIATION.md`, `migration-readonly-results.json`, `historical-blob-verification.json`. Read-only metadata; historical `0026` exact match, `833cf27c…` still OPEN.
- **R3 QUALITY:** final native command receipts/logs in `gates-final.json`, plus explicit corrected SHC lint rerun receipt. Earlier/interrupted attempts are retained separately. The final review summarizes the actual completed commands.
- **R3 ACCESSIBILITY:** `authenticated-accessibility-results.json` and retained initial/diagnostic logs/screenshots. SUIA authenticated desktop/mobile passed; SHC initial cold 503 then mobile passed. RTH controlled fixture redirected to login, so authenticated accessibility was not qualified. These automated probes are not complete WCAG certification.
- **METHODS:** `security-method-inventory.json`: TypeScript AST inventory, 195 locally exported handlers in 151 files (SHC 80, SUIA 49, RTH 66). Guard-call observations are source clues, **not PASS results**. Imported handler internals, roles, IDs, methods and lifecycle scenarios require evidence mapping.

| Q | Original requirement | R3 disposition | Evidence / remaining exception and decision |
| --- | --- | --- | --- |
| Q01 | Source, working tree and deployed provenance | PARTIAL | Current local baseline and exact R3 changes recorded. No VPS/image/deployment verification authorized or performed. Owner handles Git/release. |
| Q02 | Applicable governance and standards | PREVIOUSLY COMPLETE | V3 governance evidence retained; PSEG proposed status is not converted into formal owner approval. No broad reread claimed. |
| Q03 | Full action/method/BFF/service trace | PARTIAL | METHODS adds actual current exported-method inventory. Full caller-to-service/object/role trace is not established by 151 filenames or guard strings. |
| Q04 | Authoritative writers and shared owners | PARTIAL | Prior hierarchy create/update service delegation retained. Complete three-app writer/contract ownership map remains open. |
| Q05 | Historical evidence crosswalk | PREVIOUSLY COMPLETE | V3 and prior runtime receipts retained with their own baselines. R3 does not relabel earlier tests as newly executed. |
| Q06 | Per-app provisional acceptance matrix | PREVIOUSLY COMPLETE | V3 matrix plus this requirement-level delta. Neither constitutes final application acceptance. |
| Q07 | Login root-cause investigation | PREVIOUSLY COMPLETE | LOGIN: native GET fallback was identified. Investigation completion is distinct from Q08 repair proof. |
| Q08 | Prevent credential-bearing GET before/after hydration | BOUNDED VERIFIED | LOGIN six real Chromium negative cases with synthetic canaries; existing native POST/hydration fix unchanged. No repeated password journey. |
| Q09 | Identify actual Questions 401 hop | BOUNDED VERIFIED | QUESTIONS traced the verified SHC audience/forwarding hop through actual gateway/backend/BFF. |
| Q10 | Correct Questions authorization without bypass | BOUNDED VERIFIED | QUESTIONS authorized read success and negative JWT/header cases. No broadened role/audience authorization introduced by R3. |
| Q11 | Questions list/detail/CRUD/bulk safety | PARTIAL | Read authorization/list covered; complete synthetic mutation/detail/filter/confirmation-to-backend matrix not demonstrated by read-only probes. |
| Q12 | Identify progress failure | PREVIOUSLY COMPLETE | Missing tenant column and repository contract localized; prior real PostgreSQL SQLSTATE proof retained. |
| Q13 | Tenant-safe progress schema alignment | BOUNDED VERIFIED | Approved empty-table patch and PROGRESS receipts retained. Separate historical migration provenance is still OPEN under Q40. No R3 DDL. |
| Q14 | Durable tenant-safe progress | BOUNDED VERIFIED | PROGRESS fresh connections, reload/reissued synthetic sessions, isolation and cleanup. Full real login lifecycle remains Q24/Q32. |
| Q15 | SHC authentication regression | PARTIAL | Previous R6, QUESTIONS, SHC security/boundary gates retained/rerun as recorded. Not a full current-account/session lifecycle certification. |
| Q16 | Every relevant method/object/role authorization | PARTIAL | METHODS + SECURITY identify coverage boundary. Missing per-operation positive/negative mapping must remain open. |
| Q17 | Hierarchy authoritative ownership | PARTIAL | Service delegation retained; R3 HIERARCHY adds actual domain deletion/dependency/FK/rollback/concurrency proof. Full owner-map and every hierarchy action remain broader requirements. |
| Q18 | Real hierarchy FK/race/delete rollback | PARTIAL | R3 HIERARCHY six actual scenarios passed. Topic/subtopic/skill and cross-database races/rollback are not proved by the MainDB domain tests. |
| Q19 | Five tutorial block qualification | EXCLUDED FROM R3 | Owner explicitly excluded repetition; preserve earlier evidence, do not manufacture fresh PASS for unexecuted cases. No other 13 block families added. |
| Q20 | Sidebar/publication atomicity | EXCLUDED FROM R3 | Tutorial-content/publication campaign excluded by V4 owner override. Existing evidence retained; MainDB rollback tests do not prove TutorialDB publication atomicity. |
| Q21 | Question Factory existing workflow | PARTIAL | Existing proxy/source/screenshot evidence retained. Full generation/save/duplicate outage behavior unqualified; no paid AI calls. |
| Q22 | Marketing | HOLD | Explicit owner HOLD. Known failure is not waived; no unconditional SHC-wide acceptance. |
| Q23 | SUIA active/retired caller/method inventory | PARTIAL | R3 HTTP proves selected retired pages 404 for both credential states; METHODS inventories handlers. Full API caller/owner classification remains. |
| Q24 | SUIA real auth/session lifecycle | PARTIAL | SECURITY/public login and selected signed-token HTTP evidence retained. Real refresh/logout/rotation/revocation/browser-cache matrix remains unverified. |
| Q25 | SUIA membership/private-record isolation | PARTIAL | Selected membership/forged-header negatives retained; no full current-account membership-change matrix. |
| Q26 | Tutorial identity/URL policy | EXCLUDED FROM R3 | Tutorial-content journeys excluded. Retirement 404 proof is separate from canonical tutorial alias acceptance. |
| Q27 | SUIA durable progress and isolation | BOUNDED VERIFIED | PROGRESS durable per-tenant/user cases retained; R3 ACCOUNT adds same-page account/brand state reset. Full session lifecycle not inferred. |
| Q28 | Existing SUIA student/quiz security | PARTIAL | Selected backend ownership/authorization tests and SUIA suite pass; exhaustive route/method/resource negatives remain open. No new module created. |
| Q29 | SUIA ILS/BFF errors/cache/CSRF/outage | PARTIAL | Safe-error changes and selected mocks/HTTP denials retained. Full outage/recovery/method matrix not established. |
| Q30 | SUIA responsive/keyboard/accessibility/performance | PARTIAL | Public login evidence plus R3 authenticated exams desktop/mobile axe/focus/overflow. No complete authenticated-page or performance certification. |
| Q31 | RTH active/retired caller/method inventory | PARTIAL | R3 HTTP and METHODS added. Full API caller/owner classification remains. |
| Q32 | RTH real auth/session lifecycle | PARTIAL | R3 controlled JWT did not qualify dashboard identity/session admission. No real login/refresh/logout/revocation PASS claimed. |
| Q33 | RTH assignment/membership/object authorization | PARTIAL | Prior missing-tenant contract correction and selected denial tests retained. Removed route families do not prove all remaining resource/identity controls. |
| Q34 | RTH/tutorial tenant-only delivery | EXCLUDED FROM R3 | Owner excluded repeated tutorial brand/shared delivery tests. Prior evidence retained. |
| Q35 | RTH progress persistence/isolation | BOUNDED VERIFIED | PROGRESS + R3 ACCOUNT. Real session lifecycle stays separate. |
| Q36 | Existing RTH quiz/AI/worker security | PARTIAL | SECURITY includes unsigned-worker denials and selected real-signature tests. No paid services, valid job execution or exhaustive worker ownership matrix. |
| Q37 | RTH ILS/progress safe errors/cache/recovery | PARTIAL | Prior sanitized errors/cache/isolation tests retained. Full outage/recovery matrix remains. |
| Q38 | RTH responsive/keyboard/accessibility/performance | PARTIAL | Public login probes retained. R3 authenticated dashboard probe did not establish a valid session/page, so no authenticated accessibility PASS. |
| Q39 | Shared provider/consumer identity/version/brand contracts | PARTIAL | PROGRESS, QUESTIONS, R3 ACCOUNT cover named contracts; full present-SHA cross-app API matrix still incomplete. |
| Q40 | Remote DB ownership, constraints, history/backup | PARTIAL | PROGRESS + R3 HIERARCHY + fresh read-only catalogs. `833cf27c…`, journal baseline, navigation-progress identity key and restore rehearsal remain open. No history edits. |
| Q41 | Three-app adversarial security matrix | PARTIAL | R6/SECURITY/METHODS/R3 ACCOUNT are bounded evidence. Missing lifecycle/membership/IDOR/method cases cannot be promoted based on test totals. |
| Q42 | Complete scoped software-engineering principles review | PARTIAL | Existing owner/service fixes retained; R3 state isolation defect corrected. No comprehensive SOLID/DRY/KISS/dependency ownership acceptance claimed. |
| Q43 | Safe failures, credentials, logs/timeouts | PARTIAL | Earlier BFF sanitization and literal fallback removal retained. R3 tests use configured secrets held in memory, no committed credentials. Route-wide log/error/retry review remains. |
| Q44 | Affected tests/typecheck/lint/build gates | SEE FINAL RECEIPTS | Final R3 commands and exact exits in QUALITY. First SHC lint found two unused imports; explicit provider setup fixed them, rerun passed. Interrupted/failed attempts remain visible. |
| Q45 | Authorized remote PostgreSQL runtime probes | BOUNDED VERIFIED | Owner clarified development/test-only remote DB and approved bounded writes. PROGRESS and R3 HIERARCHY cleanup verified. No local PG; no unapproved DDL or blanket future write authorization inferred. |
| Q46 | Remaining browser qualification | PARTIAL | R3 HTTP, public login evidence and bounded authenticated probes. Repeated tutorial journeys excluded. Full browser lifecycle and accessibility gaps remain. |
| Q47 | Docker health/restart/recovery/images | OWNER-RETAINED / NOT RUN | Owner explicitly prohibited local images/deployment and retained this work. Source-only Docker evidence retained; no Docker smoke PASS or waiver invented. |
| Q48 | Final three-app acceptance and owner signoff | OPEN | Q22 HOLD, migration provenance, remaining security/lifecycle/engineering scope and owner release gates prevent unconditional acceptance. Canonical CSV unchanged. |

## Required remaining decisions

Final R3 additions include three production build exits of 0 and three typecheck exits of 0. SHC dashboard contrast failures were corrected after those builds. Its strengthened authenticated desktop/mobile checks now pass with zero axe violations in `shc-accessibility-corrected-results.json`. The final post-correction SHC production rebuild exited 0 in `shc-build-after-contrast.json`, and its final zero-warning lint rerun exited 0. Earlier failures remain in the evidence directory. Q30/Q46 bounded coverage and the SHC accessibility portion advance while their broader requirements remain partial.

1. Locate the exact unidentified historical SQL or obtain a documented owner provenance exception and reviewed schema-baseline plan. Do not mutate migration history to conceal it.
2. Provide/configure complete authorized synthetic lifecycle fixtures for the remaining browser identity, refresh/session revocation and membership-change probes. A signed JWT alone does not establish every backend's full session contract.
3. Complete the missing method/resource/action evidence, remaining cross-database hierarchy cases and selected authenticated accessibility/performance coverage before claiming full Q01–Q48 acceptance.
4. Owner retains Docker/image/deployment, Git commit/push, Marketing disposition and final acceptance-ledger decisions.
