# Sol adapter and closure review at 27243c6e

Date: 2026-11-07. Verdict: **CHANGES_REQUESTED**. W1-W3 closure and W4 entry remain unapproved.

## Baseline and acknowledged progress

Initial HEAD: `27243c6eceb8efa1555d09e6f3d018aa0e322efe`; branch
`remediation/w1-2-batch-05-targeted`; initial working tree clean. Argon's source is
`a09de38b24e0d24a2321ffc99097ef80241c3f0a`. Gemini's subsequent commit changes its report
only, so this submission preserves the production/test role boundary.

Sol reproduced the unchanged four-test lease runner as **4 passed, exit 0**. Removal of
production mock introspection is confirmed. Redis Lua compare-owner operations and explicit
adapter interfaces are useful improvements. This is scoped progress, not all-task acceptance.

The other reported 249 passing executions are attributed to Gemini, not claimed here as
fresh Sol reruns. The arithmetic total 253 is a count of test executions across selections,
not proof of unique requirements or coverage of all thirty FND tasks/nine gates.

## A1: non-atomic compatibility fallbacks remain (HIGH, existing L1/D7)

`packages/events/src/consumer.ts` `createDurableEventLeaseStore` and
`apps/realtutorialhub-web/src/app/api/workers/worker-lease.ts` both retain this fallback:
read ownership, read ownership again, then unconditional SET or DEL. A replacement lease
may be acquired after the second read. Two reads do not create a storage transaction.

The old probe replaces the record after the FIRST ownership read, which the new second
read catches. Its four passing cases therefore do not prove arbitrary interleaving safety.
The new probes replace after the FINAL read. Both generic and worker completion overwrite
the replacement, and both cleanup functions delete it. These are four reproduced failures.

Required correction: remove the non-atomic fallback. Before admitting a new business effect,
require a complete supported atomic adapter contract: Lua/transactional owner comparison or
an explicitly implemented atomic claim/complete/release adapter. Reject incomplete adapters
before acquisition/effects, rather than executing effects then discovering unsupported
completion. Two additional probes show both current entry points admit such adapters.
Do not fix this by adding a third read, in-process mutex or test-double detection.

Preserve legitimate adapters by supplying an honest atomic adapter in positive fixtures.
The old normal-owner fixture lacks atomic operations; if unsupported adapters are rejected,
Gemini may replace that positive fixture with a conforming adapter while preserving the
positive behavior and all negative security assertions. Do not weaken the new unsupported-
adapter denial. Keep the supported Redis-operation control passing.

## A2: actual worker crash/retry effects are not established (HIGH, existing L3/D7)

The certificate worker inserts a certificate and THEN calls `publishEvent`. If publication
fails, cleanup releases its lease; the retry finds the existing certificate and returns
200 without replaying the missing publication. The existing-record branch only completes
the lease. This can suppress an undelivered downstream effect after a recoverable failure.
The reviewed source does not show a durable publish intent/outbox tied to that insert.

Argon must implement the already-required durable effect/reconciliation contract, inspect
equivalent badge/remediation/subscription/index paths, and identify each independent effect.
A durable domain row is not evidence that all downstream effects finished. Use transactional
outbox/intent plus idempotent effect identity, or another explicitly equivalent recoverable
design. Do not acknowledge completion until required effects are accounted for. Retain
physical delivery qualification as a separate gate; this source defect is not resolved by
calling all queue work physical or deferred.

Gemini must test an actual route with publication failing AFTER domain persistence, then
retry and observe recovery without duplicate domain writes. Also test replacement leases
through actual worker adapters. The four-test Sol file imports only the generic events
handler: it cannot establish L3 worker integration. Its fourth test is the unconfirmed
claim denial, not a worker crash-recovery test. This source-path finding is based on code
inspection; no live queue effect was executed or reproduced in production.

## A3: evidence mappings and readiness must be corrected (HIGH for acceptance)

Gemini's TC-to-FND table invents a sequential mapping inconsistent with the authoritative
assignment (for example TC03 is not FND07; TC08 is not FND12; TC18 is not FND22). Argon's
new group names also replace the established acceptance groups. Restore the governing
mapping from `Claude_Sonnet45_W1_W3_Completion_Directive.md` and the existing Sol checkpoint.

The established groups are G1 W1.2 authorization/browser qualification; G2 W1.2-EMAIL;
G3 W2.1 production truth; G4 W3 identity; G5 taxonomy; G6 assessment; G7 tutorial/ILS;
G8 Project LLM; G9 events. Do not rename them into new topical groups to imply acceptance.

`RC-ID-01` is the existing **identity, session, authorization and brand authority root cause**
in `Architecture_Remediation_Execution_Plan.md`, not a Redis cluster stress-test label and
not merely JWT secret rotation. Retain all its original findings and acceptance boundaries.
`BROWSER-01` retains its own browser qualification requirements.

