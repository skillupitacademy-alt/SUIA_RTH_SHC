# W1–W3 consolidated implementation handoff

Baseline `df81a5c0` on `remediation/w1-2-batch-05-targeted`; working tree was clean at the start of this assignment. Independent Sol review and acceptance remain required. No push, live browser, physical database or deployment was performed. BROWSER-01 and RC-ID-01 remain IN_PROGRESS.

| Task | Disposition and remaining work |
| --- | --- |
| FND01 | PARTIAL: `W1_W3_Terra_Foundation_Register.md` records a source-backed initial slice; full crosswalk enumeration remains outstanding. |
| FND02 | PARTIAL: affected UI controls and retained Sol probes were run; full ILS/repository/BFF selections remain to be reproduced. Both foreign-tenant export probes fail as recorded below. |
| FND03 | NOT COMPLETE: signed-subject, projection, private-store, export provenance, admin classification and publication policy need one reviewed decision table and Sol disposition. |
| FND04 | BLOCKED on FND03 tenant/provenance policy; foreign-tenant equal-ID export probes remain failing historically. No speculative runtime correction. |
| FND05 | BLOCKED on FND03 private owner/store authority; four evidence lanes remain separately qualified in Batch 08 handoff. |
| FND06 | BLOCKED on FND03 admin resource classification; accepted previous containment remains in place. |
| FND07 | IMPLEMENTED_UNVERIFIED for J-R1/J-R2 only, commit `995e1f35`, manifest `W1_W3_FND07_Lifecycle_Slice_Manifest.md`; broader continuously mounted auth-owner/cache requirements remain open. |
| FND08 | NOT COMPLETE: real Project LLM actor ingress and persistence need inventory and controls. |
| FND09 | NOT COMPLETE: depends on FND08 and selected approval authority. |
| FND10 | PARTIAL: 21605b07 maps physical/browser scenarios and prerequisites; exact deployment commands and actual execution remain NOT EXECUTED. |
| FND11 | NOT COMPLETE: consumer inventory, equal-email ambiguity controls and uniqueness decision remain; migration separate. |
| FND12 | PARTIAL: register identifies report and SkillUp fallback sources, not exhaustive W2 coverage. |
| FND13 | PARTIAL / IMPLEMENTED_UNVERIFIED: program, faculty and batch/recording slices committed; placement, remaining dashboard truth, HTTP and physical evidence remain. |
| FND14 | IMPLEMENTED_UNVERIFIED for shared result-report DATA-02 slice only, commit `2d865a14`, manifest `W1_W3_FND14_DATA02_Slice_Manifest.md`; full assessment/result surface coverage remains open. |
| FND15 | PARTIAL / IMPLEMENTED_UNVERIFIED: question timestamp, SHC events, audit and metrics slices committed; other operational and governance consumers remain. |
| FND16 | PARTIAL / IMPLEMENTED_UNVERIFIED: MKT-030 newsletter corrected in shared home footer; other form/action inventory and controls remain. |
| FND17 | NOT COMPLETE: depends on FND12–FND16 and complete finding coverage. |
| FND18 | NOT COMPLETE: identity contract work depends on W1 authority decisions. |
| FND19 | PARTIAL / IMPLEMENTED_UNVERIFIED: bc891c17 removes a fabricated domain delete failure cause; other taxonomy consumers, canonical ingress/egress and compatibility remain open. |
| FND20 | PARTIAL / IMPLEMENTED_UNVERIFIED: 45947f8c contains invalid question resource IDs at the mounted consumer; canonical runtime contract, round-trip and historical compatibility remain open. |
| FND21 | NOT COMPLETE: tutorial contract consolidation depends on W1 owner authority and reviewed membership. |
| FND22 | NOT COMPLETE: Project LLM contract consolidation depends on actor and approval authority. |
| FND23 | VERIFICATION_FAILED: bf229bf8 retains a failing registered-type denial probe; event ownership, compatible worker types, replay and transactional semantics remain open. |
| FND24 | NOT COMPLETE: domain-specific caller controls depend on FND18–FND23. |
| FND25 | PARTIAL: mounted report truth and lifecycle adverse controls run; remaining domain invariants and infrastructure-sensitive controls open. |
| FND26 | PARTIAL: affected UI and learner-app typechecks and whitespace checks pass; other package lint/build gates not executed. |
| FND27 | PARTIAL: the two manifests constrain affected callers and scope; per-group compatibility and principle evidence remains. |
| FND28 | NOT COMPLETE: independent re-audit depends on complete finding reconciliation and Sol review. |
| FND29 | PARTIAL: d042ffdd provides a provisional W4.1–W4.6 dependency matrix; Sol validation, acceptance and any exceptions remain. No W4 readiness is asserted. |
| FND30 | PARTIAL: this handoff records all task and group dispositions; outstanding deliverables above remain. |

