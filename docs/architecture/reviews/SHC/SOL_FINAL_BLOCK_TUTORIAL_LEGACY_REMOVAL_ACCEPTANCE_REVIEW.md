# Sol — final block tutorial legacy-removal acceptance review

Date: 2026-11-09 (Asia/Calcutta). Reviewer: independent principal architecture-review role.

## 1. Final determination

**REJECT — CORRECTIONS REQUIRED.**

The retirement of the old learner notes interface and content HTTP handlers is demonstrated in source and focused offline tests. The block shell, current snapshots and progress implementation were not deleted. Those improvements should be retained.

The complete-retirement claim is nevertheless not supported: the legacy vector worker still accepts and indexes inline monolithic content, and live Admin page code still offers operations backed by the newly retired APIs. These are bounded source-level corrections, not reasons for a broad rewrite or a database migration. Other limitations and pre-existing publication weaknesses are separated below.

The owner has confirmed development-only use, no end users and obsolete legacy tutorial records. This review imposes no old-data conversion, long public-client compatibility window or new indexing-engine requirement. It also does not interpret that clarification as approval to erase current block documents, snapshots or synthetic progress state.

## 2. Exact target and methodology

- Branch: `main`.
- Baseline and actual HEAD: `b7fc41911d32f180b9a1435ba962786adcf318e3`.
- Reviewed target: **uncommitted working-tree diff**, not a new implementation commit. Index was empty.
- Baseline b7fc4191 already deleted the three unused `TutorialDefinitionContent`, `TutorialCodeContent` and `TutorialSummaryContent` files. They must not be counted again as deletions in this candidate.
- Candidate: 29 tracked paths changed (25 modified, four deleted), plus Gemini's new untracked implementation report. `git diff --stat`: 288 insertions, 2,630 deletions before this review output.
- SHA-256 of `git diff --binary --no-ext-diff` at review capture: `7efda288187ca05a3f2d7f649dec0b5650a7d4e4bdbb7ddcf0cca04d3e2cce87`. This identifies the inspected diff, not a commit or deployable image.
- Canonical ledger SHA-256: `7a6d7d43c7f535f24ca56e78781e9f98c747e7e249465121b06f37e2f56bc97e`. No ledger diff exists.
- Used `graphify query` for the engine/repository/worker graph, then actual source/import searches, exact diff inspection, test-body inspection, guarded offline executions and nonincremental no-emit TypeScript checks. Graph presence was not treated as runtime reachability.
- Direct dependencies inspected: both learner wrappers/proxies and shared resolver/shell, SHC draft/publish path, delivery/composer/repository/schemas, retired handlers, RTH Admin callers, assignment/remediation helper chain, vector worker/query path and the progress service.
- Governing context remains the canonical SHC review standards and prior `SOL_TUTORIAL_BLOCK_CONSOLIDATION_REVIEW_5e629fe6.md`. The existing 62-criterion ledger was not edited. OD-01…OD-09 references in the implementation report are not independent evidence that every outcome was achieved.

No source/test/config edits, migrations, database connections, provider calls, browser logins, staging, commits, pushes, deployment or acceptance-ledger edits were performed by this review. This requested report is its sole authored file. Test compilation may use ordinary ignored tool caches; no application artifact regeneration/build was requested.

## 3. Acceptance matrix

