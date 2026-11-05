# FND03 private progress tenant migration draft — review only

Status DRAFT_NOT_EXECUTABLE; baseline ecd639eb. The Sol checkpoint selects `(verified tenant, tenant-local subject)` as learner ownership and denies unknown historical provenance. This document is a design artifact, not a migration, schema edit, rollout approval, or backfill. Physical topology and legacy row provenance remain unknown.

## Observed schema and direct owner scope

- `packages/db-tutorial/src/schema/tutorial-progress.ts`: `user_id`, `subtopic_id`, active uniqueness `uqTutorialProgressUserSubtopic`; legacy repository `tutorial-progress.repository.ts` reads/writes by unqualified user/subtopic.
- `subtopic-flow-progress.ts`: `user_id`, `subtopic_id`, unique `uqSubtopicFlowProgressUserSubtopic`; `assignment-progress.ts`: `user_id`, `subtopic_id`, difficulty unique. These are separate legacy/assignment lanes, not automatically canonical completion.
- `tutorial-navigation-progress.ts`: `user_id`, navigation node, active unique `uqNavigationProgressUserNode`; `block-learning-state.ts`: `user_id`, node, block ID/version, active unique `uqBlockLearningStateIdentity`.
- `block-telemetry-events.ts`: global unique client `event_id`, with user/node/block identity and immutable event data. Preserve global event-ID conflict and historical exact-retry behavior; adding tenant must not allow a reused ID to produce a second event.
- `user-interactions.ts` contains quiz/practice/code/visual/section records indexed by user. Other tutorial tables, joins and writers require exhaustive enumeration before rollout; this list is a scoped starting manifest, not completeness.

## Proposed expand, qualify, contract sequence

1. Inventory deployed schemas, real connection routing, all readers/writers, unique indexes, row counts and provenance under separate authorization. Determine whether tenant-specific physical stores already provide trusted isolation; do not infer from environment names or user IDs.
2. For a shared store, propose nullable explicit tenant columns and tenant-qualified new indexes alongside existing constraints, plus a quarantine/unknown state. New writes use a server-verified tenant and local subject; no client brand/header or email backfill. Old readers cannot be allowed to bypass tenant filtering. Do not drop existing constraints or write inferred tenant during expand.
3. Supply compatible repository/service/API changes and mixed-version deployment plan as separate reviewed diffs. Predicate every private read/write, delete, update, retry and aggregation by tenant + local subject; verified internal caller scope must be explicit. Ensure unique-key upserts, transactions, soft-delete and cross-page analytics include tenant. Content ownership remains independently governed.
4. Backfill only rows with independently verified authoritative provenance under an approved per-record mapping and audit; ambiguous/unknown remains inaccessible. Prove two tenants with equal local IDs cannot collide or see one another, legitimate existing owners retain access, unknown rows deny, retry/replay remains idempotent, and transaction rollback/concurrency and old/new deployment behavior are safe. Physical DB, browser and queue tests need separate authorization.
5. Contract only after all consumers and old versions are retired and evidence is accepted; enforce non-null tenant where policy permits and replace obsolete indexes. Keep quarantine accessible only to explicitly authorized remediation operators.

Rollback: stop new writes and preserve a snapshot plus tenant-qualified data; do not revert to unqualified uniqueness or merge rows when local IDs collide. Restore the prior application/schema only if preflight proves no cross-tenant collisions and no newer writes would be misattributed; otherwise retain isolation and use a forward fix. Export jobs/exams/files need their own provenance and producer/reader migration, not this progress draft.

Open decisions: approved tenant representation and physical store routing, complete table/consumer inventory, provenance source and quarantine workflow, mixed-version rollout, operational recovery and rollback thresholds. No SQL supplied or executed because these inputs determine executable constraints and deployment order.
