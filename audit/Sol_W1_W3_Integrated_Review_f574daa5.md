# Sol independent integrated W1-W3 review at f574daa5

Assigned role: Sol, architect and final approver. Runtime: Codex, exact backend variant
not exposed. Review date: 2026-11-06. Production baseline e4247a6e; independent test/report
revision f574daa5a9dcb43948a0f18211b67b71574868bb on remediation/w1-2-batch-05-targeted.
Initial working tree had an existing modification to .agents/evidence/agent-runs.jsonl.
It was preserved and is excluded from this review commit. No production source changed
by Sol. No push, deployment, live account/store/queue/browser operation or migration.

## Verdict: CHANGES_REQUESTED

Useful bounded corrections and passing selections exist. The claim that all TC01-TC20
implementation and GM01-GM20 verification are complete is not supported. The submitted
report changes the original GM item meanings and treats source inspection, a local mutex
and passing old fixtures as stronger guarantees than they establish. Required retained
export/admin denials still fail. Additional event, progress and scoring probes fail.

Argon continues ALL remaining FND01-FND30 and TC01-TC20 under the standing authorization.
Gemini corrects the verification coverage/report and independently retests frozen repairs.
Sol remains final approver. This review supplies corrective priorities without requiring
new assignments for routine within-contract work. Preserve every real security invariant.

## Gate 1 ruling: existing D4 applies; FAIL-07 is a defect

There is no new policy ambiguity to resolve. A triggered_by string that is not in a short
bot-name denylist is not a verified, authorized human principal. The requester must not
approve their own workflow. Persisting a dictionary fabricated during generic transition
does not supply missing authority. Current transition_state accepts requester directly,
and the HTTP route requires get_current_user but does not enforce D4 human SHC approval
capability. The record's hash check also skips comparison when either hash is absent.

Preserve test_gate1_cannot_advance_without_approval_evidence. Generic transition must not
manufacture its own approval. A dedicated verified approval command MAY record a decision
and make the transition in the SAME atomic transaction; approval need not require two
HTTP calls or a prior committed transaction. That command must enforce the complete D4
principal, capability, requester separation, workflow/reviewed revision/hash, revocation
and replay policy. Subsequent generic/internal transitions validate the matching stored
decision. Do not whitelist arbitrary human-looking names, trust request roles, or accept
missing evidence/hash as compatible approval. Implement the selected policy, not a new
request for Sol to approve the same policy again.

## Reproduced checks

Node runners use config:false, one worker, no file parallelism, environment:node,
the existing offline guard before application imports and cleared credential variable
names matching DATABASE|DIRECT_URL|REDIS|UPSTASH|NEON|QSTASH. The integrated runner derives
ordered aliases from the tracked API tsconfig. Aliases support isolated source execution;
they do not prove deployed package resolution. Tests use synthetic keys/identities and
in-memory effect adapters. No physical exploit or production compromise is claimed.

| Command / selection from repository root | Exit | Actual result and scope |
| --- | --- | --- |
| node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary placement nested | 0 | Separate selections: boundary six files / 64 passed; placement three files / 24 passed; nested two files / 23 passed |
| node audit/Sol_W1_W3_Integrated_Review_f574daa5.mjs analytics | 0 | Nine files / 28 passed, including the two-case Sol merge probe and eight-file 26-case analytics selection |
| Isolated guarded startVitest on packages/events/src/__tests__/ | 0 | Five files / 22 passed; old sequential retry/type tests pass, not durable claim/lease acceptance |
| node audit/Sol_W1_W3_Integrated_Review_f574daa5.mjs exports | 1 | Four files / 52 passed / 8 failed cases. Multiple soft assertions per failed case are not separate tests |
| node audit/Sol_W1_W3_Integrated_Review_f574daa5.mjs admin | 1 | One file / 8 passed / 1 failed; conflicting tenant passes gate and invokes privileged operation |
| node audit/Sol_W1_W3_Integrated_Review_f574daa5.mjs probes | 1 | One file / 2 passed / 6 failed: event conflict, concurrent claim, pending claim, missing tenant; progress missing tenant and cross-instance merge |
| node audit/Sol_W1_W3_Integrated_Review_f574daa5.mjs scoring | 1 | One legitimate versioned-ID pass / one unknown-ID credit failure |
| Python isolated foundation harness, test_gate1_boundary.py | 1 | One failed; repo.upsert awaited despite requester/self transition without prior approval evidence |