| Area | Classification | Independent conclusion |
| --- | --- | --- |
| Old `/start-learning/subtopic/*` interface | VERIFIED COMPLETE, for retirement signals | Both page exports call `notFound()`; direct offline invocation produces the Next 404 signal. No arbitrary redirect/page-node invention. Full HTTP/browser behavior remains unverified. |
| Old `/api/tutorial/content/*` HTTP data access | VERIFIED COMPLETE, for inspected tombstones | Central GET, both learner BFF GETs and seven handlers across six RTH Admin route files return 410 without storage access. Tests/direct invocation support this. Routes remain as tombstones; they are not deleted files. |
| Old wrapper/components removed in candidate | COMPLETE IN SOURCE, RUNTIME UNVERIFIED | `SubtopicNotesPage` and wrapper plus RTH route loading/error files deleted; imports removed from the two retired entries. Baseline's three shell renderers were already gone. |
| Canonical V2 authoring/delivery/shell | COMPLETE IN SOURCE, RUNTIME UNVERIFIED | Existing canonical path preserved byte-for-byte in the diff; no old fallback reintroduced. No real SHC → SUIA/RTH publication journey executed. |
| Legacy indexing retirement | CORRECTION REQUIRED | Inline `content` still selects the monolithic chunk builder/vector upsert branch. Passing worker test expressly expects this. |
| RTH Admin old authoring UX | CORRECTION REQUIRED | Still-mounted content/tutorial screens call retired save/publish/history/restore APIs. A 410 handler test is not a correctly retired UI. |
| Assignment/remediation | COMPLETE IN SOURCE for retained history/operations; CORRECTION REQUIRED for missing-identity behavior and truthful content contract | Legacy DB sourcing removed through a null stub; actual assignment/history services remain. No V2 content adapter was introduced, and assignment page can mount with empty subtopic identity. |
| Progress/telemetry/assessment/session implementation | COMPLETE IN SOURCE, RUNTIME UNVERIFIED | Owning code/schema unchanged. Seven progress-route binding tests and selected component tests pass; not physical persistence qualification. |
| SQL snapshot/data preservation | COMPLETE IN SOURCE, RUNTIME UNVERIFIED | No migration/schema/data-deletion code in candidate; current V2 snapshot reader/writer preserved. Live rows/counts/DDL history were not inspected. |
| New snapshot migration or old-table DROP | REQUIRES OWNER APPROVAL | No such change is required to correct this candidate. Earlier design remains unapproved. |
| New block families, replacement indexing engine, unrelated services, W4 | NOT IN SCOPE | No expansion authorized by this review. |

## 4. Corrections required before code-retirement acceptance

### R1 — P1: legacy indexing remains executable

`apps/realtutorialhub-web/src/app/api/workers/index-content-vector/route.ts:35–38,135–164` still accepts `TutorialContentSchema` in the event's optional `content` field. When present, it bypasses the new empty `getPublishedContent` adapter and feeds `buildAiTutorVectorChunks` and `vector.upsert`. It is **not** loading a confirmed published canonical TutorialDocument snapshot. Signature validation/tenant-scoped QStash handling remains present; this is not an allegation of anonymous network injection.

Evidence stronger than a filename: the unchanged test at `__tests__/route.test.ts:154–168` passes for “indexes five chunks for a valid publish payload”, asserting notes/layman/real_life/technical/code chunk IDs and one vector upsert. A valid signed prior/other producer message can still take this branch. Disabling one old publisher does not disable its consumer.

Messages without inline content now get `[]`, release the lease and throw “Published tutorial content not found” (500), rather than reaching a defined retired terminal outcome. Their prior published-repository path is gone, but the worker has not been coherently retired.

**Bounded correction:** if the old producer/consumer is intentionally retired, retire all indexing branches with an explicit authenticated, terminal message disposition and zero vector/legacy-DB effects. Define how queued obsolete events terminate without endless provider retries. Do not create a new V2 indexing engine unless separately required/approved. If indexing is retained, the only permissible source is an authorized published canonical snapshot with tenant/version provenance; that is a separate implementation choice.

Tests must prove zero upserts for both inline and absent legacy content, correct terminal/retry behavior and preserved signature/ownership denials. Do not remove negative signature tests merely to turn the suite green.

### R2 — P1: remaining Admin controls are wired to intentionally dead APIs

`apps/realtutorialhub-admin/src/app/(authenticated)/dashboard/content/page.tsx:372–399` still exposes save/publish requests to `/api/tutorial/content` and `.../[id]/publish`. `dashboard/tutorial/page.tsx:93,126,184` still requests versions/audit/restore. `src/components/layout/AdminLayout.tsx:70` retains the Tutorial navigation entry. These pages were not retired by the candidate.

