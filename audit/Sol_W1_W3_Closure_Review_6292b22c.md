# Sol closure review at 6292b22c

Date: 2026-11-07. Assigned reviewer: Sol. Verdict: **CHANGES_REQUESTED**.

## Baseline and attribution

Reviewed branch: `remediation/w1-2-batch-05-targeted`. Initial working tree was clean at
`6292b22c27413a9c15a510a32943baa295a821bc`. Argon's frozen implementation is
`e01543802d3a195b843046b49a2a015cdd4843b5`. The candidate reviewed here includes BOTH revisions.
Commit 6292b22c contains two production changes: tenantScope additions in the RTH
`handle-exam-completed` and `index-content-vector` worker routes. Attribute these to
Gemini as implementation contributions; they are not independent test-only changes.
Retain the changes for review, without rewriting history or automatically reverting them.

The previous R1-R8 corrections are substantial progress. Passing their selected probes
supports those particular invariants, rather than completion of every TC/FND requirement.
Earlier report wording declaring all TC01-TC20/FND01-FND30 VERIFIED is not accepted.
Existing D1-D7 policies and standing completion authorization remain in force.

## Reproduced evidence

All new JavaScript probes use the offline network guard before imports and strip service
credentials. No physical Redis/SQL/queue operations were executed.

| Selection | Independently observed result | Boundary |
| --- | --- | --- |
| `node audit/Sol_W1_W3_Residual_Review_f18da842.mjs residual scoring` | residual: 7 passed; scoring: 2 passed; exit 0 | Prior retained residual examples |
| Python offline harness: principal probe plus gate1, actor and artifact foundation files | 19 passed; exit 0 | Mocked principal/service/schema controls |
| Integrated review runner `admin` | 1 file, 9 passed | Selected request-context controls |
| Integrated review runner `analytics` | 9 files, 28 passed | Selected analytics controls |
| `node audit/Sol_Event_Lease_Atomicity_Review_6292b22c.mjs` | 1 passed, 3 failed; exit 1 | New deterministic lease interleavings and unconfirmed adapter claim |

Do not sum overlapping selections as distinct security requirements. Gemini's other
reported suites remain attributed to Gemini; this table is not a claim of a fresh full
workspace build or physical qualification by Sol.

## Blocking event findings: existing D7 remains unmet

### L1: completion and release are not atomic with owner comparison

`packages/events/src/consumer.ts` performs GET in `verifyLeaseOwnership`, then a separate
unconditional SET of completion or DEL during release. A lease can expire and be replaced
between these operations. Unique tokens do not prevent the old owner overwriting or
deleting the replacement record. Two new probes reproduce precisely that interleaving:
completion replaces the new owner's pending record; failure cleanup deletes it.
Earlier residual probes replaced the record BEFORE the ownership read and correctly pass;
they did not cover the interval AFTER that read.

Required implementation: storage-atomic compare-owner-and-complete and compare-owner-and-
release (for example, adapter operations backed by Redis scripts/transactions with the
required atomic semantics). Unsupported adapters must fail closed. A GET followed by an
unconditional write/delete is insufficient. Keep tenant/event/consumer identity and
payload-conflict guarantees. Atomic record transitions alone do not establish exactly-once
business effects: retain the durable effect/outbox/reconciliation and crash-window plan.

### L2: production security behavior depends on test-framework metadata

`isMockSetWithExplicitReturn` inspects `.mock` and `getMockImplementation`. An undefined
claim result is accepted for an unconfigured Vitest mock, while the same result from a
normal adapter is denied; a missing stored lease is similarly treated as owned for that
mock shape. The new denial probe shows the handler executes without a confirmed claim.

Remove test-framework introspection and all associated authorization/ownership exceptions
from production. Specify one supported adapter result contract. Update legitimate fixtures
to implement that contract; never weaken negative assertions or specialize production to
make mock fixtures pass. Unknown claim results must produce no business effects.

### L3: qualify actual worker claim/effect paths, not just the generic helper

The badge worker constructs the generic handler without an idempotencyStore and retains
its own `processing`/`processed` Redis claim with unconditional completion/cleanup. The
helper lease changes therefore do not automatically protect that worker's own lock.
Argon must inventory every createQStashHandler consumer and its actual store, plus any
additional inner lock; integrate the supported atomic owner contract at the real boundary.
Cover lease replacement, failed claim, crash/retry and effects before completion. This is
source integration work under D7, separate from later physical queue qualification.

