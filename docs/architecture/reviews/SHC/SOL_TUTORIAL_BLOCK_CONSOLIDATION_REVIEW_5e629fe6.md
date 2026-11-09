# Sol — block tutorial consolidation and legacy removal review

Date: 2026-11-09 (Asia/Calcutta). Mode: independent source/evidence review and one guarded offline test selection. **No application changes or database operations.**

## Decision and owner clarification

**Frontend change: consistent with the chosen architecture, within its narrow scope. Proposed snapshot migration: CHANGES REQUIRED; not approved for execution. Whole legacy removal: incomplete.**

The owner confirms this is a development project with no end users and obsolete legacy records. This supersedes assumptions that old tutorial content needs a production compatibility programme or automatic conversion into blocks. Do not build a legacy-to-block migration engine or preserve a parallel learning UI for those records. An explicit later development-data reset can be simpler than archival migration.

However, source inspection shows that the current **block-based** publisher and learner delivery use `tutorial_content_versions` for their frozen snapshots. Those rows cannot be identified as obsolete merely by the table's old name. Preserve current V2 authoring/publication state, identities and test progress unless the owner explicitly chooses to reset those too. No actual student usage is asserted by this report.

Recommended next phase: remove the three genuinely orphaned React renderers only, with targeted regression evidence; then consolidate the still-mounted old learner routes and their callers into canonical block delivery. Resolve publication integrity before any snapshot table replacement. No database migration is required for the first cleanup.

## 1. Verified baseline and review boundaries

- Local branch `main`, HEAD `5e629fe673d7d5139bd59bcc6868fdb7c82abd99`.
- Compared against ancestor `5304d10279b84d60304919ff6b3ed4a4ebeb6cfc`; ancestry check returned 0. Initial tracked working tree was clean.
- Reviewed actual local source corresponding to that commit. No new remote/GitHub or deployed-image verification is claimed.
- Read the local Gemini proposal `audit/SHC_BLOCK_BASED_TUTORIAL_LEGACY_REMOVAL_AND_DATA_SAFETY_AUDIT.md`. It **exists but is untracked and ignored** by `.gitignore:143` (`*_AUDIT*.md`). It is not in the four-file cleanup commit. Treat its execution claims as prior author evidence, not independent proof.
- Governing references: `docs/architecture/reviews/SHC/00_READ_ME_FIRST_SHC_ADMIN.md`; PSEG-001 proposed v1.1; architecture, service acceptance and implementation workflow annexes 02–04. Their ownership, typed-contract, integrity, test-safety and explicit-change-approval requirements apply. The owner’s latest development-only clarification takes precedence over historical production-retention assumptions.
- This is supporting tutorial evidence; the canonical 62-criterion SHC ledger is unchanged. No Scope B implementation, unrelated app audit, parked invitation/outbox work or W4 work was started.

Supporting per-file inventory: [SHC_TUTORIAL_LEGACY_DEPENDENCY_MATRIX_5e629fe6.md](SHC_TUTORIAL_LEGACY_DEPENDENCY_MATRIX_5e629fe6.md): **282 code/SQL files** classified as 65 ACTIVE V2, 59 ACTIVE LEGACY, 12 REQUIRES MIGRATION, 4 UNUSED and 142 UNKNOWN. Many UNKNOWN entries are tests or historical tools, not alleged production consumers. These categories are source evidence limits, not deletion approvals or a new implementation backlog for every file.

## 2. Exact scope of commit 5e629fe6

`git diff 5304d102 5e629fe6 --` shows **four files, 16 insertions and 17 deletions**:

1. `src/share-branding/LearningExperience/components/TutorialPageShell.tsx`: removes three imports, `hasLegacyContent` and the definition/code/summary fallback branch; removes its BOM. Retains `blocks.map → TutorialBlockRenderer` and the “Content is not published…” empty state, navigation, theme and progress-provider structure.
2. `TutorialCodeContent.tsx`, `TutorialDefinitionContent.tsx`, `TutorialSummaryContent.tsx` in that directory: adds a five-line deprecation comment to each. Their implementations remain intact. No database, API, serializer or service was removed.

`tutorialSidebarDelivery.ts:519–526` constructs only `{ blocks, sectionId }` for the current page payload, making removal of that shell's old fallback coherent. A repository-wide source reference search finds no remaining production imports of the three components. They are reasonable next deletion candidates. Historical scratch files/tests are not current learner imports.

