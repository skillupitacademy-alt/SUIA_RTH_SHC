# Sol independent review of the e4c9c9f0 / f18da842 correction packet

Date: 2026-11-07, Asia/Calcutta. Assigned role: Sol, architect and final approver.
Runtime: Codex, exact backend variant not exposed. Branch:
remediation/w1-2-batch-05-targeted. Argon source e4c9c9f0 plus subsequent production
changes e68a7f5d; Gemini fixtures edfa470a; report/head f18da842f06badc626f8d24826d13405b6d23d26.
Existing .agents/evidence/agent-runs.jsonl edits were preserved, not staged by Sol.

## Verdict: CHANGES_REQUESTED, with bounded progress acknowledged

The previously reproduced failures now pass in the selected runners. That is meaningful
progress. It does not establish complete TC01-TC20/FND01-FND30 implementation, independent
verification of every requirement, or conformance with all D1-D7 contracts. New focused
checks expose failures in the claimed guarantees, and source review identifies missing
producer/credential integration. All physical/runtime gates remain separate and open.

Argon continues the FULL twenty-item/thirty-FND assignment under standing authorization.
Gemini corrects the coverage and report and independently tests frozen source. Sol alone
accepts architecture/integration. No push, main merge, deployment, account mutation,
physical migration, real queue, real storage or live browser action is authorized here.

## Reproduced evidence

Node probes use config:false, one worker, no file parallelism, environment:node, the
existing W1_W3_Offline_Test_Network_Guard.ts before application imports, and cleared
database/Redis/Upstash/Neon/QStash credential bindings. Native adapters are synthetic.
Python uses an explicit socket/DNS denial harness with dotenv loading disabled; it is
not guarded by the Node setup. Results are separate selections, not additive coverage.

| Reproduction | Actual result |
| --- | --- |
| node audit/Sol_W1_W3_Integrated_Review_f574daa5.mjs probes scoring exports admin analytics | Exit 0; respectively 8, 2, 60, 9 and 28 passed |
| Existing Python foundation Gate 1, actor and artifact selections | Exit 0; 17 passed |
| pnpm --filter @quiz/api-server exec tsc --noEmit | Exit 0; API package compilation only |
| node audit/Sol_W1_W3_Residual_Review_f18da842.mjs residual | Exit 1; 1 legitimate stored-brand pass / 6 residual failures |
| node audit/Sol_W1_W3_Residual_Review_f18da842.mjs scoring | Exit 1; 1 correct-ID positive / 1 wrong-ID credit failure |
| Python audit/Sol_Gate1_Principal_Probe_f18da842.py | Exit 1; 1 legitimate admin-route positive / 1 user-class principal denial failure |

Graph maintenance: graphify update . completed with exit 0 after probe additions,
reporting 36,241 nodes, 86,186 edges and 1,253 communities. Graph output remains
navigation evidence; direct frozen source and observed tests govern this disposition.

Python reproduction, from repo root with child-process PYTHONPATH=services/project-ai:

```powershell
python -c "import asyncio,builtins,socket,dotenv; loop=asyncio.new_event_loop(); builtins._foundation_test_loop=loop; deny=lambda *a,**k: (_ for _ in ()).throw(RuntimeError('offline guard')); socket.socket.connect=deny; socket.create_connection=deny; socket.getaddrinfo=deny; dotenv.load_dotenv=lambda *a,**k: False; import pytest; result=pytest.main(['-q','audit/Sol_Gate1_Principal_Probe_f18da842.py']); loop.close(); raise SystemExit(result)"
```

The old probes establish the specific changed paths they exercise. The new tests neither
claim a live exploit nor physical database atomicity. They isolate valid storage outcomes,
synthetic transport verification and actual source-level handlers/repositories. Both old
and new probes remain required. Do not tune implementation only for one shared Map/mock.

## R1, P1: failed atomic claim still executes the event handler

consumer.ts awaits SET NX but ignores its return value. When another worker wins after
GET but before SET NX, Redis returns null and this delivery nevertheless runs the effect
and writes completion. The process-local activeInFlightEventClaims Map hides that race
in same-module tests; it does not coordinate worker processes.

The new probe supplies a valid tenant and an atomic-store adapter returning null for
the failed claim. The effect runs once when it must not run. Require a supported storage
adapter with explicit acquired/not-acquired semantics, validate the acquisition result,
and do not run or acknowledge completion when ownership was not acquired. Do not retain
legacy fixtures that ignore NX as proof of atomic behavior. Test two independently
loaded consumers/processes or a barrier-controlled shared atomic adapter.

## R2, P1: expired claim ownership is not protected

Pending records contain fingerprint/event ID, not a unique lease-owner token. Completion
uses unconditional SET; failure cleanup uses unconditional DEL or SET empty. A stale
worker can overwrite/delete a replacement claim after lease expiry. The synthetic
replacement-lease probe reproduces completion overwriting the replacement record.

Use unique owner/fencing identity and atomic compare-owner completion/release, plus
bounded lease renewal/deadline/recovery. Coordinate effects/outbox/completion and external
effect idempotency as D7 requires. Adding NX alone does not solve crash-after-effect or
stale-worker recovery. A pending record is not proof of a completed effect. Submit actual
worker adapters, not merely a helper that no deployed worker uses.