All of those operations now deterministically reach 410 handlers. Backend retirement is correct; leaving an operational authoring/history UI that promises these actions is incomplete. This is not evidence of an old API successfully reading data, but it is a broken active UI contract and conflicts with exclusive SHC authoring.

**Bounded correction:** remove/disable tutorial-specific action controls and obsolete navigation, or replace the old screens with explicit retirement/unavailable guidance to the existing SHC composer. Do not redirect across identities/origins by an unvalidated supplied URL. Keep independent assignment administration and unrelated RTH Admin services. Add rendered screen/navigation tests showing no requests to the retired APIs and no false success message. A new authoring interface is unnecessary.

### R3 — P2: missing hierarchy now becomes an empty progress/assignment identity

RTH learner `.../learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/assignments/page.tsx:35–39,89–95` changes the former seed fallback to `hierarchy?.subtopic.id ?? ''`, then renders `LearnerProgressPanel` with it. The component at `src/components/content/LearnerProgressPanel.tsx:199–207` starts assignment/progress queries without a nonempty-ID enabled guard. Missing/failed hierarchy resolution can therefore request `/api/tutorial/assignments/?difficulty=simple` and empty-identity progress, rather than a defined not-found/unavailable page.

Removing fabricated seed content is appropriate. Replacing the seed identity with an empty identifier is not a complete missing-data policy.

**Bounded correction:** reject/handle missing hierarchy before mounting effects; never invent a subtopic ID. Test missing hierarchy separately from a real hierarchy with unavailable tutorial content. Preserve real assignment start/complete/history behavior. This is a source-derived defect; no live assignment mutation was attempted.

## 5. Remaining code and contract limitations

These are not claims that obsolete records are still used by students:

- `apps/api-server/src/modules/tutorial-engine/tutorial.engine.ts:65–77,103–143,304+` still has `contentRepo`, resolver token, instance/static `getTutorialContent`. `tutorial.service.ts:47+` still exports the content facade. The surviving progress path constructs this same engine, so content repository coupling was not actually removed from it. No remaining mounted content handler calling `getContent` was found after retirement. Extract/remove the obsolete content capability without deleting progress methods in a bounded follow-up; do not claim it has already been done.
- RTH `src/lib/tutorial-content-api.ts:71–99` still tries the old HTTP endpoint and then `TutorialContentRepository.getPublished` on a non-OK response. Its current production caller was removed from `tutorial-hierarchy.ts`; tests still import it. It is a residual exported legacy reader, not proof that the canonical page reads it. Remove it and obsolete callers/tests only after confirming no consumers; do not leave a 410-to-DB fallback in something later reused as V2.
- `packages/api-client/src/modules/tutorial-client.ts:86–89` still exports `getContent` against the retired endpoint. Repository search found no actual app call to that method; reconcile the unused public client contract rather than describe it as supported.
- `src/share-branding/subtopicNotesDataAPI.ts`, old section validators/notes renderer files and hybrid RTH `src/server/tutorial-delivery.ts` remain. The latter is still used by sitemap helpers and retains old-format validation. Do not delete the entire module indiscriminately. The visible old notes entry points are retired; not every associated source file has been removed.
- `packages/db-tutorial/src/tutorial-contract-audit.ts:17,117` still looks for the deleted notes page and its former section architecture. It returns an empty string for absent files, then performs a DB audit. It was not run here. Retire/update that obsolete audit recipe; do not run it merely to demonstrate a failure.
- The candidate's `getPublishedTutorialContent` now always returns null. Assignment/remediation callers are no longer querying old content, but they also receive **no canonical block document**. With content guidance deliberately retired, use explicit unavailable/retired copy and remove stale notes-fetch expectations. If real V2 summaries are required, implement that separately against published canonical identity. A null stub is not a V2 migration.