Groups G1 and G3 have narrowly scoped IMPLEMENTED_UNVERIFIED slices and remain IN_PROGRESS. G2 and G4–G9 are NOT COMPLETE; no group is accepted or closed. Existing Batch 08 T/J and historical records remain authoritative for their own scopes; this handoff does not replace them.

## Verification and limitations

FND07: prior Sol lifecycle baseline reproduced one pass and two failures. After `995e1f35`, the lifecycle selection passed six tests, and six combined UI files passed 66 tests; UI typecheck passed. Controls use mounted React/jsdom and isolated transport, not a live browser or authenticated owner transition. Hidden visibility, null/enabled session cutover, cleanup, delayed settlement and StrictMode replay are covered in that bounded selection.

FND14: from repository root with DATABASE/REDIS/UPSTASH/NEON/QSTASH environment keys removed, `node --input-type=module -e "import { startVitest } from 'vitest/node'; import react from '@vitejs/plugin-react'; const v = await startVitest('test', ['src/share-branding/__tests__/exam-summary-truth.test.tsx'], { run: true, config: false, environment: 'jsdom', globals: true }, { plugins: [react()] }); if (!v) process.exit(1); await v.close();"` exited 0: one file, four tests passed. It mounts the shared component with intercepted fetch, exercising zero, missing score, retrieval failure and persisted values; it does not establish live API or browser behavior. `pnpm exec tsc --noEmit` in each of `apps/skillup-web` and `apps/realtutorialhub-web` exited 0. `git diff --check` exited 0 for the slice. Other lint, builds and physical services NOT EXECUTED.

The report slice removes fabricated fallback metrics, distinguishes absent values from measured zero, displays fetch errors and prevents obsolete responses from overwriting current state. Server authority and assessment scoring are unchanged. FND07 starts cutover timing paused when the document is hidden and invalidates deferred visit work on cleanup; it does not establish backend ownership or change BFF forwarding. These two implementations require independent review for correctness and compatibility; acceptance is not claimed.

## Subsequent independent source investigation

`53ff53b9` adds a 91-row working index of the existing crosswalk and active SkillUp truth/caller tracing. It is not an exhaustive verified finding-to-source register. `07ed7f10` traces Project AI generic transition actor input from SHC through the proxy to the Python service, and identifies the assignment's missing authorized backend root. `5cb8fe1f` records the people email constraint, scoped SHC lookup, partial projection writes and a tentative migration recommendation. `81ca85af` records shared question type normalization and aliases; subsequent source inspection finds the admin single and bulk create routes already use enum-bearing `questionSchema`/`bulkQuestionSchema`, so a malformed-write claim requires testing the actual route rather than assuming the shared normalizer is directly exposed. These are read-only evidence, not implemented fixes or completed task acceptance. No additional tests ran for these inventories.

## FND13 incremental implementation

Program catalog `467a6ae6`, faculty `26898b79`, and batch/recordings `d31e6f47` have separate pre-edit manifests and are IMPLEMENTED_UNVERIFIED. The last combined offline selection exercises actual helpers with isolated query adapters: 3 files, 12 tests passed; SkillUp typecheck passed. It does not exercise actual HTTP entry points, mounted pages, static builds, physical stores or browsers. Program unavailable storage propagates an error and no longer fabricates catalog/curriculum; faculty empty/error and quality data no longer fabricate people or statistics; no active enrollment produces an empty batch state, and recording URLs are not manufactured. Further FND13 work, including placement and remaining dashboard truth, remains open. The direct program/faculty helper fallback after authentication/brand denials in `fetchSkillupApi` remains an independently identified authority concern and is not repaired or accepted by these slices. Sol review is required, including caller compatibility and representations.

## Retained Sol probes on d31e6f47

Repository root, with environment keys matching DATABASE, REDIS, UPSTASH, NEON and QSTASH removed, `python audit/W1.2_Batch_08_Sol_Probe.py` exited 1: 3 selected tests passed, 2 failed, 31 skipped, across 3 files (1 failed, 2 passed). Foreign-brand equal-ID jobId and examId download assertions each observed HTTP 200 versus required 403. `python audit/W1.2_Batch_08_Containment_Sol_Probe.py` exited 0: 7 selected tests passed and 28 skipped, 2 files passed. The scripts use intercepted/isolated fixtures and suppress raw output; no physical resource isolation or browser execution is established. These failures remain VERIFICATION_FAILED and FND04 open.

