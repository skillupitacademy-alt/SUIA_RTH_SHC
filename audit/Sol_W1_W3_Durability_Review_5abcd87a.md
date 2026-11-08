# Sol durability and provisioning review at 5abcd87a

Date: 2026-11-07. Verdict: **CHANGES_REQUESTED**. No W1-W3 closure or W4 entry.

## Actual baseline and scoped progress

Branch: `remediation/w1-2-batch-05-targeted`. Actual reviewed HEAD is
`5abcd87a980d28ad265d049731f05ad5cdd035ce`, source is
`e19034dce9fae23abd7e39d74cdedab84affc9da`, independent tests are
`cde6ae51c6ae7c73db8cfb04d1efc60ce2163b78`. Initial tree was clean. Use the actual full
HEAD above rather than the different full report SHA transcribed in the pasted handoff.
Diff from source to report contains test/audit paths only; no new production changes by Gemini.

Sol independently reran `node audit/Sol_Lease_Adapter_Review_27243c6e.mjs`: **7 passed,
exit 0**. The previous two-read fallback and incomplete-adapter admission findings are
resolved within these reviewed source paths/controls. Preserve that progress. This does
not certify physical Redis behavior or every arbitrary custom adapter implementation.
Other existing green selections in the handoff remain attributed to Gemini, not a fresh
full workspace rerun by Sol. Canonical mapping corrections are progress, not group closure.

## S1: runtime outbox is volatile, not database-transactional (HIGH)

S1-S3 are source-review finding labels, not new architecture decisions. D1-D7 remain
the governing decisions. S1 continues A2/L3/D7.

`apps/realtutorialhub-web/src/app/api/workers/worker-lease.ts` stores all publication
records in `workerOutboxLedger = new Map`. Runtime `getWorkerOutboxIntent`,
`upsertWorkerOutboxIntent` and `dispatchWorkerOutboxIntent` never access the new SQL table.
The schema and offline migration exist but are not the production persistence adapter.
Calling a Map mutation inside `db.transaction` does not enlist it in that transaction,
make it durable, roll it back, or share it between application instances.

New probes demonstrate pending intent loss on a fresh module instance, two concurrent
dispatchers publishing the same in-flight intent, and silent payload replacement under an
existing event identity. The same-process retry route tests legitimately show improved
reconciliation, but cannot establish restart safety or storage-atomic outbox ownership.

Required implementation under existing A2/D7: a real repository over the owned outbox
store; domain row and immutable publication intent written using the SAME database
transaction/connection; unique identity and immutable payload conflict check; database-
atomic dispatcher claim/owner fencing with affected-row truth; durable attempt/ack/error
state; pending-intent enumeration/recovery after restart; documented crash windows.
Keep an in-memory repository only as an explicitly injected test adapter, not the runtime
source of truth. Bind actual certificate/badge and other required effect paths to it.
Unknown historical intent provenance must follow explicit reconciliation, not presumed success.
No physical migration execution is authorized; implement and test actual repository calls
against controlled adapters and leave physical SQL qualification explicitly open.

## S2: stable event ID is republished with a different envelope (HIGH, D7)

`publishEvent` regenerates `correlationId` and `occurredAt` when only `id` is supplied.
Current outbox callers supply a deterministic ID without persisting/reusing the full
envelope. The consumer fingerprints the entire parsed envelope. New producer-to-consumer
composition probe publishes the same event ID and domain payload twice: first consume
returns 200, second returns **409 payload conflict**, rather than a duplicate acknowledgment.

Persist and reuse the immutable canonical envelope (including correlation, occurredAt,
type, source/version and verified tenant representation) across retries. Alternatively,
an explicitly selected equivalent fingerprint contract must preserve immutable identity
and conflict detection; do not remove the payload-conflict control to make this pass.
Test loss of provider acknowledgment, replay, true conflicting payload and cross-tenant
identity through the real publisher/consumer adapter chain. Never claim exactly-once
physical delivery from a deterministic UUID alone.

## S3: invitation authority is volatile and redemption is not commit-safe (HIGH)

`apps/skillup-admin/src/lib/student-invitation.ts` uses two process-local Maps for lookup,
revocation and single use. Although creation copies a hash into admissions.documents,
redemption never reads that persisted state. New instance/restart cannot redeem a valid
issued token. The helper marks it redeemed before awaiting password persistence.
The actual redeem route then performs separate user/admissions updates without a
transaction or affected-row verification. A simulated first DB failure leaves the token
consumed (retry 409); a zero-row user update is reported as activated (200).