The retained shell at lines 354–385 displays empty content without losing sidebar/footer navigation. Invalid/missing data is handled upstream by delivery/schema parsing and by renderer error states; this commit does not prove all error paths in a browser. Published content, bookmarks and progress were not changed by its diff, but their runtime correctness is not inferred from unchanged lines.

## 3. Active block-system map and the 18-family distinction

```text
SHC /tools/tutorial-page-content
  hooks/useTutorialSave.ts → services/tutorialSaveService.ts
    Draft: POST/PATCH /api/tutorial-composer/sections[/id]
    Publish: POST /api/tutorial-composer/sections/id/publish
      existing request/action/resource guards
      TutorialComposerService → TutorialSectionRepository
        tutorial_sections: working TutorialDocument + version
        tutorial_content_versions: current frozen V2 publication snapshots

SUIA/RTH /tutorial-v2/<domain>/<subject>/<topic>/<subtopic>/<navigationNodeId>
  runtime resolver → getPublishedTutorialPagePayload
    published sidebar + canonical navigation identity
    TutorialDeliveryService.getTutorialByPage
      deployed exact-tenant override, otherwise shared canonical
      snapshot resolution → schema validation → content sanitization
    TutorialPageShell → TutorialBlockRenderer
      brand theme, ILS/telemetry/completion/navigation integration
```

Source anchors:

- SHC `.../tools/tutorial-page-content/hooks/useTutorialSave.ts:41–91` saves first, then separately publishes when requested. Draft and Publish remain distinct actions. `services/tutorialSaveService.ts` passes the loaded/current `expectedVersion` when available; it is not unconditional at the service contract.
- `packages/db-tutorial/src/services/tutorial-composer.service.ts:305–322,376–431`: optional draft CAS; publish validates document/non-empty content, then calls the repository.
- `packages/db-tutorial/src/repositories/tutorial-section.repository.ts:393–450,501–610`: draft revision updates; snapshot lookup/publication.
- `packages/db-tutorial/src/services/tutorial-delivery.service.ts:201–298,389–438`: status/brand selection, snapshots, validation and sanitization.
- `src/share-branding/LearningExperience/tutorialSidebarDelivery.ts:434–550`: exact navigation-node resolution, shared payload and canonical URL construction.
- Both `apps/{skillup-web,realtutorialhub-web}/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx`: authenticated brand-specific wrapper and shared shell. SUIA explicitly retains compact-to-canonical slug redirect handling. No HTTP journey was run here.

The owner's 18 educational families are represented in `apps/skillhubcore-admin/src/lib/project-llm/projectLlmBlockCorpus.ts:17–145`: Introduction, Objective, Definition, Code, Visual, Comparison, Execution, Memory, Mistake, BestPractice, Summary, Question, Exercise, Task, Interactive, Quiz, Interview and Project. This catalogue defines the intended family/version architecture; it is not evidence that all implementations are complete.

At this SHA the authoring registry explicitly imports Definition, Code, Summary, Introduction and Objective plus generated registrations. `packages/ui/src/tutorial/TutorialBlockRenderer.tsx:42–59` registers C1/D1/I1/S1/O1/O2; `generatedBlockRenderers.tsx` adds O3 and another O1 entry. Other primitive/layout block rendering is also present. The corpus itself labels many families DOCUMENTED. Preserve the finalized 18-family direction, but do not label all 18/133 documented versions runtime-qualified. Completing families is a separate product implementation task, not a reason to retain the old monolithic page engine.

`shared` remains an internal content-distribution identity. The payload/runtime theme is the requesting tenant's identity. Dynamic future-tenant registration tests qualify only the in-memory registry: the current PostgreSQL `brand` enum still enumerates RTH, SkillUp, SkillHubCore and shared. Delivery also compares the requested tenant directly against that enum. A new tenant identifier therefore has a potential SQL enum-compatibility failure even for shared fallback, not just persisted overrides. This is a source-derived compatibility concern, not a physically reproduced SQL result. Successful JS registration does not prove future-tenant delivery. Establish that contract with an actual SQL test before claiming support; this review does not authorize a tenant schema redesign.

## 4. Dependencies which prevent blanket deletion