## Mounted page controls and execution incident

Added `apps/skillup-web/src/lib/__tests__/truth-pages.test.tsx`; actual async batch, my-batch, programs and faculty page components render with `fetchSkillupApi` intercepted. From repository root, after clearing DATABASE/REDIS/UPSTASH/NEON/QSTASH environment keys, programmatic Vitest with `config: false`, jsdom, React plugin and an explicit `@` alias to `apps/skillup-web/src`, selecting that file: exit 0, 2 passed. These are mounted isolated components, not browser or real HTTP checks.

An earlier attempt used `vite-tsconfig-paths` and a mock specifier that did not intercept the actual helper: both tests failed, and `fetchSkillupApi` attempted its configured SkillUp network fetch. No successful remote response was shown; whether the request reached the remote service is unknown. This was contrary to the no-production-traffic boundary. That run is invalid as isolated evidence. The explicit app alias and relative helper mock in the passing rerun avoid invoking the real helper; future tests must validate interception before invoking these pages.

Incident details: the failed first page-test command, from the repository root after clearing the named DB/cache/queue keys, was `node --input-type=module -e "import { startVitest } from 'vitest/node'; import paths from 'vite-tsconfig-paths'; import react from '@vitejs/plugin-react'; const v = await startVitest('test', ['apps/skillup-web/src/lib/__tests__/truth-pages.test.tsx'], { run: true, config: false, environment: 'jsdom' }, { plugins: [react(), paths({ projects: ['apps/skillup-web/tsconfig.json'] })] }); if (!v) process.exit(1); await v.close();"`. It exited 1 (2 failed). The helper resolves the destination from `NEXT_PUBLIC_WEB_APP_URL`, or defaults to `https://user.skillupitacademy.com`, for GET `/api/batches` and `/api/programs`. The configured host during that run is not established; no response succeeded in the test output, and arrival at the destination is unknown. Potential effect was read-only GET traffic, including any request headers the helper assembled; no intended write operation was issued. No request/header values were retained. The test now installs a throwing global fetch guard before each case and mocks the helper by its resolved module; the explicitly aliased safe rerun exited 0 with 2/2 passing. This guard covers fetch in these test cases; other network transports require their own fail-closed guards before any subsequent tests.

## Further W2 implementation

`40e05927` addresses MKT-030 in the shared marketing home footer used by both marketing apps: the unavailable newsletter is disclosed and email collection/false success removed. Mounted shared component, stubbed providers and fail-closed fetch: 1 passed; each marketing app typecheck passed. The separate local RTH footer has not been established as an active app caller. `f12b0d0a` addresses SHC-DATA-TRUTH-001: QuestionTable no longer substitutes the current time for missing creation metadata. Mounted table with mocked API/review card and fail-closed fetch: 1 passed; SHC typecheck passed. Both changes are IMPLEMENTED_UNVERIFIED and require Sol review; wider FND15/FND16 remains open. See their manifests for the precise test layers.

Further SHC operational slices: `99881139` replaces the events page's fabricated QStash history and metrics with unavailable; `7c5e29d4` does the same for prototype audit and metrics pages. Mounted page tests, with unexpected fetch blocked, passed 1 and 2 respectively; SHC typecheck passed after each. These pages no longer present those fixture values as live measurements, but no authoritative feed was integrated and independent acceptance is pending. User and subscription list/detail pages still import static people/subscription data and the shared TOTP modal constructs mutation requests using static or literal IDs; no actions were executed and destination routing/authority needs independent examination before wider changes.

W3 question consumer slice `45947f8c` addresses SHC-IDENTITY-002 at the actual QuestionTable: missing/blank resource IDs reject the page instead of manufacturing identifiers that could reach action controls. The mounted table selection passed 3 tests with intercepted API and blocked fetch, and SHC typecheck passed. This is IMPLEMENTED_UNVERIFIED; it does not complete FND20's canonical runtime schema, ingress/egress round-trip, historical compatibility or full domain suite.

`70d3dd79` replaces four SHC user/subscription prototype list/detail pages with explicit unavailable states, including removal of TOTP action controls targeting invented/literal IDs. Four mounted controls with fetch blocked and SHC typecheck pass. This intentionally leaves those management surfaces unavailable pending authoritative data and policy; Sol must assess feature impact. No live mutation or physical service was executed. Earlier warning that these four pages still render static records describes their pre-commit state only; other static consumers remain to be inventoried.

