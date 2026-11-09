# Sol — focused R1–R3 legacy tutorial correction acceptance

Date: 2026-11-09 (Asia/Calcutta). Mode: independent source review and guarded offline verification. No application changes.

## Decision

**ACCEPT — CODE-ONLY LEGACY REMOVAL, limited to the R1–R3 corrections reviewed here.**

The three source-level rejection findings in `SOL_FINAL_BLOCK_TUTORIAL_LEGACY_REMOVAL_ACCEPTANCE_REVIEW.md` are resolved in the inspected working tree. This addendum supersedes that report's rejection of R1–R3 only. It does not rewrite the historical report, certify complete removal of every dormant legacy source file, close the 62-criterion ledger or approve publication/schema/runtime/deployment readiness.

The valid earlier retirement work should be retained. There is no reason to restore the old learner interface or implement a replacement indexing engine merely to retire the obsolete one. Obsolete development data need not be converted into blocks. Current block snapshots and synthetic progress remain outside any authorized reset.

## 1. Exact target and evidence identity

- Branch `main`; actual HEAD/baseline `b7fc41911d32f180b9a1435ba962786adcf318e3`.
- Target is an **uncommitted working tree**, including new tests/reports, not a new Gemini commit or deployed image.
- Initial capture: 38 changed/deleted/untracked file states, including the earlier review report. SHA-256 of tracked `git diff --binary`: `a92ad53eb231a441483bcc426f3f50786b1c4cc5eb43310611b5d694e3f0d8b3`.
- New RTH Admin test SHA-256: `991d22cb8c836710f7c4c15df508d40c11c938cdda6909d90c679147b0cd25d1` at `apps/realtutorialhub-admin/src/app/(authenticated)/dashboard/__tests__/tutorial-admin-retirement.test.tsx`. The diff hash alone does not include untracked files.
- Canonical ledger SHA-256 remains `7a6d7d43c7f535f24ca56e78781e9f98c747e7e249465121b06f37e2f56bc97e`.
- Used the updated graph for navigation and actual source/import/test bodies for conclusions. No source changes were made to obtain green tests. The review's only new file is this addendum; final input-hash comparison is recorded below.

## 2. Finding dispositions

| Finding | Classification | Current evidence and result |
| --- | --- | --- |
| R1 — executable legacy vector indexing | VERIFIED COMPLETE for source retirement and offline handler tests | `apps/realtutorialhub-web/src/app/api/workers/index-content-vector/route.ts` no longer contains chunk building, vector upsert, repository lookup or the old no-content-to-500 business branch. Its callback logs retirement and returns `Response('retired', { status: 200 })`. `createQStashHandler` still wraps it with the event schema and server tenant scope `realtutorialhub`; shared consumer verifies signature before parsing/callback. Four tests cover inline content, absent content, invalid signature and malformed input. Both valid obsolete variants have zero mocked vector upserts. |
| R2 — active Admin controls calling retired APIs | VERIFIED COMPLETE for removed operations and tested screens | `apps/realtutorialhub-admin/src/app/(authenticated)/dashboard/content/page.tsx` removes persistence calls/buttons and adds retirement guidance. `dashboard/tutorial/page.tsx` removes versions/audit/restore calls and shows explanatory panels. `src/components/layout/AdminLayout.tsx` labels the section Assignments & Practice and keeps the tutorial workspace as an informational/preview surface rather than a working old publisher. Source search finds no `fetch(...)` or `/api/tutorial/content` request in these two page files. Three real RTL render tests exercise content and history/audit tabs, check missing mutation buttons and assert no corresponding legacy network calls. Independent assignment UI remains. |
| R3 — missing hierarchy leading to empty progress identity | VERIFIED COMPLETE for the originally reported null-hierarchy defect | RTH `.../learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/assignments/page.tsx` now calls `notFound()` immediately for null hierarchy, before content lookup or returning `LearnerProgressPanel`. Valid hierarchy supplies its real `subtopic.id`; the empty-string fallback is gone. `generateMetadata` returns not-found metadata without querying content. Three tests pass, including both null-hierarchy paths. This does not prove every possible malformed adapter object has a valid UUID; normal repository hierarchy IDs are the existing authority. |

R1's retained schema/imported type names are not executable legacy indexing. The worker still authenticates and validates requests; it is not an anonymous unconditional 200 endpoint. Shared consumer infrastructure can still return non-success for failed signature, malformed data or other operational errors. Therefore the correct claim is **valid accepted obsolete events have a terminal no-index callback**, not that every possible message/provider failure can never be retried.

R2's remaining local monolithic preview/generator code is not a learner engine or database writer. Its presence must not be advertised as a functioning alternate publisher. The correction fulfills the earlier allowed design of removing persistence actions and replacing them with truthful retirement guidance; removing all preview utilities is not a newly imposed acceptance condition.

## 3. Independently executed verification

Environment: Windows PowerShell, Node 20.20.0, Vitest 4.1.0. Used `startVitest` via stdin with application config loading disabled, provider/database/token/secret environment keys removed, explicit workspace aliases, one worker, automatic JSX and the existing `audit/W1_W3_Offline_Test_Network_Guard.ts` before test imports. R2 used jsdom and the existing RTH Admin test setup (jest-dom and Next navigation mocks), not live HTTP or a real browser.