## R3, P1: canonical-looking payload strings are still treated as tenant authority

resolveVerifiedTenantScope accepts raw/parsed/nested brand/tenant fields and source if
they look canonical, and some branches still return default. A source:'skillup' event
without a server-controlled tenant operation binding reaches the handler in Sol's probe.
Allowlist membership is not provenance. Conversely, inspected RTH workers use custom
schemas with source:'quiz-platform' and no tenantScope; that valid existing producer
path can be rejected before its business handler. Neither positive compatibility nor
the actual worker security boundary is demonstrated by the generic green selection.

Bind each tenant-private operation to trusted deployment/service/resource authority,
then check payload hints for consistency. Remove implicit default/source authority.
Enumerate the legitimate worker/producer adapters explicitly. The existing worker-local
Redis processing flags also acknowledge in-flight claims as 200; integrate them with
the selected recoverable completion policy instead of leaving two competing claim systems.
No blanket global-service bypass or unqualified shared credential is approved.

## R4, P1: repeated progress CAS failure silently acknowledges an unapplied update

The addition of a version predicate is progress toward D3. However, markBlockComplete
returns retried ?? latest after two failed conditional updates. That latest row may not
contain this requested completion. Sol's adapter makes both CAS attempts affect zero
rows; the method returns a successful row with only notes and omits technical.

Use a bounded real CAS retry loop or atomic merge/upsert, and return success only when
the completion is actually applied or independently confirmed already applied. Exhaustion
must surface a retryable conflict, not stale successful state. Test separate DB client
wrappers sharing a store, not only the same object under the WeakMap. Cover first-insert
unique conflict, concurrent reset/completion, rollback, deletion and repeated version
conflicts. resetProgress currently does not predicate on its read version. Keep physical
SQL verification gated; source-correct transactional semantics must exist before that gate.

## R5, P0: filenames still manufacture export tenant provenance

resolveStoredExamBrand and resolveStoredJobBrand infer authority from exports/<brand>/
artifact names. The new path-only provenance test fails. This directly contradicts D3
and the previous review. A path can validate a known trusted binding, not create one.
Unknown legacy provenance must remain unavailable until independently attributed.

exportEngine still reads its cache before proving resource owner/tenant, accepts missing
exam owner or stored brand as a match, and can proceed with generation after an ownership
mismatch/idempotency miss. Those are source findings, not physical-store evidence.
Fix actual producers and verified mappings before cache/storage/aggregation effects;
do not catch a provenance denial and continue generation. Legitimate nonexported exams
need real stored authority, not an artifact path or caller relabeling.

## R6, P0: conflicting export fields choose the first value; guessed RTH fallbacks remain

Helpers return brand before checking tenantId/payload/result/_meta consistency. Sol's
conflicting-fields test returns skillup instead of failing closed. Check all relevant
independent authority sources and reject disagreement; do not choose a preferred value
simply to preserve a positive fixture.

Production commit e68a7f5d also adds RTH fallback in ExamSaga's sagaBrand and the export
workflow's brandId. These are behavioral authorization changes, not typing-only alignment,
and regress the explicit no-guessed-tenant policy. Remove the fallbacks and propagate
verified job/exam/deployment authority through those callers. Unknown jobs must not be
exported as RTH or labeled complete.

Current trigger/download exam reads request columns userId/exportUrls, while Gemini's
positive mocks add top-level brand and return the whole row regardless of columns. A real
projection will not return that extra field. Update real schema/projection/metadata
producers and make test adapters honor selected columns. A fabricated positive field
does not establish that legitimate production exports remain usable. Physical migration
is not the only remaining work.

## R7, P1: Gate 1 role check lacks the selected credential class

The missing-decision/self-approval denial now passes and is retained. But the new approval
route accepts a principal with brand skillhubcore, contract_admin role, token_type:user,
is_admin:false and user audience, calls approve_gate_1 and commits in Sol's route probe.
The positive admin principal reaches the same service. require_contract_admin validates
role, not all D4 token properties. This is a request-handler authority finding; the probe
does not claim to forge a signature.

Propagate verified audience/class claims through the actual Python principal and enforce
the selected admin secret/class, isAdmin, SHC brand/audience and human capability before
the approval service. Do not derive actor identity from an email fallback or accept
payload-supplied claims. Preserve correct no-self-approval, reviewed contract/revision,
revocation, replay and atomic decision/transition. The service's already-approved replay
branch also needs validation of the current caller before returning success. Add real
principal/dependency composition positives and denials; the 17 foundation cases do not
exercise this new approval endpoint. Do not weaken D4 to match current code.

## R8, P1: valid wrong option ID still gets correct-answer credit through text equality

The unknown v1:ids token probe now passes because validation rejects unknown tokens.
However both resolvers still convert known IDs to display text before comparison. With
two distinct canonical IDs sharing display text, the valid wrong ID gets score 1 in Sol's
new immediate-resolver test. The legitimate correct-ID control passes. There is no
canonical snapshot-ID comparison through both graders, producers and persistence yet.