Follow-up after 70d3dd79: `rg -n 'skillhubcore-admin-data' apps/skillhubcore-admin/src` returned no consumers (exit 1); the static module itself remains in the repository, and this search does not prove other fabricated sources absent. The catalog heading follow-up `79f0b257` uses neutral wording because the query does not filter for active status; mounted fail-closed page selection passed 2 tests. Both remain IMPLEMENTED_UNVERIFIED.

`27eda5c1` applies the same non-specific deletion error treatment to the other four taxonomy tables; SHC typecheck and diff checks pass, but their individual mounted failure controls were NOT EXECUTED. `3fb6ce4e` records a source-backed named/numeric topic complexity mismatch, with the schema source-root and policy decision gates. These partial FND19 slices do not establish schema round trips or historical compatibility.

Additional marketing truth slice `c718179c` removes an unsupported shared-footer assertion tying its configured student count to successful career launches; the default count is static and no outcome evidence is provided at that component. The mounted isolated footer control passed with fetch blocked. This is IMPLEMENTED_UNVERIFIED; other marketing claims and sources remain unenumerated.

`f9621da5` extends the FND20 QuestionTable identity containment to duplicate IDs within a page; the mounted table selection passed 4 tests with mocked API and blocked fetch, and SHC typecheck passed. Cross-page identity, backend validation and canonical question contracts remain open.

Crosswalk working index through the subtopic identity slice has ten source-checked rows with scoped outcomes/dependencies; the rest of the 91 rows and any findings outside that crosswalk remain unverified. `49c44c63` traces learner reset success to HTTP OK only, without establishing durable persistence or timeout behavior. These are partial FND01/FND12/FND16 evidence, not task closure.

`634af2bc` adds two isolated real-schema question controls: current valid single/bulk inputs pass and unknown type/empty options are denied. This confirms the exercised schema only, not the SHC client/API/persistence round trip or historical data support; all FND20 acceptance gates remain open.

`bf229bf8` contains an intentionally failing isolated security probe: actual shared event consumer returns OK and invokes the handler once for a custom-schema event whose type differs from its registered type. The fake signature verifier and blocked fetch isolate the seam; actual QStash, Redis, worker and database execution are NOT EXECUTED. This test remains red until a separately selected compatible correction exists; do not suppress or reinterpret its denial invariant. The two existing worker registration/schema mismatches are traced in `W1_W3_Foundation_Crosswalk_And_Truth_Inventory.md`.

Latest retained event probe selection after `1ee6bc7c` and `e6f0983d`: 2 passed, 1 failed, exit 1. Matching registered-type positive and fake-verifier invalid-signature negative pass; mismatched type still returns OK and invokes the handler. Fixture signatures are not cryptographic verification.

Event probe refinement `d516ca63` accepts either a non-OK response or thrown parser rejection as denial while retaining the zero-handler-effects assertion. Latest selection remains exit 1, 2 passed / 1 failed: current mismatch receives OK and invokes the handler. Source-only identity adapter observations are in inventory commit `cd6057b3`; they do not establish a bypass. The complete assignment and all group acceptances remain open.

`74242830` rejects missing, blank or duplicate subtopic response IDs rather than generating IDs used in actions. Four isolated mounted controls and SHC typecheck pass. Async races and backend identity remain unverified; Sol review pending.

`70b6e78d` retains a second VERIFICATION_FAILED event probe: after an actual shared consumer handler fails, its fixture marker causes a subsequent identical retry to skip the handler (1 pass / 1 fail, exit 1); sequential duplicate following success passes. The store and verifier are simulated, not physical Redis/QStash/transaction evidence. This probe and the registered-type probe both intentionally remain failing until Sol selects compatible remediation.

`7063c7c4` links the actual publisher and consumer in a mocked QStash transport: valid enrolled event and malformed envelope controls pass 2/2 with fake verifier and blocked fetch. This positive is not physical queue, cryptographic or store evidence and does not supersede the two retained event failures.

FND26 targeted lint: from `apps/skillhubcore-admin`, with `ESLINT_USE_FLAT_CONFIG=false`, `pnpm exec eslint` over QuestionTable, SubtopicTable, DomainTable, SubjectTable, TopicTable, SkillTable and the changed events/audit/metrics/users/subscriptions pages (including both dynamic detail pages) exited 0, no warnings. From `apps/skillup-web` with the same setting, `pnpm exec eslint` over `src/lib/skillup-data.ts`, programs list/detail, faculty, batches, student dashboard/my-batch and SessionCalendar exited 0, no warnings. Exact paths are the production files in their slice manifests; tests, marketing lint, package-wide lint and builds were not included. Static checks do not qualify the retained failing security probes.