Remaining unused code can be a follow-up where it has no active side effects. R1–R3 and the false completion claims must be corrected before this candidate receives final code-retirement acceptance.

## 6. Canonical V2 and tenant/auth preservation

The diff does not modify SHC `hooks/useTutorialSave.ts`, `services/tutorialSaveService.ts`, composer route guards, `TutorialComposerService`, `TutorialSectionRepository`, `TutorialDeliveryService`, the shared sidebar/runtime resolver or TutorialPageShell/renderer. The shell still renders `payload.content.blocks` with no old monolithic fallback. Code/Definition/Introduction/Summary/Objective version registrations remain.

Both learner `/tutorial-v2/.../[navigationNodeId]` page wrappers still pass explicit `skillup`/`realtutorialhub`, select the shared shell and retain navigation identity. SUIA canonical slug redirect handling is unchanged. Shared `authProxy.ts` still matches these protected paths, verifies the learner token and sets the server identity headers; the pages retain cookie/identity rejection. These are preserved source controls, not a fresh deployed entitlement qualification.

Delivery retains exact-tenant-or-shared SQL predicates and precedence. Required sanitization and current block-schema compatibility types remain. The 18 educational-family catalogue is not proof that all documented versions are implemented: the selected renderer tests cover existing implemented primitives/versions, not all 18 families and 133 documented versions. No new family completion or authentication system is required for retirement.

The new pure 410 tombstones omit their former data-operation guards. For handlers that do nothing except return a generic retirement response, this does not expose private data or authorize a write; it is not equivalent to removing a guard from an active operation. Canonical SHC and learner security controls must remain intact in the correction patch. Existing worker signature validation must also be preserved on any retained message handling.

## 7. Publication and PostgreSQL review

The four named tables and their schema/migrations are unchanged in the candidate. `tutorial_sections` remains the working block document; `tutorial_content_versions` remains its published snapshot store; `tutorial_content` and experimental `tutorial_page_content_v2` are not dropped. Snapshot preservation is **verified as source preservation only**. No live table counts, deployed records, triggers/FKs, query logs or independent backup/restore evidence were collected; this review cannot attest to operations outside the diff.

The earlier source findings in `SOL_TUTORIAL_BLOCK_CONSOLIDATION_REVIEW_5e629fe6.md` remain unchanged and must not be marked fixed by 20 passing unit tests:

1. Repository `publishTutorial:606–610` still falls back to nontransactional execution.
2. Snapshot schema still lacks a unique `(content_id, version)` constraint; SELECT-before-INSERT is not concurrent uniqueness.
3. Composer validation of a revision is not passed as an expected-revision publication contract to the repository's later read.
4. Normal/direct-ID delivery still allows working-content fallback when snapshot is missing at version 1; missing snapshots above version 1 fail closed. Therefore “any missing snapshot fails safely” is not fully established.
5. Snapshot selection remains highest version/time, not an explicit successful-publication pointer. Draft CAS remains optional at the service contract.

These are **pre-existing publication limitations**, not introduced by this removal diff. They do not justify restoring legacy interfaces, but they prevent treating this review as acceptance of safe concurrent publication or all OD-07/08 assertions. Preserve draft/publish behavior now; route any correction to a separate bounded source change with actual repository tests. Physical PostgreSQL rollback/concurrent publish, real draft isolation and cross-tenant queries remain unverified.

The dedicated snapshot proposal also remains **REQUIRES OWNER APPROVAL / corrections required**, separate from this patch. Use a verified free migration number, `ON DELETE RESTRICT` or an explicit retention policy instead of automatic history cascade, unique section/version identity, immutable schema-validated documents and atomic committed publication identity. Validate V2-only backfill, conflicting duplicates and orphans; do not hide disagreement with `ON CONFLICT DO NOTHING`. Dual-read fallback must not silently select a stale migrated version. Rollback after new writes must preserve/reconcile those writes; DROP is not a lossless rollback. See the prior review for the proposed pointer/FK and development cutover design.

