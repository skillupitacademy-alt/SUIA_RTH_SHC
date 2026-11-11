# Independent HTTPS Chromium UAT — Tasks 36, 37 and 39

Reviewed source: `5c43cee7d2afe85aeca69ba73b92bd601f65264b` (local main).
Run: `sol-uat-20261110-https`. Date: 10 November 2026, Asia/Kolkata.

## Verdict

**PARTIAL — authoring and shared published delivery verified; full runtime acceptance withheld.**
This report records independent Playwright browser execution and read-only/cleanup PostgreSQL queries, not the earlier developer-reported unit-test totals. No broad quality suites were rerun and no acceptance classifications were changed.

## Environment and authorization

The owner authorized remote Neon UAT writes, synthetic tutorial creation through SHC Composer, learner consumption, screenshots, bounded cleanup, service restarts, and local HTTPS configuration. No Docker database was started. Frontends run at https://skillhubcore.localhost:3007, https://skillup.localhost:3009 and https://realtutorialhub.localhost:3003. API server and gateway were retained.

A local self-signed certificate covers the three brand names and localhost. Browser contexts explicitly ignored certificate trust errors for this local test; a separate Node HTTPS probe using the certificate as its CA returned HTTP 200 from all three login URLs. This is local development TLS evidence, not public certificate/deployment qualification. System trust stores were not changed. Private key and certificate are outside Git under the user's Local AppData Codex directory. SHC_ADMIN_ORIGIN was set only in the SHC server process to the HTTPS origin; application code and environment files were not edited.

Playwright's connected Chromium version was 157.0.8103.39. Actual UI interactions filled login forms, created hierarchy records, published the shared sidebar, selected hierarchy and navigation nodes, added Definition D1 and Code C1 blocks, saved, loaded a block into the editor, edited, published and republished. No mocked browser requests or direct SQL inserts substituted for authoring. Browser login status was 200 for all three accounts. SHC identity API returned current super_admin role.

## Acceptance matrix

| Scenario | Expected | Observed | Result |
|---|---|---|---|
| Three HTTPS login pages | 200 | 200 with explicitly trusted local certificate | PASS |
| SHC login/current identity | Authorized admin | Login 200; identity 200, super_admin | PASS |
| Synthetic hierarchy creation through UI | Persisted new hierarchy | Four create requests returned 201 | PASS |
| Duplicate normalized sidebar IDs | Reject invalid tree | 400, no sidebar publish | PASS |
| Shared sidebar publication | Publish and sync hierarchy | 200, published; TutorialDB hierarchy created | PASS |
| Composer D1 draft creation and editing | Persist valid block/version | Create 201; edit 200; stable block ID, version 1 to 2 | PASS |
| Unpublished content on both portals | No draft block exposure | 200 empty-content state, zero rendered blocks | PASS |
| Page A publication | Published snapshot | Deployed version 3 and matching snapshot; rendered on both portals | PASS |
| Save new private draft after publication | Learners retain published revision | Working version 4 changed; both learners retained version 3 text, private marker absent | PASS |
| Page B C1 save/publish | Real Java code block | Create 201; PATCH 200; publish POST 200; snapshot version 2 | PASS |
| Republish Page A | New approved snapshot visible | PATCH/publish 200; version 5 snapshot; both learners displayed new text | PASS |
| Page A to B and back | Correct canonical page identity | Real links navigated to each test node in both portals | PASS |
| SUIA/RTH branding | Respective presentation | SA/SkillUp IT Academy and RTH/RealTutorialHub rendered | PASS |
| Foreign-brand token on RTH ILS | Reject | SUIA token received 401 | PASS |
| Learner token on SHC authoring API | Reject before mutation | 401 | PASS |
| ILS navigation/visit/block telemetry | Successful runtime responses | Navigation, visit, block-visit and active-time calls returned 200 | PASS within observed scope |
| ILS completion counter | No false completion | Both showed 0 of 1 blocks completed | PASS within observed scope |
| Older subtopic progress API | Successful progress read | Both portals returned 500 from /api/tutorial/progress | FAIL |
| Exact originally requested hyphenated page paths | Resolve requested fixture pages | Both paths returned 404 on both brands | FAIL / test-plan mismatch |
| Tenant-only publication exclusion | Deny other tenant | Not executed: Composer UI publishes shared content in this run | NOT VERIFIED |
| All 18 block families | Correct rendering | Only D1 and C1 exercised | NOT VERIFIED |
| Docker image build/restart/recovery (Task 39) | Actual container smoke | Not executed; owner instructed remote Neon, no local Docker DB | NOT EXECUTED |
| Cleanup and baseline preservation | Zero owned rows; original IDs retained | Verified after commit in each database | PASS |

## Confirmed runtime blocker

Both authenticated portals returned HTTP 500 for:
`/api/tutorial/progress?subtopicId=18c06a7d-558b-4c99-a24e-7be1d9ead87e`.
The BFF returned `Failed to get progress`. A read-only PostgreSQL query `select tenant_id from tutorial_progress limit 0` independently failed with SQLSTATE `42703`: `column "tenant_id" does not exist`.