No test in the four-probe lease file imports `worker-lease.ts` or an application route.
Do not attribute it to real worker Lua/crash recovery. The selected checkpoint suites also
cannot establish secure invitation provisioning, physical migration quarantine, all taxonomy
callers, every truth finding, or all integration/closure requirements. Demonstrate those
separately or mark them open. TC08 local-account containment does not implement a secure
new-account invitation flow: that code gap is distinct from physical SMTP delivery.

Record workspace typecheck failure and scoped typecheck success separately, with exact
commands/errors. Do not turn a filtered check into workspace acceptance. Maintain full
logs and actual entry points; summaries must not relabel helper tests as HTTP/end-to-end.

## New reproducible evidence

Command: `node audit/Sol_Lease_Adapter_Review_27243c6e.mjs`.
Offline guard installed before imports; matching DB/cache/queue environment keys stripped.
Observed: **1 file, 1 passed / 6 failed, exit 1**.

| Cases | Result | Meaning |
| --- | --- | --- |
| Generic completion and cleanup after final comparison | 2 failed | Replacement overwritten/deleted |
| Worker completion and cleanup after final comparison | 2 failed | Same unsafe fallback in real shared worker helper |
| Generic effects / worker acquisition with incomplete adapter | 2 failed | Unsupported adapter not rejected before admission |
| Supported eval adapter completion, exact key/owner/value/TTL arguments | 1 passed | Owner-conditional single-operation delegation; not physical Redis execution |

## Full TC01-TC20 continuation (not reduced to these findings)

Standing authorization remains active. All earlier scoped acceptances are retained only
within their stated boundaries; unproved work must not be rewritten as complete.

| Item | Remaining implementation / acceptance boundary |
| --- | --- |
| TC01 | Correct source/test attribution, canonical mapping, original finding coverage and gate dispositions. |
| TC02 | Complete supported canonical-brand adapter callers and empty-role self-path evidence. |
| TC03 | Self-only vs explicit admin management entry points and legitimate same-tenant boundaries. |
| TC04 | Trusted original/local/projection bridge; equality checks alone do not qualify mapping. |
| TC05 | Actual profile GET/PATCH principal-to-store composition and row provenance. |
| TC06 | Concrete reviewed expand/backfill/quarantine/constraint implementation and separately authorized physical qualification. |
| TC07 | Platform-scoped uniqueness and all consumers; physical SQL collision/concurrency qualification. |
| TC08 | Secure invitation/new-account provisioning remains separate from accepted local-account containment and SMTP delivery. |
| TC09 | All four classified progress lanes and tenant/owner call-site coverage. |
| TC10 | Retain CAS/exhaustion controls; qualify actual SQL multi-process concurrency. |
| TC11 | Export creation/dispatch/worker/cache/storage provenance across every producer. |
| TC12 | Six reader/status/URL/download/storage boundaries, positives and zero-effects denials. |
| TC13 | Actor/request/target/store agreement at all privileged entry points. |
| TC14 | Retain isolated private-cache controls; installed-browser upgrades and owner transitions remain open. |
| TC15 | Complete approval/revoke/rebind/transition principal, authority and persisted race evidence. |
| TC16 | Placement truth and all five taxonomy caller contracts, without invented calibration. |
| TC17 | Immutable question-option snapshots, producer/persistence round trips and historical compatibility beyond scoring examples. |
| TC18 | Historical/quarantine and authoring/storage integrations beyond selected recursive schema controls. |
| TC19 | Artifact/certificate/approval runtime composition; schema/hash checks alone are insufficient. |
| TC20 | Correct A1-A2, actual ingress/worker evidence, integration/adverse/quality/re-audit/closure FND24-FND30 requirements. |

## Next handoff and execution boundaries

**Argon:** owns all remaining TC01-TC20/FND01-FND30 production implementation, integration
and accurate handoff. Fix A1-A2 with an exact source manifest; reconcile A3 using canonical
records, not a new competing completion ledger. Perform a full caller/producer and remaining-
requirement audit before declaring implementation complete. Routine within-D1-D7 work is
already authorized; do not pause to request the same policy again. Freeze a new source SHA.

**Gemini Flash:** independently test that SHA; no production edits. Write fresh adverse
tests for actual workers, complete supported adapter semantics, failure after persistence,
and every unmet original GM requirement. Correct evidence/mappings without inventing coverage.
Report passed/failed/not-run/blocked separately and return production defects to Argon.

**Sol:** reviews integrated source and independent evidence for scoped acceptance. No automatic
W1-W3 closure or W4 entry follows from aggregate green counts. Full FND/group acceptance and
all original physical/root-cause gates remain required under the governing documents.
No push, deployment, main merge, physical migrations, live queue/storage/database operations
or credential rotation is authorized by this review.