Python reproduction uses the same harness reported by Gemini. In PowerShell set the
child process PYTHONPATH to services/project-ai, then run:

```powershell
python -c "import asyncio,builtins,socket,dotenv; loop=asyncio.new_event_loop(); builtins._foundation_test_loop=loop; deny=lambda *a,**k: (_ for _ in ()).throw(RuntimeError('offline guard')); socket.socket.connect=deny; socket.create_connection=deny; socket.getaddrinfo=deny; dotenv.load_dotenv=lambda *a,**k: False; import pytest; result=pytest.main(['-q','services/project-ai/tests/foundation/test_gate1_boundary.py']); loop.close(); raise SystemExit(result)"
```

The Python guard is separate from the TypeScript setup; do not claim the Node setup
file guards Python. An initial export/admin diagnostic alias omitted @quiz/auth/rbac
and failed to collect the admin suite; the committed runner corrects it and produces
the independent admin failure above. Collection errors are not authorization outcomes.
Do not sum overlapping selections into an inflated total or infer unrun suites passed.

Graph maintenance: graphify update . was invoked after adding the review probes. It
reported incremental extraction of six changed files, then remained running without a
completion result. Sol stopped only that identified invocation's process tree. The
refresh is INTERRUPTED, not a verified rebuild. Frozen source/test evidence governs.

## Blocking source findings and required corrections

### F01, P0: export provenance still missing through actual producers/readers

export/trigger queries the default exams store by examId and compares only userId.
It passes brand to processExport only in the development branch. Queue, QStash fallback
and production saga calls still omit tenant; ExportSaga calls processExport with three
arguments, whose new brand parameter silently defaults to RTH. exportEngine can return
an unqualified persisted exams.exportUrls pointer before verifying stored owner/tenant.

download checks the brand only when fileRef begins with a recognized brand prefix;
unqualified legacy keys bypass the check. Status and URLs readers still use local-ID
ownership without independent stored tenant provenance. A new filename or requester-
derived ExportMeta is not authority for old data. The retained tests show foreign equal-ID
trigger dispatch, URL Redis/storage access, status disclosure/fallback and file fetch.
Eight failed cases include duplicated download variants; retain the six-path coverage
model and both directions, rather than reporting only a two-download subset.

Correct actual exam/job producer and worker bindings, trusted tenant/local predicates,
metadata, saga and all readers. Unknown historical provenance must deny before effects.
Remove guessed RTH defaults; do not derive ownership solely from a file path. Supply valid
owner/internal positives from independently established stored authority. Do not solve
the issue by rejecting every export or changing foreign denials to successful fixtures.

### F02, P0: Gate 1 can self-approve without D4 authority

workflow_governance.py transition_state records gate_1_approval for arbitrary non-bot
triggered_by, including workflow.requester_id. workflows.py generic transition accepts
an authenticated principal without the selected SHC approval capability. The retained
probe independently fails. Apply the ruling above and test actual route plus service,
verified role/class/brand/audience, self-approval, forged actor, wrong workflow/revision,
missing hash, revoked evidence, duplicate/replay, rollback and legitimate human approval.

### F03, P1: event payload conflicts are silently acknowledged

consumer.ts writes completed:fnv1a:<hash>:<eventId>, but
serializedRecord.split(':', 3) extracts recordedFingerprint as just fnv1a. The subsequent
startsWith('fnv1a:') check is false, disabling conflict comparison. The independent probe
reuses one event ID with changed payload and gets 200 instead of 409. Replace ad hoc
colon parsing with a validated versioned record. Use a collision-resistant canonical
payload digest, not a 32-bit FNV value as the security binding. Do not merely adjust
the string split while leaving the durable record/claim contract incomplete.

### F04, P1: no atomic event claim/lease or durable completion guarantee

ConsumerRedisLike exposes nx and options expose leaseTtlSeconds, but createQStashHandler
does not acquire an atomic claim. It performs get, then handler, then set. Concurrent
same-ID requests both execute the effect in Sol's probe. Any existing pending record
is returned as a completed duplicate with HTTP 200. A crash after effects but before
set remains unreconciled. Marking completion after success passes the old sequential
test but was explicitly rejected as the complete D7 solution.

