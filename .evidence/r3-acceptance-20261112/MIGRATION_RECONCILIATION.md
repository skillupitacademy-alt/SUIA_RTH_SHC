# R3 migration provenance and execution hold

Reviewed baseline: `f78bd048e2192e0f744ffe3fca6218aa1d9aedd2`. Fresh read-only metadata is in `migration-readonly-results.json`; byte-for-byte historical checks are in `historical-blob-verification.json`. No migration, migration-ledger change or schema repair was executed during R3.

## Exact fingerprints

- **VERIFIED:** historical Git blob `b4ae3054bbf788d3ad5714125b4afce6c2f77c96`, also addressed by `d03b4054:packages/db-tutorial/migrations/0026_complex_mandarin.sql`, is 7,292 bytes and hashes to `40461fe659d864bbd51e9704daa75157c81aa3b28de097ef3b8c6ea5e0c36783`.
- **OPEN:** `833cf27c73ba6de093f2e73e2ba0ac7dd77fe908bb190e91ea8cfd23aa4a3578`. The named `fe21b286` revision of `0018_amused_rockslide.sql` is 11,280 bytes and hashes to `53c8b7b07b9a1a0feba1cf193e05675fe12a22043836b139bb303e8d1e5f2bd5`. It is not a matching historical artifact. No owner-approved exception exists in this review.
- The prior R2 forensic scan recorded 79 SQL/journal objects and found only the `0026` historical match. A new full local Git-history traversal exceeded the bounded 30-second budget; it is explicitly recorded as unavailable, not a successful exhaustive search. R3 independently verified the specific historical blobs without normalizing their bytes.

Fresh ledger: 22 rows; 20 match current SQL using raw/LF fingerprints. Adding the verified historical `0026` resolves 21 source identities. This does **not** reconcile all journal timestamps or certify the entire schema. The nine journal discrepancies below remain separate from the single unidentified hash.

## Nine journal discrepancies

These tags are at or below the latest recorded migration timestamp but have no matching current SQL hash in the ledger. Present schema effects establish current state, not proof that a specific historical SQL file executed.

| Journal tag | Fresh source/catalog observation | Safe disposition |
| --- | --- | --- |
| `0012_futuristic_pepper_potts` | Large section-era schema; its enum types exist, while `tutorial_section_*` detail tables are absent. | Partial/superseded effects; do not replay the old schema wholesale. Resolve in an approved schema baseline. |
| `0013_colorful_wong` | `brand` enum contains `skillhubcore`. | Intended enum effect exists; historical execution identity remains unproved. No duplicate enum migration. |
| `0014_add_ai_tutor_section_type` | `section_type` contains `ai_tutor`. | Effect exists; no replay needed merely to repair ledger accounting. |
| `0015_backfill_summary_interview_ai_tutor_sections` | Current 20 sections have null educational/UI architecture IDs; the SQL also creates/backfills section-era content. | Backfill completion is **not verified**. Do not populate obsolete architecture fields or recreate section-era content without an approved present-day requirement. Canonical block delivery was excluded from this campaign. |
| `0016_add_overview_section_type` | `section_type` contains `overview`. | Effect exists; no blind replay. |
| `0017_tutorial_delivery_indexes` | Its two `idx_sections_delivery*` indexes are absent; current `idx_tutorial_v2_*` delivery indexes exist. | Compare current query plans before proposing an index change. Do not equate different index names with identical coverage. No performance qualification claimed. |
| `0018_amused_rockslide` | Section-era detail tables are absent; referenced fingerprint does not match the proposed historical file. | Provenance OPEN; do not recreate retired tables or claim the missing hash resolved. |
| `0020_add_tutorial_page_content_v2` | `tutorial_page_content_v2` is absent. | Preserve retirement; do not recreate it to make old migration history appear complete. This review did not drop it. |
| `0026_complex_mandarin` | Exact historical SQL hash verified; six current `project_ai_*` tables exist. | Historical source identity resolved; retain immutable historical evidence. Current-file/timestamp discrepancy still belongs in the approved baseline record. |

The current runner would additionally select `0030_event_outbox` by timestamp. It is not approved or executed here. Its compatibility and existing outbox state need review before any run.

## Safe runner sequence — proposal, not execution authorization

1. Keep ordinary `db:migrate`/raw migration execution on hold for this database. Retain the immutable database ledger export, current journal and exact historical SQL hashes. The installed Drizzle PostgreSQL migrator selects later timestamps; that selection does not independently establish provenance or repair skipped historical effects.
2. Resolve the unidentified hash from an immutable SQL/archive/deployment artifact, **or obtain an explicit owner decision accepting a documented provenance exception**. Never insert a guessed historical row, replace a recorded hash or edit timestamps to force a match.
3. Review a schema baseline against current canonical owners. Explicitly distinguish intentionally retired tables, existing enum effects, superseded indexes, missing required current objects and optional legacy backfills. Review the separately approved manual `tutorial_progress` receipt without pretending it was journal-executed.
4. Before approved DDL, obtain a restorable remote backup/branch and verify restore availability. Prepare a forward-only, narrowly scoped migration for genuine current gaps, with locked preconditions and a rollback/data-retention design. Do not replay the nine old files wholesale.
5. Rehearse that exact sequence against an owner-approved isolated remote Neon branch. No localhost PostgreSQL is proposed. Preserve old and new publication/progress data; verify application compatibility before switching the shared target.
6. Obtain separate owner authorization for the exact target, SQL hash and maintenance/rollback plan. Run only that approved sequence; record exit codes, before/after catalogs and data checks. Keep the canonical acceptance ledger unchanged until independent acceptance and owner signoff.

**Disposition:** historical `0026` identification complete; overall migration provenance/release readiness remains OPEN. There is no approved exception for `833cf27c…` and no authority in this report to change database history.