Relevant current source:
- `packages/db-tutorial/src/schema/tutorial-progress.ts:13` declares tenant_id.
- `packages/db-tutorial/src/repositories/tutorial-progress.repository.ts:79` filters on it.
- `apps/api-server/src/app/api/tutorial/progress/route.ts:150` invokes that repository.
- `apps/skillup-web/src/app/api/tutorial/progress/route.ts:72` propagates the upstream failure status.

This demonstrates source/database schema mismatch on the configured TutorialDB. The correlation with the 500 is strong; the backend process's full exception log was not captured, so no undocumented second cause is ruled out. No migration or weakening of tenant checks was performed. Prepare a separately reviewed schema-alignment plan before any approved database change. ILS navigation telemetry succeeding does not make this failure PASS.

## URL and progress-identity findings

The requested hierarchy did not exist. A marked disposable Programming > Java > Java Basics > WhatIsJava hierarchy was created through SHC UI. Existing Java content under Full Stack Development was not edited.

Current sidebar normalization strips punctuation (`navigation-id.ts:43`). Requested IDs `what-is-java` and `java-syntax` become `whatisjava` and `javasyntax`. Those familiar IDs cannot safely be reused for this run: existing learner progress already references `whatisjava` on an older subtopic, and the active progress identity is `(user_id, navigation_node_id)`, without subtopic scope. To avoid modifying existing learning history, the published fixtures used unique IDs:

- `/tutorial-v2/programming/java/java-basics/whatisjava-c4753c89/uat20261110whatisjava`
- `/tutorial-v2/programming/java/java-basics/whatisjava-c4753c89/uat20261110javasyntax`

The tutorial hierarchy sync generated the subtopic slug with its external-ID suffix; Composer's displayed publication URL used its compact MainDB slug. SUIA redirected the compact slug to the suffixed canonical slug. Both canonical test pages rendered. The exact originally requested hyphenated URLs returned 404 and are not certified as working. Resolve the intended route contract separately; do not invent alias support in acceptance evidence.

No cross-subtopic progress overwrite was deliberately tested. The pre-existing three progress records' IDs, subtopic/section identities, status and creation times were unchanged in final readback. Global progress-key scoping is a source-backed collision risk, not a reproduced overwrite.

## Evidence and cleanup

Screenshots in this directory are from the actual browser run. They include empty-content states, Composer drafts/publications, two branded learner views, code rendering, preserved snapshot content and hydrated ILS counters. Files 08/09 capture earlier hydration stages; files 11/13/14 are the later views. Screenshots are supporting evidence, not substitutes for HTTP, DOM and database assertions.

`baseline.json` records pre-run IDs. `created-records.json` identifies synthetic hierarchy and section records. `cleanup-plan.json` binds exact IDs, database fingerprints, ownership markers/block identity and snapshot versions/hashes. `cleanup-execution.json` records successful bounded deletes. `cleanup-verification.json` records zero remaining owned rows and full baseline preservation. `runtime-db-observations.json` records schema/reference observations before cleanup. Credentials and session tokens are excluded.

UAT browser contexts were closed before cleanup to stop telemetry producers. Cleanup used explicit owned IDs, dependency checks, lock/statement timeouts and separate transactions for MainDB and TutorialDB. It did not use CASCADE, TRUNCATE, DDL or migration execution. Two earlier cleanup dry checks stopped and rolled back before any deletion (a changed content marker and an id-less referencing table); the final guarded plan passed before execution.

Removed only this run's 4 MainDB hierarchy rows; 4 TutorialDB hierarchy rows; 3 sections (including an initial collision-check draft); 3 publication snapshots; 1 sidebar; 4 navigation-progress rows; 4 block-learning-state rows; and 46 telemetry-event rows. Final readback found zero remaining run telemetry.

Baseline and final counts match exactly:
- MainDB: 8 domains, 13 subjects, 11 topics, 8 subtopics.
- TutorialDB: 2 domains, 2 subjects, 3 topics, 3 subtopics, 20 sections, 4 snapshots, 3 sidebars.
All baseline IDs remain. This is ID/count preservation plus selected old-progress field checks, not a full database checksum. Normal login/session audit activity was not erased.

## Next step and scope limits

Task 36's bounded real Composer save/edit/publish journey is verified. Task 37's shared delivery, navigation, branding and draft isolation are verified, but full learner-runtime acceptance is withheld for the progress 500 and unexecuted tenant-only exclusion. Task 39 container qualification was not performed and is not replaced by Neon connectivity.

Next: review the tenant_id schema mismatch and route/identity contract, then authorize only the necessary correction and repeat failed probes. No automatic implementation, migrations, commit, push, deployment or acceptance-ledger update was performed. Existing user modifications and prior screenshots were preserved. The canonical ledger hash remains `7a6d7d43c7f535f24ca56e78781e9f98c747e7e249465121b06f37e2f56bc97e`.