No schema or data action is needed to retire the remaining worker/Admin UI code. No destructive cleanup is approved merely because a caller disappears. If the owner elects a development reset later, explicitly name whether current block snapshots and synthetic progress are included.

## 8. Assignment, remediation and progress safety

The candidate does not delete assignment/progress repositories, stored history, telemetry state, assessment/session schema or relevant APIs. Learner assignment pages still render `LearnerProgressPanel` with assignment/progress operations. Remediation still authenticates the learner and loads their history at `learn/remediation/page.tsx:97–99`; old notes excerpts now become generic fallback text because the helper always returns null.

These source changes preserve the operations, but **not a demonstrated 100% operational journey**. The passing assignment-page test mocks the hierarchy/content helper and tests metadata; it does not render real assignment state or exercise the new null helper. Progress route binding tests mock the service/repository with an in-memory store; they verify route identity denials, not physical persistence or the actual TutorialEngine's isolation. Selected completion component tests use mocked fetch.

RTH Admin assignment generation remains available with manual source material. The removed auto-fetch effect no longer refreshes/clears a prior nonempty selection's source automatically; test context transitions so stale source material is not silently attributed to a different topic. This is a specific regression risk to qualify, not evidence that stored assignments were erased or a request to retire the whole assignment feature.

No explicit owner instruction authorizing deletion of independent assignment/remediation functionality was supplied here. Retire only obsolete content sourcing; preserve their separate services/history, handle unavailable guidance truthfully and fix R3.

## 9. Independently executed checks

Environment: Windows PowerShell, Node 20.20.0, Vitest 4.1.0. No application `.env.local` files loaded by the review runner. Provider/database/token/secret environment keys removed from child test environment; existing `audit/W1_W3_Offline_Test_Network_Guard.ts` installed before module imports. No live HTTP listener or provider access used.

Test runner was supplied through PowerShell stdin (`@'…'@ | node --input-type=module`) using `startVitest`, `config:false`, one worker, no file parallelism, explicit source aliases, globals and automatic JSX transform. The source selections and results are exact below. Configuration bypass is intentional: package configs may load shared application environments or broad global DB mocks. Results are independent guarded selections, not claims that the standard unguarded package command was run.

| Selection / actual command | Result | Classification / limit |
| --- | --- | --- |
| `startVitest` publication: `packages/db-tutorial/src/services/__tests__/tutorial-publication-lifecycle.test.ts` | 1 file, 20 passed; selection PASS | VERIFIED COMPLETE as offline selection only; includes fake transactions and copied helper logic. Not PostgreSQL qualification. |
| API content retirement + `progress/__tests__/batch-08-identity-binding.test.ts` | 2 files, 8 passed | VERIFIED COMPLETE as guarded route tests; progress service/repository mocked. |
| RTH Admin `src/app/api/tutorial/content/` | 6 files, 7 passed; selection PASS | VERIFIED COMPLETE for direct handler 410 contracts, not Admin screen retirement. |
| RTH Web worker, `tutorial-content.test.ts`, `tutorial-content-api.test.ts`, nested assignment `page.test.ts` | 4 files, 11 passed | VERIFIED COMPLETE for that selection. Worker success asserts the residual legacy path; metadata/helper tests do not qualify the real composed journey. |
| SHC `admin-boundary.test.ts`, `upstream-proxy.test.ts` | 2 files, 61 passed | VERIFIED COMPLETE for existing guard/header tests, not every learner entitlement. |
| UI `TutorialRenderer.test.tsx`, `TutorialRendererRouting.test.tsx`, `BlockDOMIdentity.test.tsx`, `instructionalBlockCompletion.test.ts`, `InstructionalBlockCompletionOrchestrator.integration.test.tsx` | 5 files: 94 passed, 2 failed; group/runner exit 1 | CORRECTION REQUIRED for a green broader gate. Failures in table/comparison single-element text queries, detailed below; four other files pass. |
| `node scripts/check-api-boundaries.mjs` from SHC app | exit 0; 80 handlers checked | VERIFIED COMPLETE static boundary check; only health declared public. |
| Direct offline Node/tsx invocation: SUIA and RTH legacy content GETs | each status 410, exit 0 | VERIFIED COMPLETE handler invocation, not gateway/HTTP/browser. |
| Same invocation: both retired page exports | each Next 404 exception signal, exit 0 | VERIFIED COMPLETE page function behavior, not full streamed HTTP response status. |
| `pnpm exec tsc --noEmit --incremental false -p tsconfig.json`, from `packages/db-tutorial` | exit 0 | VERIFIED COMPLETE scoped check. |
| Same from `apps/skillhubcore-admin` | exit 0 | VERIFIED COMPLETE scoped check; intentionally did not run the type-generation script. |
| Same from `apps/realtutorialhub-admin` | exit 0 | VERIFIED COMPLETE scoped check. |
| Same from `apps/realtutorialhub-web` | exit 0 | VERIFIED COMPLETE scoped check. |
| Same from `apps/api-server` | exit 0 | VERIFIED COMPLETE scoped check. |
| Same from `apps/skillup-web` | **exit 2**, two errors | CORRECTION REQUIRED / retained baseline issue, not whole-workspace green. |
| `git diff --check` | exit 0 | VERIFIED COMPLETE whitespace check on candidate. |

