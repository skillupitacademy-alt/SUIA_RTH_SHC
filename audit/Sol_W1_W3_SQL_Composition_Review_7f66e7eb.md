# Sol SQL composition review of Slice 17

Date: 2026-11-07. Verdict: **CHANGES_REQUESTED**. No W1-W3 closure or W4-entry approval.

## Baseline and evidence attribution

Actual initial HEAD: `00703c21e592e2b95972c34e9db849dd6a039944`, clean, on
`remediation/w1-2-batch-05-targeted`. Reviewed production source:
`7f66e7eb5cf68f68369ea2f94643862b6e73834e`; 00703c21 is the subsequent handoff revision.
The committed Gemini report in this checkout still names source 9e139c49 and TEST_SHA
c5b5ad59. The newer pasted Slice 17 report is a submission, not a newly committed
source-specific independent report here. Record its actual report/test SHA before acceptance.

Sol reproduced the unchanged durable-state runner as **3 files / 9 passed, exit 0**, and
the unchanged lease-adapter runner as **1 file / 7 passed, exit 0**. The pure SQL repository
classes, removal of their direct offline journals, owner predicates, and canonical-envelope
publication option are source improvements. These gains are retained within their scope.

However, the passing durable-state tests mostly call application helpers that use
`globalThis[Symbol.for(...)]` storage. `vi.resetModules()` leaves globalThis intact. This
proves neither a new process nor the real repository/transaction path. This review does
not invalidate the observed passes; it corrects the claimed production coverage.

## S1 remains open: real outbox callers still fall back to global memory (HIGH)

In `apps/realtutorialhub-web/src/app/api/workers/worker-lease.ts`:

- `getWorkerOutboxIntent` and `upsertWorkerOutboxIntent` read/write
  `Symbol.for('quiz.worker.outbox.test.adapter')` unconditionally.
- `upsertTransactionalOutboxIntent` chooses the SQL repository only when capabilities AND
  a DATABASE_URL_TUTORIAL/DATABASE_URL environment string are present; otherwise it returns
  the global-memory helper. Injecting a valid database/transaction must not depend on a
  second connection-string test. Missing persistence must fail closed.
- `dispatchWorkerOutboxIntent` has an optional repository argument and falls back to global
  state when it is absent/incomplete. The certificate and badge routes call it without the
  durable dispatcher repository. Pure SQL repository methods do not protect a caller that
  never invokes them. Recovery reads also use the global-memory lookup.

The new probes show a valid injected SQL executor is ignored, an incomplete transaction
reports a persisted intent, publication proceeds without a durable dispatcher repository,
and losing process-global state loses the apparent intent. The old resetModules probe
passes because its process-global object survives.

Required correction under existing S1/A2/D7:

1. Make persistence an explicit REQUIRED dependency at every actual helper/route boundary.
   Bind `EventOutboxRepository(tx)` for domain-plus-intent writes and the database-bound
   repository for recovery/claim/complete/failure/listing. Remove environment selection and
   every implicit memory/global/filesystem fallback from the production path.
2. Require a transaction with real supported semantics before domain effects. Remove global
   snapshots as a claimed SQL rollback mechanism; use actual tx rollback. In-memory adapters
   belong in explicit test injection, never selected by missing credentials or methods.
3. Pass the durable repository through BOTH initial dispatch and existing-domain recovery
   for certificate and badge; inspect all other worker consumers against the same contract.
4. Persist and read the canonical envelope and immutable event identity from the SQL record.
   Preserve payload conflicts, owner fencing, failed publish retry and durable enumeration.
   Preserve the now-passing atomic Redis lease boundary.

S2 canonical-envelope API behavior is improved, but its production retry guarantee still
depends on this actual persisted read/dispatch chain. Do not use the publisher's global
ledger as durable conflict/replay authority. Runtime cache is optional only when correctness
survives its absence and the stored authoritative envelope is used.

## S3 remains open: SQL invitation claims still require a global record (HIGH)

In `apps/skillup-admin/src/lib/student-invitation.ts`:

- `claimStudentInvitationInDb` uses the SQL repository only when DATABASE_URL_PEOPLE is set,
  otherwise silently invoking the global helper. Production defaults may not select a
  memory authority; injected test repositories must execute their real interface.
- `commitStudentInvitationInTransaction` attempts a SQL update and then ALWAYS calls
  `commitStudentInvitationRedemption`, which requires the process-global invitation record.
  A legitimate invitation claimed from SQL after process restart therefore fails with
  `Student invitation not found for commit`, even if the SQL update succeeds.
