# Gemini independent foundation testing packet

## Current Slice 20 result: actual repository and caller checks (2026-11-07)

[Sol's independent results](Sol_Slice20_Repository_Findings_e70868e3.md): 37 pass / 3 fail
in 40 actual-repository/caller tests with generated SQL evidence. Q1: zero-row expiry
returns a fabricated expired record after concurrent redemption. Q2: the actual application
commit helper omits both expiry predicates present in redeemAtomic; expired claim and
expired invitation succeed. Argon repairs production under standing authority; Gemini
independently retests both actual repository and caller paths. Prior 8/6/7 controls remain
green. Six physical PostgreSQL cases are NOT_EXECUTED, not passed. Full scope unchanged.

## APPROVED: Slice 20 independent SQL repository verification (2026-11-07)

Sol authorizes Gemini to implement and execute the offline testing/evidence assignment
below under the existing standing completion authorization. This is NOT production-code
acceptance and NOT authorization for physical database/queue/browser/storage operations.
The owner's detailed Slice 20 assignment is approved with these boundaries. Argon remains
the production owner; the historical Tera role is not reactivated. Sonnet documentation
support is optional, disjoint and not a prerequisite to testing or Sol review.

### Pinned revisions and authority

- SOURCE_SHA: `e70868e3886f178fb4d2cfc47514a83edd925f1d`.
- INVENTORY_SHA: `5a700d4f61eb6b8574cd226d616d98415d403452`.
- At authorization, actual HEAD is INVENTORY_SHA on
  `remediation/w1-2-batch-05-targeted`, clean; SOURCE_SHA is an ancestor and the intervening
  diff changes only `audit/Argon_W1_W3_Critical_Handoff.md`. Rediscover actual state at execution.
- Slice 19 remains accepted ONLY within [Sol's scoped boundary](Sol_Slice19_Scoped_Acceptance_f6627115.md).
  Slice 20 is IMPLEMENTED_UNVERIFIED. W1-W3 remains PARTIAL_ACCEPTANCE; no W4 GO.
- Actual production targets: `packages/db-people/src/repositories/student-invitation.repository.ts`
  and `packages/db-tutorial/src/repositories/event-outbox.repository.ts`, plus retained
  actual caller composition for regression evidence. Do not edit production.

### A. Actual StudentInvitationRepository tests

Instantiate the real repository with a controlled, predicate-discriminating SQL executor.
Validate actual generated UPDATE SQL and bound parameters, affected rows and RETURNING;
do not mock the repository class itself or return success regardless of the predicate.

Cover every item: expiry before/equal/after now; permitted pending/claiming expiry;
redeemed/revoked/terminal rows preserved; invalid claim TTL (zero, negative, NaN, both
infinities) rejected; valid TTL calculation; competing claims with a single winner;
expiration-versus-redemption in both orders; wrong owner; expired owner lease; expired
invitation despite a valid owner; valid unexpired owner success. Exercise zero matched
rows. Check ID/status/owner predicates plus expiresAt <= now for expiry and BOTH
claimExpiresAt > now and expiresAt > now for redemption at the mutation boundary.

Specifically reproduce a stale SELECT followed by another actor's completed redemption
before the expiry UPDATE. Check both preserved terminal storage AND the returned outcome.
A possible expired response after a zero-row conditional expiry is a hypothesis to test,
not a confirmed defect or permission to alter expectations to match the implementation.

### B. Actual EventOutboxRepository tests

Cover new durable identity; first envelope installation only when NULL; immutable installed
envelope; exact replay and JSON property-order equivalence; competing different/identical
installations; missing/wrong/correct publication owner; equal/different supplied envelope;
no-envelope completion under existing semantics without envelope mutation; already-published
matching/conflicting replay; final stored envelope; transaction rollback without partial
status/envelope writes. Assert actual UPDATE predicates: row/event identity, envelope
IS NULL on first installation, publishing status, owner equality and JSONB equality when
an envelope is supplied; inspect zero-row RETURNING and the subsequent conflict/replay path.
Distinguish outbox row primary key `id` from immutable `eventId`; illustrative SQL naming
must not conflate them. JavaScript freezing is not storage-atomic immutability evidence.

### C. Physical PostgreSQL qualification: separately gated

Prepare independent-connection/barrier tests for dual invitation claims, redemption/expiry,
expiry/terminal state, dual envelope installation, publication/owner loss and abort/rollback.
Record initial state, A/B operations, final committed state, expected/observed invariant
and SQLSTATE where applicable. A safe database being available does NOT itself authorize
connecting, creating schema, applying migrations or mutating it. Execute only if a specific
existing authorization covers the exact disposable environment and operations, or after
the owner grants that gate for a concrete prepared recipe. Never use live environment files
to discover a convenient target. Without authorization/environment, mark EACH physical case
NOT_EXECUTED with its prerequisite and continue all independent offline work. Controlled SQL
executors and generated-SQL checks supplement, not replace, required physical evidence.

### D. Retained regression and quality gates

Run the existing guarded SQL-authority, Gemini generalized-invariant and lease-adapter
runners unchanged in negative intent. Retain missing/partial repository/transaction denial,
unconfirmed RETURNING denial, account activation commit safety, missing queue credentials,
worker release on failure and certificate/badge positives. Run new repository tests, both
affected package typechecks, applicable lint/package tests, workspace typecheck and whitespace
check. Disclose broader red/interrupted/skipped/collection outcomes separately from scoped
passes. Never call all tests or the workspace green from a selected passing subset.

Install the offline network/socket/DNS guard before app imports and strip service bindings.
Physical execution, if later authorized, needs a separate narrowly constrained runner and
target allowlist; do not disable the guard for the general offline campaign.

### E. Full-scope evidence and output

The full original GM01-GM20/FND01-FND30/G1-G9 checklist remains active. Preserve canonical
TC/FND mappings, RC-ID-01 and BROWSER-01. Audit the inventory assertions (109 substantiated
caller rows, 72 additional unsubstantiated callers, 91 unsubstantiated distinct finding IDs)
against enumerated rows; do not treat the claimed totals as new facts or invent rows to
match them. Keep each unresolved/unverifiable requirement OPEN with evidence needed.

Update the REPOSITORY `audit/Gemini_W1_W3_Independent_Verification_Report.md`, not only
an external host artifact. Record actual SOURCE/INVENTORY/TEST/REPORT SHAs and tested HEAD,
exact commands/configuration, per-file counts, SQL evidence and PASS/FAIL/BLOCKED/
NOT_EXECUTED by requirement. If REPORT_SHA would self-reference, record its final actual
value in the handoff after commit; do not fabricate a hash inside its own commit.

Commit only Gemini-owned tests/audit evidence locally with explicit paths. No push or
production edits. Return source defects to Argon with location, minimal reproducer,
positive/negative invariant, actual effects, source/test SHAs, failing command/exit and
bounded correction. Gemini retests Argon's next frozen source and integrated regressions.
Sol alone decides acceptance/closure/W4 readiness. Approval does not launch an external
Gemini session; the owner selects Gemini Flash and hands off this repository packet.

## Slice 19 source boundary accepted; complete whole-scope evidence

[Sol scoped acceptance](Sol_Slice19_Scoped_Acceptance_f6627115.md) records 8/8 SQL caller,
6/6 generalized, 7/7 lease and selected 11/11 route controls passing. Retain these. Next
verify actual SQL repository predicates/rollback/claims using controlled executors and
complete all original GM/FND/group coverage and applicable authorized physical gates.
No production edits or blanket group verification from these selected controls.

## Latest Slice 17 verification correction

Read [Sol SQL composition review](Sol_W1_W3_SQL_Composition_Review_7f66e7eb.md).
Old 9/9 durable tests survive resetModules via globalThis; they do not qualify SQL paths.
New SQL-authority probes give 1 pass / 7 failures. Verify real repository predicates and
actual caller wiring with shared controlled durable state across separate application
globals; reject missing tx/repository support. Publish source-specific TEST/report SHAs.
No production edits; preserve full original GM/FND/group scope and all legitimate controls.

## Latest durability review at 5abcd87a

[Sol durability review](Sol_W1_W3_Durability_Review_5abcd87a.md) records 7/7 retained
adapter passes but 2 passes / 7 new durability/publication/commit failures. Test runtime
shared persistence and fresh application instances, dispatcher ownership, immutable whole
envelope replay, invitation rollback and zero affected rows. Existing same-process route
recovery controls are useful but do not establish crash durability. Keep full GM01-GM20
and original FND/group scope; no production edits. Sol retains acceptance.

## Latest required correction at 27243c6e

Read [Sol adapter review](Sol_W1_W3_Adapter_Review_27243c6e.md). Four retained lease tests
pass but do not prove worker integration; new generic/worker adapter tests have 6 failures.
Test last-comparison interleavings, reject incomplete adapters before effects, and verify
actual worker retry after domain persistence/publish failure. Restore canonical TC/FND/G1-G9
and RC-ID-01 meanings. Keep original GM01-GM20 coverage and no production edits.

## Current verification correction at 6292b22c

Read [Sol closure review](Sol_W1_W3_Closure_Review_6292b22c.md). Three new atomic lease /
unconfirmed-claim denials fail despite the retained green residual examples. Verify actual
worker/store and ingress paths and the original GM01-GM20 requirements. No production
edits: return repairs to Argon. Identify 6292b22c's two worker edits as implementation,
then independently test the next frozen source. Blanket all-FND verification is withdrawn.

## Residual correction verification at f18da842

Read [Sol's current review](Sol_W1_W3_Correction_Review_f18da842.md). Keep the now-passing
old probes, add unchanged new residual/credential/scoring probes, and design independent
atomic-store acquisition/loss, repeated CAS conflict, real export projection, conflicting
authority and full Gate 1 principal tests. Verify actual worker/ingress/producers, not
only synthetic helpers. Disclose e68a7f5d as implementation work; no further production
edits during testing. Argon repairs under standing authorization, Sol reviews integrated
source/evidence. All thirty FND requirements and original GM01-GM20 meanings remain.

## Integrated review correction at f574daa5

Read [Sol's integrated review](Sol_W1_W3_Integrated_Review_f574daa5.md). The original
GM01-GM20 matrix below remains authoritative; do not rename IDs to match convenient
suites. Add unchanged Sol event/progress/scoring probes, retained foreign-export,
conflicting-admin and Gate 1 controls to independent verification. Require actual
ingress/management/approval and versioned-scoring composition, not helper-only passes.
Correct report scope/atomicity/completion overclaims. Argon repairs production and
Gemini independently tests complete integrated scope under standing authorization.

## Complete integrated W1-W3 verification assignment

[Standing authorization](Argon_Gemini_W1_W3_Standing_Completion_Authorization.md)
assigns Gemini independent verification of ALL Argon-submitted FND01-FND30 requirements,
not only the latest analytics changes. Retain GM01-GM20, map all thirty tasks/nine
groups to executed evidence or explicit gaps, return code defects to Argon, and
rerun the integrated gates after corrections. Sol reviews the final frozen packet.
No production edits, weakened security invariants or unauthorized physical execution.

## Current TC20-A checkpoint at 7f6f788d

[Sol independently reproduced 26 passes but found a failing merge boundary](Sol_TC20A_Review_And_Next_Manifest_7f6f788d.md).
After Argon freezes the approved one-file correction, run the unchanged Sol merge
probe, independent reverse-brand/no-effect/same-brand positives, existing analytics
selection and typecheck. Keep FAIL-04 unchanged. Correct TC20-A report counts and
overclaims. A2 has a separate four-file production manifest and new independent
handler tests under the linked server-binding contract; never race its writer.

## Current handoff at source 2ca1889b

Argon replaces Tera for ALL critical implementation; keep the full GM01-GM20
matrix and independent role. Read [Sol's current checkpoint](Sol_W1_W3_Resume_Checkpoint_2ca1889b.md).
For TC20-A, update only legitimate explicit-brand positives in marketing-phase2.test.ts
and add independent controls in gemini-tc20a-*.test.ts after Argon freezes the approved
tracker.ts correction. Preserve brand-dedupe-control.test.ts unchanged. Rerun actual
tracker/provider, downstream isolation/continuity and zero-mutation negatives.
Production failures go to Argon, architecture/acceptance to Sol.

Correct tooling C1/C2 in your test/report paths separately; optional advisory tooling
does not displace critical validation. Freeze source/test revisions and do not edit
production files. No expanded live/browser/database/queue/push authority is granted.

## Current Sol decision checkpoint, 2026-11-06

Use [Sol decisions and independent review](W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md)
to test Tera's next frozen source. D2 authorizes replacing only the obsolete catalog
cache-positive contract with network-only/offline-denial controls and repairing
catalog success fixtures to supply real Request/auth context. Preserve static-asset
caching positives. Never weaken private ownership or malformed-content denials.

Add the D1 and D3-D7 adverse/legitimate controls as production slices arrive. Use
the original GM01-GM20 matrix below for ID attribution. Historical report rows that
transposed GM07/08/09 are superseded by that matrix. The marketing HTTP-503 provider
control independently passes 3/3; event retry/identity defects remain separate.
Sol's selected runner and commands are recorded in the linked review. Do not sum
historical overlapping counts or claim the API typecheck is passing.

Assigned by the owner through Sol on 2026-11-06. Gemini owns independent test design,
test changes, execution and evidence for the remaining foundation work. Read
W1_W3_Model_Routing_And_Handoff_Protocol.md and declare actual runtime identity if
available, assigned testing role, exact source/test revision and next handoff.
Sol owns architectural acceptance. Production fixes belong to Tera or Sonnet by risk.

## Test ownership and execution contract

Use a frozen submitted revision or isolated review worktree. Record source revision,
test revision, normal entry point, simulated dependencies, command, configuration,
environment, exit code and fixed safe observations. Install the existing network/socket/
DNS guard before app imports and remove live DB/cache/queue bindings. Use disposable
keys and restore overrides. No secret-bearing output. Live DB/browser/queue tests need
their separately authorized readiness gate and observed results.

Implementers may run existing checks while coding. Gemini supplies the independent
adverse/composition evidence and owns its test files during review. Do not fix production
code or alter an expected denial to match insecure behavior. A diagnostic alias may
help isolate an import failure, but it cannot count as a repaired runtime package export.
Use actual predicates/callers rather than fixtures that return the desired row regardless
of the query. Keep fixture and physical guarantees explicit.

## Independent test matrix

| Item | FND linkage | Required observable acceptance |
| --- | --- | --- |
| GM01 | FND01/FND12/FND17 | Validate unique enumerated finding/caller rows, classifications, current dates/source refs, accurate counts and no invented exhaustive coverage. |
| GM02 | FND02/FND26 | Reproduce exact focused baselines and diagnose larger failures/timeouts by selection/config. Preserve interrupted/filtered outcomes and configured test-type inclusions. |
| GM03 | FND03/FND06/FND18 | Missing/empty/unknown tenant, ordinary tenant-admin cross-access, summary-helper consistency, local/projection difference and legitimate positives through every public helper. |
| GM04 | FND03/FND18/FND24 | Actual profile GET/PATCH and guard/caller composition with trusted actor/resource sources. Verify package imports, typechecks and sanitized denial; no test-only module alias hiding failures. |
| GM05 | FND03/FND05 | Inspect migrations/metadata for unknown-provenance quarantine, schema/key/FK compatibility and real producer/repository propagation. Physical migration/SQL checks remain separately gated. |
| GM06 | FND11 | Normalize email, discriminate actual platform/deleted predicates, independent equal-email tenant accounts, foreign binding denial, ambiguity, concurrency design and secure admission flow. |
| GM07 | FND04 | All six retained foreign-tenant export denials plus both directions, unknown provenance, job/exam/worker/cache/storage and legitimate owner/internal positives; denial before effects. |
| GM08 | FND05 | Four progress lanes independently. Trusted identity, wrong tenant/user, canonical membership, exact historical replay and actual caller/repository composition. |
| GM09 | FND05/FND21 | Concurrent distinct completion, retry, duplicate/conflict and partial transaction outcomes. Do not call serialized map tests SQL or cross-instance isolation. |
| GM10 | FND07 | Private cache no-write/no-stale-read, public cache positive, A/B mounted and remount, pending response/callback, hidden/session/StrictMode/teardown and queue acknowledgement. |
| GM11 | FND08/FND09 | Verified actor ignores forged body identity, absent/unauthorized/stale/wrong-workflow approval denies before writes, valid approval and safe replay. |
| GM12 | FND10 | Validate exact readiness/build/source/account/store recipes. Execute only separately authorized browser/gateway/physical tests and keep missing prerequisites visible. |
| GM13 | FND13 | Missing profile null, source-backed profile values, all raw similarity uncalibrated/null, invalid/nonfinite/unknown/reordered/subset vector responses, catalog order, no jobs, DB/service failure and actual handler auth/serialization. |
| GM14 | FND14 | Real report child rendering, zero versus missing, aggregate/detail uncertainty, A loaded/B pending/failure, obsolete response and backend timing contract compatibility. |
| GM15 | FND15/FND16 | Reference/unavailable/sample disclosure, legitimate feature retention, no false approval/health/certification, and each form's actual committed/accepted/unknown/rejected contract. |
| GM16 | FND19 | All five actual taxonomy entity callers/ingress/egress, numeric/named historical compatibility, identifiers, errors and canonical schema ownership. |
| GM17 | FND20 | Editor/bulk/schema/API/service/scorer round-trip, option identity, comma-containing text, duplicate/malformed input, partial/wrong credit and historical adapters. |
| GM18 | FND21/FND22 | Nested valid historical/structural/versioned content, malformed/unknown child and authoring example injection; hash positive/nonhex/case/HTTP/service/approval evidence boundaries. |
| GM19 | FND23 | Actual publisher/consumer/worker types, signature/tenant/event identity, same correlation distinct IDs, payload conflict, crash/commit/retry, cross-brand dedupe and positive compatible delivery. |
| GM20 | FND24-FND30 | Integrated affected suites, supported static/lint/build/whitespace gates, compatibility/principle evidence, complete per-group finding map and accurate W4/final packet. |

## Required handoff result

For failure, notify the user which implementation model is required, with exact item,
source revision, command, actual outcome and legitimate positive. Return critical
production failures to Tera and noncritical view/docs failures to Sonnet. For undefined
architecture or contract authority, send one decision-ready packet to Sol with supported
options and a recommendation. Continue independent test work in isolation.

For a stable passing slice, report the precise verified boundary and remaining gates,
then notify the user that Sol is required for architecture/integration acceptance.
Do not label task/group CLOSED, claim a main merge or impersonate Sol's approval.
Keep every retained security invariant required until the actual correction passes it.
All thirty FND tasks and nine groups remain accountable to the complete foundation scope.