Required TC08 implementation: durable tenant/user/invitation/hash-bound authority in a
repository; atomic pending/unexpired/unrevoked-to-redeemed claim together with the intended
account credential/activation update; verify the exact account row and affected rows;
failure rollback/retry; single winner across instances; persistent revocation/reissue.
Separate credential hashing from the transaction as appropriate, but never consume the
token before a commit that actually applies the intended account change.

Review creation as one recoverable account/profile/admission/invitation unit and enforce
database uniqueness/conflict behavior. Merge invitation metadata into the intended
admission record rather than overwriting all existing documents for every admission of
that user. No activated response may follow a missing/deleted/conflicting account.
Preserve random bootstrap secrets, normalized platform ownership, expiry, tampering,
replay, foreign-tenant denials and valid redemption. Keep physical SMTP and SQL separate
from these source requirements. Do not replace Maps with a process-global object/cache
and call it durable, and do not expose raw tokens in logs.

## Independently reproduced evidence

Command: `node audit/Sol_Durable_State_Review_5abcd87a.mjs`.
Pre-import offline guard; matching service environment keys cleared; config-free isolated
Vitest; mocked database/publisher transport. Transcript:
`audit/Sol_Durable_State_Review_5abcd87a.log`. **3 files / 2 passed / 7 failed, exit 1**.

| Cases | Observed |
| --- | --- |
| Same-process legitimate invitation redemption + replay denial | PASS |
| Real redeem route with successful account-update fixture | PASS |
| Fresh instance invitation lookup | FAIL: valid token unavailable |
| Fresh instance pending outbox lookup | FAIL: pending intent unavailable |
| Concurrent outbox dispatcher | FAIL: both publish |
| Immutable publication identity/payload | FAIL: payload silently replaced |
| Failed account update followed by retry | FAIL: retry returns 409 |
| Zero affected account rows | FAIL: route reports 200 activation |
| Real publisher-to-consumer retry, stable ID | FAIL: second consume returns 409 |

Fresh-module probes model application-memory loss/instance separation; they do not claim
a physical server restart or physical DB/queue experiment. Route failure probes invoke
the actual POST handler with controlled DB outcomes and a transport/parser fixture.
The publisher composition uses real envelope generation and consumer fingerprinting with
transport and signature-verification doubles. A first harness attempt had a mock-export
collection error; an explicit db-people alias corrected it before the results above.

## Full remaining assignment and evidence truth

Argon still owns ALL TC01-TC20/FND01-FND30 and the existing G1-G9 scope. The canonical
mapping and twenty-row continuation in `Sol_W1_W3_Adapter_Review_27243c6e.md` remain active;
this review does not shrink the assignment to three new labels. A1 fallback removal is
scoped progress; A2 runtime durability and TC08 remain CHANGES_REQUESTED. TC01/evidence
must stop equating complete automated execution with complete requirement coverage.

Gemini's new tests are genuine improvements, including actual certificate/badge route
retry checks. They retain the same module and memory, so qualify them as same-process
publication-failure recovery. Do not relabel them as crash/restart durability. Report the
known old Sol selections failing on unsupported-adapter fixtures, with their contract
reason, instead of saying every diagnostic passes. Add fresh conforming adapter controls
for their legitimate effect/retry scenarios while retaining all original negative intent.

The disclosed workspace failure, scoped typecheck successes, unexecuted physical proofs
and outstanding original GM01-GM20/FND/group requirements must remain separate. The user
approved full final implementation/verification protocol remains active. All original
RC-ID-01 and BROWSER-01 meanings and gate conditions are preserved.

## Next handoff

1. **Argon:** exact source manifest, real persistence/transaction adapters and full caller
   migrations; fix the durability, immutable envelope and invitation commit invariants;
   continue all remaining twenty TC rows and original FND requirements. No repeated
   within-contract approval is needed. Freeze integrated source IMPLEMENTED_UNVERIFIED.
2. **Gemini:** tests/audit only; exercise restart with a shared controlled durable store,
   rollback/zero-row outcomes, two application instances, dispatcher ownership/replay,
   immutable envelopes, all legitimate and foreign/invalid controls, then full integrated
   regression and requirement-level PASS/FAIL/NOT_EXECUTED/BLOCKED evidence.
3. **Sol:** review integrated source and independent evidence, then decide scoped acceptance
   and readiness. No foundation closure follows from aggregated passing executions.

No push, main merge, live migration/queue/storage/database activity, account operation,
credential rotation or deployment is authorized by this review. Physical qualification
or permitted documented deferral remains governed by the original readiness gates.