- `runInInvitationTransaction` still calls the callback directly if transaction capability
  is missing; a global snapshot cannot roll back account/admission database effects.
- `issueStudentInvitationInDb` first writes global state and conditionally writes SQL.
  SQL success/row validation also depends on environment strings. This is not a pure
  repository-owned issuance contract despite the helper's name/comment.

New probes reproduce SQL claim bypass without connection-string environment, failure to
commit a SQL-only claim, and account effects admitted without a transaction.

Required correction under existing TC08/S3:

1. Route issuance, find/claim, revoke, release and commit through the authoritative repository
   without requiring or synchronizing process-global state. Use repository return rows.
2. `commitStudentInvitationInTransaction` must use `StudentInvitationRepository(tx).redeemAtomic`
   or an equivalent typed transaction-bound port. It must not commit/read an independent
   in-memory record afterward. Keep password/account/admission/invitation changes in the
   same real transaction, with affected-row truth and proper rollback.
3. Require supported transaction capability before effects. Missing repository/transaction
   capability fails closed; move explicit test adapters and rollback simulation into tests.
4. Validate cold-instance claim/commit, cross-instance revocation/replay, expired/replaced
   claims, concurrency, zero-row/error rollback and legitimate activation against the real
   repository predicates with a controlled SQL executor. Physical SQL remains separately gated.

## Independent reproducer

Command: `node audit/Sol_SQL_Authority_Review_7f66e7eb.mjs`.
Guard installed before imports, service bindings stripped, mocked people repository and
controlled transaction capabilities; no physical SQL, Redis, queue or account operations.
Transcript: `audit/Sol_SQL_Authority_Review_7f66e7eb.log`.
Observed: **1 file / 1 passed / 7 failed; exit 1**.

| Case | Result |
| --- | --- |
| Explicit outbox repository dependency invoked | PASS |
| Valid SQL executor used without connection-string environment | FAIL |
| Incomplete outbox transaction capability denied | FAIL |
| Missing durable dispatcher repository prevents publication | FAIL |
| Removing process-global state still allows authoritative outbox read | FAIL |
| Injected people repository used instead of memory claim | FAIL |
| SQL-only invitation claim commits without a global record | FAIL |
| Nontransactional invitation executor denies account effects | FAIL |

The memory-loss check deliberately drops the isolated worker global symbol; it models
process-memory loss, not physical database loss or a real server restart. The SQL-only
claim uses a controlled repository/tx fixture to isolate application composition. These
are source-backed simulation results, not physical production exploit demonstrations.

## Verification correction and full continuation

Gemini must independently instantiate the REAL SQL repository classes with predicate-
discriminating controlled database executors, then exercise actual route/service composition
through that dependency. Tests must assert which tx receives domain and intent/credential
operations, fail the second write, and observe rollback and zero effects after failed
authority. A mocked class returning the expected record alone cannot qualify SQL semantics.
Use shared simulated durable state across two fresh application contexts with separate
globals; remove all previous application globals, rather than only resetting module cache.

Do not alter production from the testing session. Do not make runtime code detect mock
shape, NODE_ENV, missing DATABASE_URL or global test symbols to satisfy old tests. Adapt
positive fixtures explicitly to the supported injected interface while retaining every
required denial and historical intended behavior. Disclose failing/incompatible old
fixtures, skipped/interrupted workspace checks and exact source/test/report revisions.

The [consolidated existing thirty-task checklist](Claude_Sonnet45_W1_W3_Completion_Directive.md#consolidated-remaining-work-checklist-for-w4-readiness)
remains the complete pending scope. This review does not add a new architecture policy,
replace D1-D7, or reduce Argon's work to S1/S3. All TC01-TC20/FND01-FND30 and existing
G1-G9 evidence/acceptance requirements continue. Physical gates, BROWSER-01 and RC-ID-01
retain original definitions and remain open where their mandatory evidence is absent.

**Next:** Argon completes production call-site/repository composition and remaining full
assignment, freezes source IMPLEMENTED_UNVERIFIED; Gemini supplies independent actual-
repository and full-scope evidence at that revision; Sol reviews acceptance/readiness.
Routine within-contract repairs need no repeated approval. No push, main merge, deployment,
physical migration, credential/account change, live database/queue/storage execution or
automatic W4 implementation is authorized here.