## Full continuation: Argon retains all twenty TC items

These are scoped continuation dispositions, not a fresh certification of unexecuted paths.
Use the existing consolidated handoff for historical evidence and reconcile the original
FND requirements and nine group gates against it; do not create another competing ledger.

| TC | Current review boundary / required continuation |
| --- | --- |
| TC01 | Partial: reconcile source/test revisions, exact commands, every FND and group gate; closure claim withdrawn. |
| TC02 | Selected adapter/self-path controls pass; finish supported caller coverage and remove unverified tenant defaults. |
| TC03 | Selected self-only and explicit management controls pass; complete real management entry-point evidence. |
| TC04 | Trusted original/local/projection identity bridge and consumer coverage remain to be qualified. |
| TC05 | Selected principal/context corrections have evidence; full profile GET/PATCH store-provenance composition requires traceable coverage. |
| TC06 | Source migration containment retained; provenance backfill, quarantine, constraints and physical rollout remain gated. |
| TC07 | Local normalized lookup containment retained; database uniqueness/concurrency qualification remains open. |
| TC08 | Local-account admission containment is not secure new-account provisioning; inventory and finish authorized remaining contract work. |
| TC09 | Tenant-scoped repository corrections have selected evidence; reconcile every progress lane and caller. |
| TC10 | Bounded CAS/exhaustion corrections pass retained probes; physical multi-process SQL/concurrency remains unqualified. |
| TC11 | Explicit export provenance corrections improve source behavior; finish producer/job/worker/storage composition inventory. |
| TC12 | Retain foreign-tenant denial controls and positive owner cases; qualify all six actual reader/download paths and storage effects. |
| TC13 | Selected admin conflict controls pass; complete privileged actor/request/target/store binding evidence. |
| TC14 | Isolated cache containment evidence retained; installed-browser upgrade, owner changes and delayed callbacks remain open. |
| TC15 | Gate 1 principal probe and denial now pass; qualify approval/revoke/rebind/transition authority and persisted race behavior. |
| TC16 | Placement/catalog selected evidence retained; complete five taxonomy caller contracts and remaining truth inventories. |
| TC17 | Canonical scoring-ID corrections pass selected examples; producer/persistence snapshots and historical representation compatibility remain qualification requirements. |
| TC18 | Recursive schema selected evidence retained; historical/quarantine and authoring/storage integration need full requirement mapping. |
| TC19 | Hash/principal controls are scoped evidence; certificate/evidence/approval runtime composition remains separately qualified. |
| TC20 | Downstream analytics progress retained; ingress needs actual handler evidence; durable events CHANGES_REQUESTED for L1-L3. Integration/adverse/closure requirements remain open. |

## Assignments and next frozen handoff

**Argon:** Continue the entire authorized TC01-TC20/FND01-FND30 assignment without asking
for routine reassignment. Address L1-L3 first using an exact source manifest covering
consumer/store adapter and actual worker call sites. Reconcile Gemini's two production
changes. Complete an end-to-end caller/producer audit and requirement-to-evidence mapping
for the remaining items above, identifying unimplemented code separately from execution
gates. Run developer checks, freeze the integrated production SHA, and hand off as
IMPLEMENTED_UNVERIFIED. Do not declare all implementation complete from residual probes.

**Gemini:** Make test/audit changes only. Independently verify the frozen production SHA,
all unchanged Sol denials, and additional storage-atomic completion/release races. Adapt
positive fixtures to the actual adapter contract. Test actual worker and ingress handlers,
not merely helpers. Report original GM01-GM20 meanings, requirement coverage, exact commands,
per-selection counts, logs and limitations; do not label unexecuted requirements VERIFIED.
If production repair is needed, return it to Argon and freeze a new source baseline.

**Sol:** Review the frozen integrated result and independent evidence, then issue scoped
acceptance or actionable corrections. Previously decided D1-D7 matters need not be requested
again. Escalate only a genuine new architecture conflict with concrete alternatives.

## W1-W3 and W4 disposition

W1-W3 closure and W4 entry are **NOT APPROVED**. Remaining source defects must be corrected;
FND01-FND30 and all nine acceptance groups need explicit evidence/disposition. Physical
database provenance/migrations/concurrency, queue delivery/crash effects, installed-browser
owner transitions, storage/export access, deployment/release, BROWSER-01 and RC-ID-01 remain
open unless the existing gate rules permit a specifically documented acceptance/deferral.
This review authorizes no physical execution, automatic push, main merge or deployment.
