# FND03 export provenance migration draft — review only

Status DRAFT_NOT_EXECUTABLE; baseline 2fabb267. Sol selected verified tenant plus tenant-local subject as learner ownership and denial of unknown historical provenance. This is a proposal, not schema/DB/Redis/storage mutation, backfill or rollout approval.

## Observed scope

`packages/db/src/schema/jobs.ts` background_jobs holds user_id, payload and result but no explicit tenant column. `packages/db/src/schema/exam.ts` stores exam owner and export_urls. `apps/api-server/src/app/api/export/download/route.ts` checks job/exam userId before storage read but has no demonstrated tenant check; both jobId and examId cross-tenant fixture probes remain failed. Trigger, status/recovery, URLs, workflow, `JobsService`, saga/worker, Redis job/cache keys and storage references are linked ownership surfaces. Actual backing-store topology, all readers and worker routes, cross-brand job provenance and historical file ownership are not established by these source observations.

## Proposed migration sequence

1. Inventory deployed jobs/exams, storage keys, cache namespaces, worker producers/readers, identity provenance, unique constraints and current legitimate internal callers. Confirm trusted per-tenant physical routing or select explicit tenant column; do not infer from current requester, email, job ID, filename, storage URL or guessed schema.
2. Expand with explicit tenant/provenance state on persisted job and exam/export metadata under a reviewed migration. New writes bind verified tenant + local subject at creation and propagate immutable ownership through worker, retry, cache and storage references. Unknown historical rows remain quarantined/inaccessible. Keep global job/event identity semantics and do not overwrite foreign provenance on retries.
3. Update all trigger/status/download/URLs/recovery paths and worker/producer contracts in a mixed-version plan: verify tenant and owner before job recovery, Redis, storage existence/read/signing or dispatch; authenticated internal workflows require explicit scoped authority. Deny foreign/equal-local-ID, missing or contradictory provenance and unsupported historical rows before effects.
4. Only backfill with independently verified authoritative record-level evidence and an auditable reconciliation workflow. Tests require both tenant directions, equal local IDs and job/exam IDs, foreign storage references, legitimate owner and explicit internal caller, missing/legacy unknown, cache collision, recovery/partial write/retry and worker provenance. Real DB/Redis/storage/browser checks require separate approval.
5. Contract after all old producers/readers are retired and Sol accepts evidence; enforce selected tenant constraints and indexes without silently merging histories. A coordinated deployment must prevent old unqualified readers from accessing newly written records.

Rollback: retain snapshot and tenant-qualified rows, suspend export access if old code cannot enforce tenant, and do not restore unqualified identity or rewrite file ownership when collisions exist. Roll back only after preflight proves no ambiguous records or newer writes; otherwise use a forward fix. Separate progress migration applies independently.

Open decisions: authoritative physical routing and resource provenance source, full schema/consumer inventory, storage key namespace, legacy quarantine/backfill, internal actor scope and operational recovery. No executable SQL or commands are supplied until these are selected.