The final usable guarded unit/component results contain **201 passing tests and two failures across 20 files**. The two failing tests are in unchanged `packages/ui/src/tutorial/__tests__/TutorialRenderer.test.tsx`: table caption “JDK vs JRE vs JVM” and comparison heading “Typing” use single-element text queries while responsive markup contains multiple matches (lines 159 and 321). This is not proof of broken learner rendering, nor permission to weaken meaningful assertions. Verify intended responsive/accessibility behavior and adjust the test or implementation accordingly. These files and block implementations are unchanged by this candidate.

The multi-selection test processes exited 1 overall: the first because of review-harness setup failures, the corrected rerun because of the two UI assertion failures. Individual passing selections above are not mislabeled as independently successful shell processes. The TypeScript loop also exited 0 as a wrapper, but records each child status; SkillUp's child exit 2 remains a failed gate.

SkillUp TypeScript errors are generated `.next/types/app/api/faculty/route.ts:41` and `.../programs/route.ts:41`: optional `NextRequest | undefined` does not satisfy the required handler parameter check. Corresponding source signatures and generated types are not changed by this diff. No build/type regeneration or source repair was performed. The issue is a current gate failure; it is not established as a regression caused by retirement.

Initial custom-runner attempts had alias/JSX/global/DOM configuration failures. I corrected only the inline review harness and reran the same applicable selections; those setup failures are not counted as production regressions or hidden as PASS. An initial direct page invocation also required CJS default-export interop correction. No repository test or application file was edited to achieve the corrected runs.

The unmodified publication test file still uses `vi.fn(cb => cb(fakeTx))`; several “delivery” cases call mocked methods or local copies of status/sort logic. Its green result does not resolve the earlier snapshot/transaction findings.

## 10. Not executed / evidence still required

- Physical PostgreSQL transactions, snapshot counts, duplicate checks, final committed-state assertions, rollback and cross-tenant delivery: **runtime unverified**, needs a specifically authorized isolated DB. No infrastructure outage was demonstrated, so this is not mislabeled BLOCKED BY INFRASTRUCTURE.
- SUIA/RTH authenticated browser publication/navigation/progress journeys, logout/session expiry and real HTTP/gateway handling: **runtime unverified**. Direct handler tests above are not browser evidence.
- Actual canonical Save Draft → learner sees old revision → Publish intended revision → both tenants see new publication: **runtime unverified**.
- Future-tenant SQL delivery and all 18-family/version rendering coverage: **runtime unverified**, not established by a JS tenant registry or block catalogue.
- Deployed image, existing vector corpus, queued-message count, scheduled scripts and external mutation history: **not verified**. Do not infer physical table or queue state from a source diff.
- Full workspace tests/build/lint, DB migrations, snapshot schema implementation and destructive cleanup: **NOT IN SCOPE** for this read-only acceptance review.