Marketing targeted lint limitation: from `packages/marketing-site`, `pnpm exec eslint src/components/footer/FooterBrand.tsx` exited 1 because ESLint 8.57.1 could not find a configuration file. No configuration was added or diagnostics suppressed. Both consuming marketing apps previously passed `pnpm exec tsc --noEmit`; marketing build and test lint remain NOT EXECUTED.

`pnpm exec tsc --noEmit` from `apps/api-server` exited 0 after the isolated FND20 schema control was added. Test inclusion is determined by the existing tsconfig and is not assumed; no full test-type gate was established.

`pnpm run type-check` from `packages/events` exited 0; the intentionally failing event security/retry tests remain separate. No package-wide test pass is claimed.

Exact targeted lint commands (each executed from its named package directory):

```powershell
# apps/skillhubcore-admin
$env:ESLINT_USE_FLAT_CONFIG='false'; pnpm exec eslint 'src/components/questions/QuestionTable.tsx' 'src/components/questions/SubtopicTable.tsx' 'src/components/questions/DomainTable.tsx' 'src/components/questions/SubjectTable.tsx' 'src/components/questions/TopicTable.tsx' 'src/components/questions/SkillTable.tsx' 'src/app/(admin)/events/page.tsx' 'src/app/(admin)/audit/page.tsx' 'src/app/(admin)/metrics/page.tsx' 'src/app/(admin)/users/page.tsx' 'src/app/(admin)/users/[userId]/page.tsx' 'src/app/(admin)/subscriptions/page.tsx' 'src/app/(admin)/subscriptions/[id]/page.tsx'
# apps/skillup-web
$env:ESLINT_USE_FLAT_CONFIG='false'; pnpm exec eslint 'src/lib/skillup-data.ts' 'src/app/programs/page.tsx' 'src/app/programs/[slug]/page.tsx' 'src/app/faculty/page.tsx' 'src/app/batches/page.tsx' 'src/app/student/page.tsx' 'src/app/student/my-batch/page.tsx' 'src/components/SessionCalendar.tsx'
```

Each exited 0 without output; no test-file or package-wide lint implied.

After the later subtopic identity change, `ESLINT_USE_FLAT_CONFIG=false pnpm exec eslint` (PowerShell equivalent `$env:ESLINT_USE_FLAT_CONFIG='false'; pnpm exec eslint 'src/components/questions/QuestionTable.tsx' 'src/components/questions/SubtopicTable.tsx'`) from `apps/skillhubcore-admin` exited 0 without output. This checks production files only.

`4ef44d49` rejects absent, blank or duplicate DomainTable response IDs instead of stringifying a missing value into an action target; isolated mounted controls pass 4/4 and SHC typecheck passes. Backend identity and request races remain unverified; SubjectTable and SkillTable were subsequently addressed by 413339cd; their isolated mounted controls passed 6 tests (valid, missing and duplicate IDs), with blank IDs and async races not separately executed.

FND19 follow-ups `413339cd` and `cc36506e` contain missing/blank/duplicate identity handling for subject/skill and topic tables; isolated mounted selections pass 6 and 4 tests respectively, with blank IDs not separately executed for subject/skill. Domain identity `4ef44d49` and subtopic identity `74242830` have separate passing controls. SHC typechecks pass. After these changes, from `apps/skillhubcore-admin`, `$env:ESLINT_USE_FLAT_CONFIG='false'; pnpm exec eslint 'src/components/questions/DomainTable.tsx' 'src/components/questions/SubjectTable.tsx' 'src/components/questions/TopicTable.tsx' 'src/components/questions/SkillTable.tsx'` exited 0. These are UI response boundaries; backend identity, async request races, taxonomy schema and complexity contract remain open.

`70a9f2dc` adds separate blank-ID controls for subject and skill tables; that mounted selection now passes 8 tests, including valid, absent, blank and duplicate cases. Earlier references to blank IDs being unexecuted are historical and superseded for this selection only. Actual API and async race evidence remains open.

`e4763745` source-checks SU-AUTH-024: the shared learner auth proxy currently returns true from `hasValidGatewaySecret` when its configured secret is absent for applicable API routes. This is not a complete route or deployment exploitability finding; runtime reachability is NOT EXECUTED and policy-dependent correction remains open.