The companion matrix supplies per-file paths, reference lines, caller examples and ACTIVE V2 / ACTIVE LEGACY / UNUSED / REQUIRES MIGRATION / UNKNOWN classification. These are source classifications; ACTIVE LEGACY does not mean real students are using it.

| Dependency family | Current source evidence | Consequence |
| --- | --- | --- |
| Three old shell renderers | Only their own declarations remain after the import removal. | Safe narrow deletion candidate; do not expand it to similarly named block components. |
| Old `/api/tutorial/content/[subtopicId]` routes | Mounted in API server, SUIA and RTH source. Web routes forward to the old backend service. Deprecation comments do not disable HTTP routes. | Retire after current source callers are removed/redirected. No unnecessary long production deprecation window is required for this prelaunch project. |
| Legacy content repository | `packages/db-tutorial/src/repositories/tutorial-content.repository.ts`; exported by repository barrel; reads/writes content and version/audit records. | Still has source consumers; not safe to delete in the three-component patch. |
| RTH assignment/remediation | `src/lib/tutorial-content-api.ts → TutorialContentRepository.getPublished`; `tutorial-hierarchy.ts:114+` calls that helper; `(learning)/learn/remediation/page.tsx` and the nested assignment page import those helpers. Assignment page also imports `tutorial-content.ts` seed helper. | Old content records being obsolete does not remove these calls. Move them to canonical block delivery or remove the obsolete feature entry with owner-agreed UX. Do not retain fabricated seed fallback as a second engine. |
| Alternate monolithic notes UI | Both apps still mount `/start-learning/subtopic/[subtopicId]/page.tsx → SubtopicNotesPageWrapper → SubtopicNotesPage → NotesMainContent/LaymanMainContent/...`. RTH `src/server/tutorial-delivery.ts:243–280` supports canonical documents and legacy section validation. | A parallel learner UI still exists outside TutorialPageShell. Replace/redirect entry routes using real canonical page identity before deleting the wrapper, mappings and notes renderers. Do not guess a navigationNodeId. |
| Section APIs / old loader | `src/share-branding/subtopicNotesDataAPI.ts` maps `/api/tutorial/sections/*` payloads into old section types. RTH sections BFF still forwards requests. A tracked API-server sections test exists without the corresponding tracked route.ts at that location. | Treat compatibility/availability as unverified; route naming or a remaining test is not proof of working V2 delivery. Do not simply rename the old content URL to sections and declare migration complete. |
| RTH Admin legacy management | `apps/realtutorialhub-admin/src/app/api/tutorial/content/{route.ts,[id]/route.ts,[id]/publish/route.ts,[id]/restore/route.ts,versions/route.ts,audit/route.ts}` and `src/lib/tutorial-content-api.ts`; dashboard content/tutorial/assignment sources reference old APIs. | These are still mounted legacy writers/readers. Retire tutorial-specific paths as a separately bounded dependency cleanup. Do not consolidate unrelated RTH Admin services. |
| Progress facade | API `/api/tutorial/progress/route.ts → TutorialService → TutorialEngine`; the same engine also uses TutorialContentRepository for content. | Decouple content removal from progress. Never delete the whole engine/module merely because one method reads old content. |
| Vector generation / AI retrieval | RTH worker `api/workers/index-content-vector/route.ts:83–98` loads TutorialContentRepository; old RTH Admin publish emits the content publication event. AI query uses the vector index. | Reindex only validated published V2 snapshots with tenant/source/version provenance, or explicitly retire the obsolete producer. Preserve retrieval authorization. Dropping old SQL content does not remove stale vectors. No external indexing run is authorized here. |
| Sanitization / shared old-named types | V2 delivery imports `tutorial-content-sanitization.service.ts`. `TutorialSummaryPayload` is still used in canonical block types; historical Code payload schema is referenced by current block validation. | **Retain** required sanitizers/schema/type compatibility. Remove only proven unused exports/adapters after reference tests; do not delete by filename or “legacy” comment. |
| Experimental page table | `schema/tutorial-page-content-v2.ts` exported through schema index, plus old tooling/migrations. No current application ORM reader/writer was found in the inspected source scan. | Candidate for later removal; database counts/consumers unverified. A schema export is not an active page engine, and no live “2 rows” assertion is accepted. |
| Jobs, imports, transformations and old scripts | Companion inventory includes tracked script references and historical SQL definitions. | UNKNOWN tooling remains excluded from execution. Reconcile scheduled/invoked scripts and retire obsolete runbooks before final removal; do not execute them to discover what they do. |