## 11. Next safe phase

1. Preserve the valid 404/410 retirement and deleted orphan wrapper work.
2. Correct R1: fully retire legacy inline/DB indexing effects and give old messages a deliberate terminal disposition; preserve signature controls. No new indexing engine required.
3. Correct R2: retire/disable the old RTH Admin tutorial controls/navigation or replace them with truthful guidance to the existing SHC composer; keep independent assignment administration.
4. Correct R3: missing hierarchy must not mount effects with an empty progress/assignment identity. Exercise real assignment controls and remediation fallback states with isolated adapters.
5. Remove proven unused content facade/client/helper exports and obsolete tooling references as a separately bounded cleanup, preserving progress and required V2 sanitization/schema compatibility. Do not delete whole service modules by name.
6. Rerun relevant negative and positive tests, disclose the unchanged broader failures, and correct the implementation report's “all complete / runtime decoupled / 100% operational / safe concurrent publication verified” claims.
7. Request focused rereview of those corrections. No additional general architecture audit or database operation is required to fix R1–R3. Dedicated snapshot work remains a separate owner decision.

**This recommendation is not approval to implement, commit, deploy, migrate or drop tables.** It is the read-only disposition requested by the owner. Final code-only acceptance is withheld for the bounded defects; production/runtime and publication-integrity acceptance are separately unverified.

## 12. Candidate manifest and preservation check

The following exact candidate files were captured before review tests. Hashes bind this report to the uncommitted bytes, including the author's report; deleted paths are explicit. This reviewer adds only this report. **Final verification: all 30 candidate-file states/hashes, the tracked diff hash and the ledger hash matched the initial capture.** No implementation input changed during review. The checkout remains intentionally dirty with Gemini's candidate and the review outputs; there is no clean-tree or committed-review claim.