Implement atomic tenant/event/consumer-version claim, owner token, bounded lease renewal/
expiry, typed pending/completed/conflict records, failure/recovery and conditional release.
Bind transactional effects and completion/outbox where required. External effects need
idempotency/reconciliation. Do not acknowledge pending work as completed. Distinguish
retryable errors from terminal conflicts. Keep storage adapter and physical evidence
separate; an in-memory map cannot establish durable cross-instance delivery.

### F05, P1: event source/default is not trusted tenant identity

resolveEventIdentityAndType substitutes parsed.source or default for tenantScope and
falls back to body IDs or a fingerprint when event ID is absent. It does not establish
the D7 tenant authority chain. A signed transport payload alone does not prove any
arbitrary source label is a canonical tenant. Sol's no-tenant probe reaches the handler.
Select an explicit verified tenant resolver/deployment operation binding, exact event
identity/version, and coordinated producer/legacy adapters. Unknown tenant must deny
before tenant-private effects. Register each compatible event type explicitly rather
than permitting arbitrary allowedTypes as a universal mismatch escape.

### F06, P1: progress scope remains optional and concurrency is only instance-local

TutorialProgressRepository accepts tenantId?: string. Missing input causes private
reads/updates without a tenant predicate; the no-tenant read probe selects a row.
withProgressKeyLock belongs to one repository object. Two objects sharing one store
read the same old progress and overwrite one completion; Sol's staged adapter reproduces
the loss. No SQL transaction/version comparison/atomic merge is implemented. The update
predicate is only row ID. This violates D3 in source; physical testing is not the only
remaining work.

Require trusted canonical tenant at every private repository entry and migrate all
real callers. Reject missing/unknown provenance before effects. Make SQL keys/predicates
tenant/local-qualified, and implement database-atomic merge/upsert or optimistic CAS
with transaction/retry/conflict handling. Do not replace one-instance locks with a
global process mutex and call that distributed correctness. Existing schema migrations
remain offline designs until approved; do not apply blocked migration files.

### F07, P1: versioned option-ID encoding still scores display text

Both engines still resolve option IDs/labels into option text. encodeVersionedOptionIds
and validateQuestionAnswerOptionIds have no production callers beyond their definitions.
normalizeQuestionOptions still generates positional IDs. The v1:ids prefix changes
parsing but does not enforce immutable snapshot IDs. An unknown versioned option ID
equal to the correct option's text gets score 1 in the actual immediate resolver probe.
The valid versioned correct-ID control also passes, so blanket denial is not acceptable.

Implement canonical selected-ID arrays/version/snapshot contracts across real producers,
submission ingress, persistence, retrieval and both scorers. Wire strict duplicate/
unknown validation before grading writes, compare canonical IDs rather than text and
preserve the selected partial-credit policy. Invalid identity should be a recoverable
validation result, not silently finalized zero. Preserve immutable historical results
and explicitly quarantine ambiguous legacy encodings; do not manufacture stable IDs
from display position. Three delimiter cases cannot establish that rollout.

### F08, P1: privileged tenant-context denial still fails; helpers are not integration

batch-08-resource-guard-boundary.test.ts still accepts a signed tenant admin with
conflicting canonical request tenant and invokes the privileged-operation stub. The
added hasAdminProfileManagementAuthority helper is not called by an actual management
route in the inspected call graph/source references. Separate helper positives and
changing the older test to USER_MANAGE do not prove the management ingress/repository.
Trace the actual admin actor/request/target/store chain, reject conflicts before effects,
and supply scoped legitimate management positives through that real path.

## Evidence disposition and verification-report repair

Accepted only within reproduced boundaries: the TC20-A cross-brand merge guard plus
selected downstream pipeline controls; specific legacy nested malformed-child and D1
storage-injection corrections; reported cache/ownership/admission containment selections;
the narrow comma-text delimiter correction as a partial patch, not the D5 rollout.
These scoped observations do not close the associated TC/FND items.

TC20-A2 real Next and collector ingress have no independent new handler selection in
Gemini's submitted 26-case suite. Tracker/provider tests and downstream identity tests
are not substitutes. Return A2 as implemented/pending exact handler verification and
deployment-binding readiness, not VERIFIED. The fixture update preserving actual config
exports appears consistent with the new import and should retain its existing assertions.

Restore GM01-GM20 meanings from Gemini_W1_W3_Independent_Test_Assignment.md. The report
currently relabels GM01 as git status instead of finding enumeration, and calls a mutex
database-atomic verification. Root boundary selection covers helper/admission/worker
fixtures, not all real profile GET/PATCH or exports. Placement 24 cases span three files,
not 24 route cases. Nested 23 span two files, not 23 schema/budget/limit controls.
Artifact hash schema tests do not prove Gate 1/placement/composer/runtime approval.
Only three package typechecks were reported; do not say all packages are clean.