The inventory is bounded to tracked code/SQL, explicit identifiers, canonical paths and old-helper import callers. It does not establish external HTTP traffic, scheduled-job activation, deployed caches or PostgreSQL dependencies. UNKNOWN is the honest result where those facts are unavailable; there is no claim of exhaustive live-system retirement.

## 5. Publication correctness findings to fix before schema replacement

| ID | Evidence | Risk and bounded correction |
| --- | --- | --- |
| T1 — nontransactional publication fallback | `tutorial-section.repository.ts:606–610` invokes the transaction body directly if `.transaction` is missing. | Snapshot insertion can survive a failed version/status update on such an executor. Require genuine transaction capability and reject unsupported executors before writes. Existing normal PostgreSQL transaction use does not justify this fallback. This is a source-confirmed unsafe branch, not a physically reproduced DB failure. |
| T2 — no enforced snapshot identity uniqueness | `schema/tutorial-content-versions.ts` and migration 0007 have only an index on content_id; publication at 561–579 uses SELECT-then-INSERT. | Two publishers can both observe no snapshot and insert the same section/version. A version CAS does not exclude another publish of the same unchanged version. Enforce uniqueness and deterministic equivalent-replay/conflict behavior, with a real two-connection test. |
| T3 — validated revision not bound to publication request | Composer validates one document at 389–412; repository reloads current section inside a later transaction and receives only userId at 420–422. | A draft save between validation and repository SELECT can cause a different revision to be published from the one validated/intended by the action. Bind expected working revision/document to the publication transaction and validate that exact locked/CAS row. Test both race orders. |
| T4 — published identity is inferred from latest version | Snapshot lookup 501–519 selects highest version/time, not an explicit successful-publication pointer. Delivery 276–294/412–421 falls back to working content for version 1 when no snapshot exists. | Avoid making historical/failed/imported snapshots learner-active merely because they have the highest version. Final block-only architecture should have an explicit committed publication identity and no working-draft fallback. Missing snapshot should fail closed with an observable content-unavailable result. Version-1 compatibility is visible source behavior, not the final owner contract. |
| T5 — service-level concurrency remains optional | Composer chooses versioned update only when `expectedVersion` is supplied. | The current SHC caller normally supplies it when known, but other callers can omit it. Any promise of protected concurrent authoring must require the revision contract for the relevant writes, with compatibility tests rather than broad unrelated refactoring. |

No production correction was made. T1–T5 are bounded code/design work for a later authorized implementation. The three orphan files can be removed without solving them or pretending that file deletion solves them.

## 6. Corrected snapshot design — design only, no migration file

The Gemini proposal is **not executable as approved architecture**. Problems in its actual text:

1. `ON DELETE CASCADE` destroys history if a section is hard-deleted; existing upstream subtopic → section cascades make the indirect deletion path important too.
2. `0026_create_...` conflicts with the existing 0026 lineage; current journal already reaches registered 0030. Select the next verified free migration identifier and proper snapshot/journal state only after rebasing. Do not change applied migrations.
3. Backfill `JOIN tutorial_sections` does not validate TutorialDocument, publication provenance, duplicate/conflicting section/version rows or orphans. `ON CONFLICT DO NOTHING` can hide disagreement; it is not reconciliation.
4. Reading the new table “if any rows exist” can serve an older migrated snapshot while a newer successful publish exists only in the old store. Rollout needs authoritative publication identity/completeness, not table non-emptiness.
5. Dropping the new table after new-only writes loses publication history. “Zero risk” and “exact rollback without data loss” are unsupported.
6. Duplicate lookup and unique indexes need not both be created on the same leading section/version columns. `CREATE TABLE IF NOT EXISTS` can conceal an incompatible existing definition; verify its exact shape rather than accepting its name.
7. A UUID publisher column is not evidence of authorization or referential validity across databases. Preserve verified actor provenance; do not invent a cross-database FK.

Recommended logical model if the owner elects to separate snapshots:

```text
tutorial_section_published_snapshots
  id                 UUID PK
  section_id         UUID NOT NULL FK tutorial_sections(id) ON DELETE RESTRICT
  version            INTEGER NOT NULL CHECK version > 0
  document           JSONB NOT NULL
  schema_version     explicit supported document schema version (or verified JSON field)
  published_by       verified actor UUID/provenance under existing identity authority
  published_at       TIMESTAMPTZ NOT NULL
  UNIQUE(section_id, version)
  CHECK document is object with blocks array and supported schemaVersion

tutorial_sections
  working content/version remain separate from learner-active publication identity
  published_version (nullable before first Publish)
  composite FK (id, published_version) → snapshots(section_id, version)
    with migration/deferrability ordering chosen and tested
```

Full nested document validation remains at the authoritative service boundary; a JSONB shape CHECK is not sufficient. Snapshot rows should be immutable through the application write contract; no general UPDATE endpoint. Retain section soft-delete/archive behavior, and require an explicit retention/purge decision before hard deletion. RESTRICT intentionally prevents accidental history destruction; test its impact on parent deletion rather than concealing the dependency.

Publication transaction: lock/select the intended section revision (or enforce an equivalent tested CAS), verify actor/action/brand and expected version, validate that exact TutorialDocument, insert immutable snapshot, verify an existing same-version replay has identical content, then update the learner-active publication pointer and metadata. Failure rolls back every write. A draft save changes only the working document/revision, preserving the previous published pointer and learner availability. This single committed identity also prevents delivery from selecting arbitrary historical highest-version rows.

No additional deployed service, queue, per-tenant copy of shared content or separate learning engine is needed. Shared publication plus tenant-aware lookup/theme remains the one architecture. Keeping the old-named snapshot storage briefly is not a second rendering engine.

## 7. Database facts, development data and removal plan

**No live PostgreSQL connection was opened.** No confirmed isolated target/recovery evidence was established for this review, so current counts, deployed snapshot completeness, duplicate versions, FKs/views/functions/triggers and deployed-object dependencies are **NOT VERIFIED**. Local schema/migrations establish intended definitions only. Gemini's “2 historical rows” and any prior production counts are not carried forward as current facts.

Before an owner-approved schema operation, collect only redacted aggregate/catalog evidence in an explicit read-only transaction: database/branch fingerprint; relevant relation existence; section counts by status; deployed sections without valid matching snapshots; duplicate `(content_id, version)` groups and conflicting documents; snapshots whose IDs do/do not map to sections; content/page-table counts; `pg_constraint`/`pg_depend` dependencies including inbound references, views, functions and triggers; migration ledger. Validate JSON documents through the actual schema without printing tutorial payloads or account data. Do not infer that counts alone prove semantic equivalence.

Development-only data treatment:

| Object | Recommended disposition now | Later owner-approved action |
| --- | --- | --- |
| `tutorial_sections`, `tutorial_sidebar_trees_v2` and hierarchy | Retain canonical working documents, navigation and identities. | Repair only demonstrated integrity defects; do not regenerate IDs during renderer cleanup. |
| `tutorial_content_versions` | Retain because V2 currently reads/writes it, even if old monolithic records in it are disposable. | Separate validated V2 snapshots or reset explicitly identified development state. Verify counts/content/pointers before retirement. |
| `tutorial_content` | Obsolete owner-declared data, but still has executable consumers. | Retire consumers first, then authorize a bounded DROP/reset. No automatic conversion or indefinite archive obligation is imposed. |
| `tutorial_page_content_v2` | Experimental obsolete candidate; actual database use unverified. | Remove source references and check live dependencies, then request the specific destructive change. |
| `tutorial_content_audit` and old content-related jobs/indexes/vectors | Legacy writer/reader dependencies remain. | Include in retirement checklist; verify no V2 provenance is being discarded. No blanket cascade deletion. |
| `tutorial_progress`, `tutorial_navigation_progress`, `block_learning_state`, `block_telemetry_events` and assessment/assignment records | Retain while evaluating references. Navigation/section/block/version identities exist even without SQL FKs. | No reset authorized here. If synthetic test state is intentionally disposable, document a separate bounded reset; never assume tutorial content deletion covers it. |

No real student accounts/history are asserted. Preserving these identities avoids breaking current development testing and the future progress contract; it is not a reason to maintain obsolete tutorial content.