| Actual selection/check | Result | Scope |
| --- | --- | --- |
| RTH worker `src/app/api/workers/index-content-vector/__tests__/route.test.ts` | 1 file / 4 passed | Valid retired events with/without content, invalid signature, malformed payload; Receiver/vector are mocked. |
| RTH Admin `src/app/(authenticated)/dashboard/__tests__/tutorial-admin-retirement.test.tsx` | 1 file / 3 passed; standalone process exit 0 | Real mounted pages with hierarchy/editor dependencies and fetch isolated; no retired requests in tested scenarios. |
| RTH nested assignment `assignments/__tests__/page.test.ts` | 1 file / 3 passed | Null hierarchy page/metadata and positive metadata. This is not a complete interactive assignment journey. |
| DB tutorial `src/services/__tests__/tutorial-publication-lifecycle.test.ts` | 1 file / 20 passed | Existing offline regression, not real transaction/concurrency proof. |
| SHC `admin-boundary.test.ts` and `upstream-proxy.test.ts` | 2 files / 61 passed; standalone process exit 0 | Existing guard/header regressions. |
| `node scripts/check-api-boundaries.mjs` in SHC app | exit 0; 80 handlers checked | Existing static handler boundary policy. |
| `pnpm exec tsc --noEmit --incremental false -p tsconfig.json` in `apps/realtutorialhub-admin` | child exit 0 | Current corrected Admin source/tests. No Next type regeneration. |
| Same in `apps/realtutorialhub-web` | child exit 0 | Current worker/assignment correction. Combined two-check wrapper also exit 0. |
| `git diff --check` | exit 0 | Current candidate hygiene. |

Final usable test results: **91 tests passed across six files**. No new assertion failure was found in these selections. The first multi-selection review process exited 1 because my harness lacked the api-client alias for R2 and the share-branding alias for SHC. Those suites failed before tests ran; I corrected the inline harness only and reran each successfully. R1/R3/publication were passing selections in that first process, not independently successful shell processes. No repository files were edited to repair runner setup.

I did **not** rerun the claimed entire 83-test RTH Admin package or all six package typechecks. Those remain Gemini-reported results except for the independent checks above. Earlier verified UI test assertion failures and SkillUp generated-route type errors remain disclosed in the prior Sol report; they were not fixed or recertified by this focused review. Explaining duplicate responsive DOM matches is not, by itself, proof that every renderer/accessibility behavior is correct.

## 4. Preserved boundaries and outstanding qualifications

- No diff in canonical V2 composer/delivery/repository/schema/migrations, shared learner renderer/runtime, learner auth proxies or the acceptance ledger. Source still preserves working drafts, snapshot readers/writers, tenant-aware delivery and progress code. This is source preservation, not an inspection of live PostgreSQL rows or past external mutations.
- The earlier publication findings remain separate: nontransactional fallback, snapshot uniqueness/concurrency, validation-to-publication revision binding, version-1 missing-snapshot fallback and successful-publication identity. The same 20 mocked/unit tests do not close them.
- Physical PostgreSQL rollback/concurrency, real QStash cryptography/delivery, queued-event disposition in the provider, existing vector-corpus cleanup and SUIA/RTH browser journeys were **NOT EXECUTED**. No endpoint outage or database unavailability was demonstrated; these are unverified qualifications, not invented infrastructure failures.
- A terminal no-index handler does not remove previously stored vectors. Any provider-side deletion or reindexing needs its own requirement and authorization. No replacement indexing engine is demanded by this acceptance.
- Residual unused legacy repository/facade/client/notes utilities and the null content-summary helper were already disclosed. Their removal must preserve progress and V2 sanitization/schema compatibility. This addendum does not convert that residual inventory into a claim of complete source eradication or reopen unrelated services.
- Old learner 404/HTTP 410 retirement and the prior code-only safety evidence remain scoped as in the earlier report. No arbitrary redirect, identity rewrite, table DROP or migration was introduced by the corrections.

## 5. Non-blocking presentation and evidence follow-ups

1. ContentFactory still contains the headings **“Preview + publish”** and **“Review the 6 blocks below before saving a draft or publishing the content”** immediately before its retirement banner (around lines 775–787). Remove/update that stale wording to describe local preview only. The persistence controls/calls are gone, so this is not the former R2 executable defect, but the UI should not promise retired actions.
2. “Audit Logs Centralized in SHC” and version-management guidance describes workflow ownership; do not present it as independent proof that a full SHC historical restore/audit viewer has been delivered.
3. Keep reports precise: current source/offline tests establish R1–R3 closure, not zero retries under every infrastructure failure, all 18 families qualified, full application acceptance, physical data retention or a clean/committed working tree.

## 6. Handoff

R1–R3 no longer require another implementation cycle for their original source-level defects. Preserve these corrections and the original canonical block direction. This acceptance authorizes no automatic commit, push, deployment, migration, destructive cleanup, replacement indexing service or W4 work. The owner may separately decide to commit the reviewed candidate. Any commit must record its actual resulting SHA; this report supplies no invented implementation/test commit.

Broader publication integrity, runtime qualification and remaining architecture acceptance stay open under their existing scope. No canonical ledger classification was changed.

## 7. Final input preservation check

All **38** captured candidate/deleted/untracked file states matched their initial hashes after verification. The tracked diff hash and ledger hash also matched. Only this new review addendum was excluded from that comparison. The earlier Sol rejection report, Gemini's correction report and all application/test inputs remain untouched. The working tree remains uncommitted; no clean-tree claim is made.