Argon edited ownership.service.test.ts in its production slice. Those changes must be
classified as implementer evidence; Gemini rerunning them does not supply new independent
test design. Gemini must review the expectation changes and add actual management-path
controls. Preserve historical records and add corrected current dispositions rather
than overwriting failure history with broad RESOLVED labels.

## Full twenty-item continuation, not a reduced assignment

The standing completion authorization remains active. Argon is authorized to correct
these defects under the existing D1-D7 policies with exact per-slice manifests; no new
approval is needed merely to add the missing within-contract callers/stores/tests.
Escalate only new authority/product decisions or separately gated execution. Continue
independent work while a genuinely new decision is pending.

| TC item | Current disposition / required next action |
| --- | --- |
| TC01 | CHANGES_REQUESTED: reconcile all twenty items/thirty FND requirements; eight commits are not complete scope |
| TC02 | PARTIAL: retain tenant adapter/self positives and test missing context at actual callers, including empty roles |
| TC03 | PARTIAL: keep D1 self-only policy; wire explicit real management path and independent authority controls |
| TC04 | OPEN: prove local/projection/tenant bridge; secret rotation is not a substitute for that mapping |
| TC05 | PARTIAL: passing typecheck is not real GET/PATCH binding/unknown-store evidence; add composition |
| TC06 | OPEN: provenance migration/quarantine design and mixed-version rollout; no guessed backfill/live execution |
| TC07 | PARTIAL containment only: finish normalized platform uniqueness, deleted/duplicate and conflict-safe consumers |
| TC08 | NOT COMPLETE: secure new-account invitation/provisioning logic is still missing, not only delivery infrastructure |
| TC09 | CHANGES_REQUESTED F06: mandatory tenant at all private progress entries and real caller propagation |
| TC10 | CHANGES_REQUESTED F06: atomic database merge/CAS, cross-instance transactions/retry and correct schema key |
| TC11 | CHANGES_REQUESTED F01: actual exam/job/saga/worker resource authority, no brand defaults or request relabeling |
| TC12 | VERIFICATION_FAILED F01: all retained export denials, unknown provenance, zero effects and owner/internal positives |
| TC13 | VERIFICATION_FAILED F08: conflicting admin tenant context and real target/store predicates |
| TC14 | PARTIAL cache containment: keep current passes; complete owner epoch/client-state and physical browser gates separately |
| TC15 | VERIFICATION_FAILED F02: D4 human capability/no-self-approval and atomic persisted decision enforcement |
| TC16 | PARTIAL: keep placement truth; finish all five taxonomy callers and source-backed consumer coverage |
| TC17 | VERIFICATION_FAILED F07: immutable versioned IDs, producer/submission/readers and both scorers; legacy compatibility |
| TC18 | PARTIAL: retain 23 selected passes and cycle rejection; add exact depth/node/root boundaries, historical adapters and actual storage consumers |
| TC19 | PARTIAL: schema hash is not actor/evidence/approval integration; complete real HTTP/service authority |
| TC20 | CHANGES_REQUESTED F03-F05: atomic durable events and verified tenant identity; real A2 ingress testing; full integration/report coverage |

Priority order: preserve/fix export/private authority and Gate 1 first; address event
conflict/claims, mandatory progress scope/atomicity, scoring identity and privileged
context in dependency-safe slices. Gemini adds independent sensitivity/no-effect/positive
controls and reruns the full required integrated selections after Argon repairs. Do not
skip remaining truth/contract/inventory work or claim all other FND tasks complete.

FND01-FND30 and all nine groups remain open at their previous scoped dispositions.
This review materially reopens/unconfirms FND03/04/05/06/09/20/23/24/25/28/29/30 claims;
other unexecuted requirements remain visible. W4 entry is not established. All physical
DB provenance/migrations/concurrency, queue/storage/browser/deployment gates remain
separate. BROWSER-01 and RC-ID-01 remain IN_PROGRESS.

Next required model: Argon for the full corrective continuation. Then Gemini for complete
independent verification, including the unchanged new Sol probes and retained exports/
admin/Gate 1 controls. Then Sol for revised source/evidence review. No external dispatch
or automatic model switch is claimed by these repository instructions.