| Candidate path | SHA-256 / deletion |
| --- | --- |
| `.gitignore` | `15678fd769d026dc2c8b2f56e8c0f869b134d9d79b623f36cb71b7d601acf165` |
| `apps/api-server/src/app/api/tutorial/content/[subtopicId]/__tests__/route.test.ts` | `a3fa8ec161873fda0fb20c211ce7b75bc8309c1ba031706e4941cdc23823adea` |
| `apps/api-server/src/app/api/tutorial/content/[subtopicId]/route.ts` | `d0a3506b8b8c712322c086c19da2420c23744c009d600417e8cc9f12c7bab4fe` |
| `apps/realtutorialhub-admin/src/app/(authenticated)/dashboard/assignments/page.tsx` | `337cd911150fc1df9ba8b493ac332c6d7923a965c08574b10be91a8944c8eca2` |
| `apps/realtutorialhub-admin/src/app/api/tutorial/content/[id]/__tests__/route.test.ts` | `d4a3a89cc2e32a86a1285e89ef55e309131e799bf5aa5ebdfde104a55133ca00` |
| `apps/realtutorialhub-admin/src/app/api/tutorial/content/[id]/publish/__tests__/route.test.ts` | `748c1f5c4d744fcee5a581169e49e0ff48a0c979c0f1c4ccebb6634a31b5e3ad` |
| `apps/realtutorialhub-admin/src/app/api/tutorial/content/[id]/publish/route.ts` | `dd51972606c755d45dab60181e9198b5ec60cecab7a99cb53ef40462e3691d49` |
| `apps/realtutorialhub-admin/src/app/api/tutorial/content/[id]/restore/__tests__/route.test.ts` | `2a39435042170de0af3a8f8db261cb66e22677cdc20befa3c2bea34565c3f816` |
| `apps/realtutorialhub-admin/src/app/api/tutorial/content/[id]/restore/route.ts` | `098907a8ea69e9d3a25c348b172f2e05af1812d4730b796ac8fd4a89a3258d34` |
| `apps/realtutorialhub-admin/src/app/api/tutorial/content/[id]/route.ts` | `19d436e5ede08e541676086f3b539a1377171932039547b5607e6aaeaede8b6a` |
| `apps/realtutorialhub-admin/src/app/api/tutorial/content/__tests__/route.test.ts` | `c6771962f9444dfa02f2a02dcba86728905a34338175ca3f45f0bd97aafbf2f2` |
| `apps/realtutorialhub-admin/src/app/api/tutorial/content/audit/__tests__/route.test.ts` | `1e58792739ca98efeb3d680b502cf0cc75ff71dae988e19f9a4024e8df738a4f` |
| `apps/realtutorialhub-admin/src/app/api/tutorial/content/audit/route.ts` | `6228964e1776f40a3cdc387f9ea7593061479bbbf67802674ed9bf133dde15cc` |
| `apps/realtutorialhub-admin/src/app/api/tutorial/content/route.ts` | `c4bed88929ba5fdd58cf196bd111469048ae7b0b806929f639b2920f01af1380` |
| `apps/realtutorialhub-admin/src/app/api/tutorial/content/versions/__tests__/route.test.ts` | `389f42602c0553d4e7f02b06f256c8f04e30ee9d174738b816122683cb9a4cb5` |
| `apps/realtutorialhub-admin/src/app/api/tutorial/content/versions/route.ts` | `15a5eae28cfea56f79fb94e9a9ac4f675305d6ecc12c600dc9b3e564deec2e8b` |
| `apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/assignments/page.tsx` | `7582db068144dfca12b88e300746443a3c6a9d9a4674520318d1d4b2eab81e23` |
| `apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts` | `0833440bb591d0b91032e460d19e1f61132354c676c0d73483558143d32b1a2a` |
| `apps/realtutorialhub-web/src/app/api/workers/index-content-vector/route.ts` | `086fb60bdf335076ea45ecd0cc0e7cb4fb3fc9a122ccb71bb37d8ef9af29868e` |
| `apps/realtutorialhub-web/src/app/start-learning/subtopic/[subtopicId]/error.tsx` | `DELETED` |
| `apps/realtutorialhub-web/src/app/start-learning/subtopic/[subtopicId]/loading.tsx` | `DELETED` |
| `apps/realtutorialhub-web/src/app/start-learning/subtopic/[subtopicId]/page.tsx` | `0f89c859e183c130e30c7b8b0f1865d5d2d0163d4c91d1964c7c673dc08901d0` |
| `apps/realtutorialhub-web/src/lib/__tests__/tutorial-content.test.ts` | `d8308cfa8feaa0789672ded1d7fc77dd707ac64cabbe04d1463feca79770575b` |
| `apps/realtutorialhub-web/src/lib/tutorial-content.ts` | `a017b69f02036dd23cad3893212454898951f0cf45dcb88e02b27f366b6fb498` |
| `apps/realtutorialhub-web/src/lib/tutorial-hierarchy.ts` | `a76ba4186254e976bde8d825a8be715faa98d016dfc561bcb16597d0c38b9bbb` |
| `apps/skillup-web/src/app/api/tutorial/content/[subtopicId]/route.ts` | `f2d436224cb9c2cbc089c51775504c85c3280a466963548d5bda38cc50ef0d81` |
| `apps/skillup-web/src/app/start-learning/subtopic/[subtopicId]/page.tsx` | `5a0222c0d607806fe3b1567e8cffc7e054d9feae5f929a96acf333b010e1a17e` |
| `src/share-branding/SubtopicNotesPage.tsx` | `DELETED` |
| `src/share-branding/SubtopicNotesPageWrapper.tsx` | `DELETED` |
| `docs/architecture/reviews/SHC/SHC_BLOCK_TUTORIAL_FINAL_LEGACY_CODE_REMOVAL_IMPLEMENTATION.md` | `9d81609f602a5737581afe074016ed327675bd0d51fb809c33fbe1d500ac750c` |