## 8. Preservation, rollout and rollback

For a later approved snapshot migration, prefer the simplest bounded development rollout: stop tutorial writes briefly, take an identified recoverable development backup, validate/copy only genuine V2 publications, verify exact document equivalence and publication pointers, switch the one repository/delivery path, run the agreed tests, then resume writes. Keep both schema objects temporarily for rollback, not two independently writable tutorial systems. This is simpler than speculative live dual-writing when there are no users.

If continuous writes are required instead, owner approval must cover one atomic dual-write authority, cutover watermark/completeness checks and exact rollback compatibility. Every post-cutover publication must remain readable by the rollback version before reverting. Separate databases cannot be assumed transactionally atomic. Neither mode permits silent conflicts or indefinite dual-read precedence.

Rollback by phase:

- Component-only cleanup: revert the cleanup commit; no data restore.
- Route/caller cleanup: revert the coherent route+caller patch, retaining canonical data and stable IDs. Use explicit canonical redirects/unavailable behavior rather than fabricating legacy content. No obligation to support obsolete deployed clients was established.
- New snapshot schema before writes: leave the unused table in place on code rollback; even here DROP is a separate decision.
- After backfill/new writes: preserve both tables, stop writes if necessary, reconcile every successful publication into the rollback-readable store, validate it, then revert code. Restore from the identified backup only under its tested recovery plan. **Never use DROP as routine rollback.**
- Old-table destruction: requires its own named approval, backup/export and restore test; source rollback alone cannot recreate data.

## 9. Actual test evidence and gaps

I independently reran the existing publication test file with config loading disabled, sensitive provider/database environment keys removed and the existing offline network guard installed before test imports. This avoids its normal package Vitest config, which reads root `.env.local` and can select live databases even in test mode.

Result at the inspected source: **Vitest 4.1.0 — 1 file passed, 20 tests passed, exit 0; tests 16ms, total 4.59s.** This is safe offline unit evidence only. Its transaction callback is a `vi.fn(cb => cb(fakeTx))`, not PostgreSQL rollback. Several assertions do not call delivery at all:

- Lines 364–372 call `mockDeliveryRepo.getLatestPublishedVersion` directly.
- Lines 400–435 use a local `isLearnerAccessible` clone; the prepared fakeDb is not used to run real delivery.
- Lines 440–471 duplicate missing-snapshot resolution in local helpers.
- Lines 476–519 sort/compare in-memory candidates, not generated SQL.
- Logging safety assertion constructs its own sanitized object rather than exercising the database logger.

Therefore 20/20 does not prove physical concurrency, end-to-end draft isolation, SQL tenant precedence or logging safety of the actual runtime. It is useful partial regression evidence and must not be represented as full publication qualification.

Reproducible guarded command (PowerShell, repository root):

```powershell
@'
import path from 'node:path';
import { startVitest } from 'vitest/node';
for (const key of Object.keys(process.env))
  if (/DATABASE|DIRECT_URL|REDIS|UPSTASH|NEON|QSTASH|TOKEN|SECRET/.test(key)) delete process.env[key];
process.env.NODE_ENV = 'test';
const ctx = await startVitest('test',
 ['packages/db-tutorial/src/services/__tests__/tutorial-publication-lifecycle.test.ts'], {
 config: false, watch: false, maxWorkers: 1, fileParallelism: false,
 environment: 'node', reporters: ['dot'],
 setupFiles: [path.resolve('audit/W1_W3_Offline_Test_Network_Guard.ts')],
 exclude: ['**/node_modules/**', '**/.worktrees/**'],
});
if (!ctx) throw new Error('Verification did not start');
const files = ctx.state.getFiles();
const failed = files.length !== 1 || files.some(f => f.result?.state !== 'pass');
await ctx.close(); process.exitCode = failed ? 1 : 0;
'@ | node --input-type=module
```