Latest identity-file lint after all six table changes: from `apps/skillhubcore-admin`, `$env:ESLINT_USE_FLAT_CONFIG='false'; pnpm exec eslint 'src/components/questions/DomainTable.tsx' 'src/components/questions/SubjectTable.tsx' 'src/components/questions/TopicTable.tsx' 'src/components/questions/SkillTable.tsx' 'src/components/questions/SubtopicTable.tsx' 'src/components/questions/QuestionTable.tsx'` exited 0, no output. Test-file lint remains unexecuted.

## Exact isolated runner templates for later slices

All commands below ran from the repository root in a fresh PowerShell process after `$envKeys = Get-ChildItem Env: | Where-Object { $_.Name -match 'DATABASE|REDIS|UPSTASH|NEON|QSTASH' }; $envKeys | ForEach-Object { Remove-Item -LiteralPath ("Env:" + $_.Name) }`. Tests which touch fetch install a throwing fixture guard; mocks and limits are in each test/manifest. Each explicit file selection is attributable, not a whole-suite pass.

For SHC mounted component selections the exact runner form was:

```powershell
node --input-type=module -e "import { startVitest } from 'vitest/node'; import react from '@vitejs/plugin-react'; import path from 'node:path'; const v = await startVitest('test', [FILE], { run: true, config: false, environment: 'jsdom' }, { resolve: { alias: { '@': path.resolve('apps/skillhubcore-admin/src') } }, plugins: [react()] }); if (!v) process.exit(1); await v.close();"
```

Here `FILE` was replaced literally in the JavaScript array with one of `apps/skillhubcore-admin/src/components/questions/__tests__/question-timestamp-truth.test.tsx` (4 pass), `domain-error-truth.test.tsx` (4 pass), `subtopic-identity.test.tsx` (4 pass), `subject-skill-identity.test.tsx` (8 pass), or `topic-identity.test.tsx` (4 pass), all in that same questions test directory. Earlier counts in slice manifests describe earlier revisions. The SHC static events and audit/metrics/user pages used the same command without the alias and selected the respective test paths in their manifests; their counts are 1, 2 and 4 passes.

For event controls the exact runner form was `node --input-type=module -e "import { startVitest } from 'vitest/node'; const v = await startVitest('test', [FILE], { run: true, config: false }); if (!v) process.exit(1); await v.close();"`. `FILE` was the literal path `packages/events/src/__tests__/fnd23-linked-transport.test.ts` (2 pass, exit 0), `fnd23-event-type-probe.test.ts` (2 pass / 1 fail, exit 1), or `fnd23-event-retry-probe.test.ts` (1 pass / 1 fail, exit 1), respectively. These are three separate selections, not one aggregate.

Latest combined SHC mounted-table verification from repository root after clearing DB/cache/queue environment keys:

```powershell
node --input-type=module -e "import { startVitest } from 'vitest/node'; import react from '@vitejs/plugin-react'; import path from 'node:path'; const v = await startVitest('test', ['apps/skillhubcore-admin/src/components/questions/__tests__/question-timestamp-truth.test.tsx','apps/skillhubcore-admin/src/components/questions/__tests__/domain-error-truth.test.tsx','apps/skillhubcore-admin/src/components/questions/__tests__/subtopic-identity.test.tsx','apps/skillhubcore-admin/src/components/questions/__tests__/subject-skill-identity.test.tsx','apps/skillhubcore-admin/src/components/questions/__tests__/topic-identity.test.tsx'], { run: true, config: false, environment: 'jsdom' }, { resolve: { alias: { '@': path.resolve('apps/skillhubcore-admin/src') } }, plugins: [react()] }); if (!v) process.exit(1); await v.close();"
```

Exit 0, 5 files / 24 tests passed. API/hooks/child components are intercepted and fetch blocked. This selection does not execute physical APIs, browser, authorization or asynchronous owner changes.

`06db8554` dashboard truth correction and `14bc2020` helper control are IMPLEMENTED_UNVERIFIED: mounted page selection passed 3 tests with intercepted fetch, and actual helper no-enrollment/open-job selection passed 1 against mocked query adapters. SkillUp typecheck passed. Prior note that the changed helper fallback had not been exercised is superseded for this fixture only; SQL, other rows and physical services remain unverified. Fixed decorative bars are removed, missing-session percentages are unavailable, and the open-job count is labeled accordingly; the existing API field shape was retained.