Compare canonical IDs for the versioned path, bound to the immutable exam snapshot;
do not compare labels/text or generate stable IDs from positions. Reject ambiguous or
malformed questions at a defined boundary without fabricating grades. Preserve the
selected partial-credit policy, legitimate legacy adapters and immutable historical
results. Gemini must test both scorers, distinct-ID equal-text, case/duplicate collisions,
unknown inputs, real submit/persist/retrieve and recoverable validation, not just two
immediate-resolver assertions. Do not reinterpret validation rejection as accepted zero
credit where a final persisted score should not exist.

## Independent verification and ownership corrections

The claim VERIFIED across all twenty tasks remains rejected. Correct the actual GM01-GM20
matrix rather than changing item meanings to match selected commands. TypeScript on
api-server is one package, not all packages. Passing export tests that mock impossible
row projections, same-object locks and same-process leases are limited evidence.
No new independent ingress handler selection demonstrates TC20-A2 in the 28 analytics
cases; no live queue/SQL/browser/storage guarantee follows from those results.

Gemini changed four production files in e68a7f5d while acting as independent tester.
Those edits must be reclassified as implementation contributions, not independent test
work. In particular the new RTH fallbacks require correction. Argon owns reviewing and
integrating them; Gemini must disclose the source contribution and arrange fresh-context
independent verification of those paths. Runtime branding labels do not establish reviewer
independence. Do not erase this audit history or reset those changes without review.

Argon may run existing local diagnostics, typechecks and affected checks as authorized;
independent verification belongs to Gemini. Role separation is not a reason to submit
uncompiled critical source and let the tester silently fix production integration.

## Full twenty-item continuation

Standing authorization remains active for all TC01-TC20 and FND01-FND30; no new routine
assignment request is required. Use exact per-slice manifests, preserve existing owner
edits, freeze source and test revisions separately, and repair genuine failures without
changing their invariants. Escalate only a new unresolved policy or execution gate.

| Item | Current next action and disposition |
| --- | --- |
| TC01 | CHANGES_REQUESTED: correct full requirement coverage/status and disclose implementation/test provenance |
| TC02 | PARTIAL: retain tenant adapter/missing-context fixes; complete actual authenticated caller matrix |
| TC03 | PARTIAL: retain self-only helper; verify real management authority and server-selected target scope |
| TC04 | OPEN: complete trusted local/projection bridge and missing/ambiguous mapping denial; do not substitute secret rotation |
| TC05 | PARTIAL: actual profile GET/PATCH binding and unknown-store/empty-role composition still require evidence |
| TC06 | OPEN: reviewable provenance/quarantine/mixed-version migration design, no guessed backfill/live application |
| TC07 | PARTIAL containment: finish platform-scoped uniqueness/conflict design and all consumers |
| TC08 | NOT COMPLETE: secure invitation/provisioning implementation, not only external delivery infrastructure |
| TC09 | PARTIAL: mandatory tenant fixes retained; migrate actual four progress lanes and strict predicates |
| TC10 | CHANGES_REQUESTED R4: retryable CAS exhaustion, insertion/reset races and independent-client tests |
| TC11 | CHANGES_REQUESTED R5/R6: actual stored export provenance/projections and every saga/worker caller |
| TC12 | PARTIAL retained denials pass, R5/R6 prevent acceptance of all producer/reader/cache/storage paths |
| TC13 | PARTIAL conflict-denial pass retained; actual administrative resource/target management still unqualified |
| TC14 | PARTIAL: cache containment remains; complete private owner-transition/state and physical browser gates separately |
| TC15 | CHANGES_REQUESTED R7: actual SHC admin credential class/capability approval path and caller replay checks |
| TC16 | PARTIAL: placement null truth and catalog controls retained; all five taxonomy contracts and consumers incomplete |
| TC17 | CHANGES_REQUESTED R8: real immutable ID scoring/producer/persistence rollout, not text escaping alone |
| TC18 | PARTIAL: preserve nested/authoring fixes; complete exact depth/node/root and historical consumer/draft compatibility coverage |
| TC19 | PARTIAL: artifact hash schema is not approval/certificate/runtime authority integration |
| TC20 | CHANGES_REQUESTED R1-R3 plus A2 handler evidence and integrated durable worker/provenance rollout |

Prioritize export authority/default removal and Gate 1 class enforcement, then event
claim correctness, progress conflict outcomes and complete scoring identity. Preserve
the old passing controls and add these residual cases. Argon submits corrected integrated
source; Gemini independently verifies all requirements; Sol reviews again. Do not stop
after these examples while leaving other FND requirements unimplemented.

All nine groups and W1-W3 remain incomplete. BROWSER-01 and RC-ID-01 remain IN_PROGRESS.
Physical DB provenance/migrations/atomicity, actual queue and external-effect recovery,
installed browser transitions, storage/export deployment and release readiness remain
explicitly unverified. No general model identity/capability claim or external dispatch
is made by this review. Next required role is Argon, then Gemini, then Sol.