| Required evidence | Current review status | Necessary next test |
| --- | --- | --- |
| PostgreSQL transaction rollback | NOT VERIFIED | Real repository, isolated DB, snapshot insert then forced status/pointer failure; final rows unchanged. |
| Draft isolation and republish | PARTIAL unit evidence; DB/HTTP NOT VERIFIED | Actual composed Save Draft → learner reads old published version → Publish exact revision → both brands read new version. |
| Concurrent publish and snapshot uniqueness | NOT VERIFIED | Two independent connections/barriers, same revision and publish-versus-save in both orders; no duplicate or unintended revision. |
| Shared delivery, exact tenant override, cross-brand denial | Source predicates inspected; actual SQL/HTTP NOT VERIFIED | Exercise actual delivery SQL with shared and tenant fixtures, inactive/missing publication and conflicting other tenant. |
| Snapshot validation / missing snapshot | PARTIAL source/unit; physical NOT VERIFIED | Actual service schema failure and missing/corrupt snapshot response; no draft fallback or unintended unavailable override suppression. |
| Tenant rendering / 18-family coverage | NOT VERIFIED end to end | Genuine mounted renderer/theme tests for implemented family versions; catalogue entries alone do not PASS. |
| SUIA and RTH browser journeys | NOT RUN | Authenticated canonical navigation, empty/unpublished state, block render errors, draft then republish, tenant-aware theme. |
| Telemetry, progress and assessments | Source wiring exists; NOT VERIFIED | Actual completion and reload with stable navigation/section/block/version IDs; no accidental reset or lost attribution. |
| Existing deep links and old entry retirement | Source redirect/entry inventory only; NOT VERIFIED | Canonical URL, old compact slug, obsolete notes route and assignment/remediation link outcomes; no invented page-node mapping. |
| Types, build, security and broader suites | Prior claims NOT independently rerun here | Run applicable proven-offline selections for the authorized patch; disclose any existing fixture failures separately. |

No broad test/build, browser login, external provider, SQL, migration or destructive script was run. No current whole-workspace PASS is claimed.

## 10. Safe phase and exact Gemini Flash handoff

**Implementation proposal only — owner authorization still required.** Do not interpret this source review as permission for a table migration or broad rewrite.

> Baseline `5e629fe673d7d5139bd59bcc6868fdb7c82abd99`. Read this report and dependency matrix. Confirm current HEAD/ancestry/status and preserve unrelated work. For the next owner-authorized patch, delete only these three unused components:
>
> - `src/share-branding/LearningExperience/components/TutorialDefinitionContent.tsx`
> - `src/share-branding/LearningExperience/components/TutorialCodeContent.tsx`
> - `src/share-branding/LearningExperience/components/TutorialSummaryContent.tsx`
>
> Verify no remaining imports/barrel exports and no dynamic registrations. Keep canonical block components, sanitization, shared payload/schema compatibility, shell navigation and progress unchanged. Add/run a real rendered-shell regression for a valid block document and empty content, using isolated runtime/provider adapters; preserve current errors visibly. Run affected types and offline tests with actual outcomes. Include a precise three-file deletion manifest, test changes and rollback by revert. Do not delete APIs, repositories, tables, old notes routes, progress or scripts in that patch. Return for review; do not auto-push/deploy/migrate.

Subsequent proposed batches, independently approved:

1. Retire/redirect old mounted learner routes and update assignment/remediation/sitemap callers to canonical block identity. Keep authentication and progress semantics; do not clone the old rendering engine inside an adapter.
2. Retire legacy content-management APIs/producer/indexing dependencies after their actual callers are gone or replaced. Reconcile UNKNOWN tool invocations. Existing deployment is development-only; do not invent a historical public-client support requirement.
3. Correct T1–T5 with executable repository tests; finalize the dedicated snapshot design only if needed to retire old storage. A corrected existing snapshot repository can remain temporarily while code cleanup proceeds.
4. Seek a specific owner decision on migrate-valid-V2 versus bounded development-data reset. Apply no DDL without that decision and the exact target/recovery/executor plan.
5. After validated cutover, separately approve obsolete table/type/API removal. Final acceptance requires one authoring/publication/delivery system and no reachable parallel legacy learner UI—not merely deletion comments or a new table name.

## 11. Artifact status

This report and its dependency matrix are deliberately in the non-ignored review directory so they can be reviewed and committed by the owner. They are **new local uncommitted files, not yet Git-tracked**. The existing ignored Gemini audit was read but not edited or force-added. No Git staging, commit, push, ledger edit, migration or deployment was performed. The requirement for a tracked final packet must be completed in a later owner-authorized commit; this report does not pretend that has happened.
