# Tera critical implementation packet

Assigned by the owner through Sol on 2026-11-06. Assigned role Tera / Terra, critical
production implementer. Read W1_W3_Model_Routing_And_Handoff_Protocol.md first and declare
actual runtime identity if exposed, baseline, scope and next handoff. The host must select
the real model. This packet contains twenty actionable critical items TC01-TC20 and maps
to the complete FND01-FND30 assignment. Gemini owns independent testing. Sol owns final
architecture and acceptance. All earlier runtime/scope/migration gates remain binding.

Use the foundation directive for exact source roots. Produce exact allowed-file manifests,
reuse current implementation, preserve working edits and implement selected behavior.
The tests named below are Gemini's independent acceptance controls. Supply expected
invariants and run existing local diagnostics as needed, then freeze a review commit.
No production-critical changes are assigned to Sonnet by this packet.

### TC01 Reconcile the real critical baseline

Parent FND01/FND02/FND26. Capture actual HEAD, source/consumer graph and the Sol review
at e3e944f0. Identify every broken public signature, claimed approval and unsafe schema
default in the submitted ownership/people slice. Deliver exact correction manifests and
diagnostics. Acceptance requires Gemini can reproduce the same baseline and Sol approval
claims are corrected. Continue the twenty-item packet rather than stopping at the manifest.

### TC02 Enforce tenant validity at all public ownership entries

Parent FND03/FND06/FND18. Reject absent, empty, unknown or mismatched trusted tenant
at the service, isOwner and enforcement entry points. Dependencies are selected canonical
tenant vocabulary and actual caller tracing. Acceptance requires the missing-tenant
Sol assertions deny with no private effects and legitimate local-owner positives pass.

### TC03 Apply one policy to permission, ownership and summaries

Parent FND03/FND06. Remove unconditional tenant-admin cross-tenant grants and apply the
same selected boundary to canAccessResource and convenience helpers. Preserve explicitly
verified SHC-global capability only under its actual resource policy. Acceptance requires
ordinary tenant-admin/student foreign denial, access-summary denial and legitimate
same-tenant/approved global positives.

### TC04 Resolve projection/local identity explicitly

Parent FND03/FND05/FND18. Matching supplied shadow IDs cannot equate different local
subjects. Trace the trusted bridge mapping and use verified tenant/local ownership at
supported callers. Acceptance requires distinct local/original/projection controls,
missing/ambiguous mapping denial and no email-based merging.

### TC05 Migrate actual callers and repair imports

Parent FND03/FND18/FND24/FND26. Update supported profile GET/PATCH contexts from actual
verified actor and resource sources, import the existing guard error and resolve the
admission helper via a supported package export. Acceptance requires actual caller
composition and affected typechecks, without test-only aliases hiding runtime failures.

### TC06 Replace unsafe tenant schema attribution

Parent FND03/FND05/FND18. Remove blanket RTH default/backfill assumptions from the
proposed ownership changes. Deliver provenance-aware schema/key/producer/reader migration
and quarantine compatibility with mixed-version behavior. Acceptance requires explicit
unknown-provenance denial and Sol migration disposition. Physical application remains gated.

### TC07 Complete scoped people email identity

Parent FND11/FND18. Query normalized email within the authoritative target platform,
with deleted/ambiguity handling and legitimate independent same-email tenant accounts.
Enumerate consumers before changing constraints. Acceptance requires real query-predicate
tests, case/space/deleted cases and reviewed normalized partial uniqueness migration.

### TC08 Correct admission ownership and secure credential flow

Parent FND11/FND16. Prevent reuse of a foreign identity without globally banning equal
emails across platforms. Implement authorized secure admission/invitation compatibility
under its exact manifest; preserve legitimate local enrollment. Acceptance requires
foreign-only/both-platform/local-only/ambiguous and side-effect controls. Credential
values stay suppressed and physical account remediation needs separate authorization.

### TC09 Bind progress private persistence to tenant/local owner

Parent FND03/FND05/FND21. Propagate trusted identity through legacy and canonical real
callers, stores, state/event keys and predicates. Dependencies are reviewed schema and
legacy provenance. Acceptance requires equal local IDs remain isolated in both directions,
with legitimate read/write, canonical membership and historical replay preserved.

### TC10 Preserve concurrent progress and transaction outcomes

Parent FND05/FND21/FND25. Resolve lost completion updates with the selected atomic
merge/version/locking contract at actual repository calls. Acceptance requires distinct
concurrent completions survive, retry/rollback outcomes are consistent and Gemini labels
adapter versus physical SQL evidence. Schema/transaction policy changes need Sol disposition.

### TC11 Establish export producer and worker provenance

Parent FND03/FND04/FND23. Bind tenant/local owner across exam/job creation, dispatch,
worker retries, cache and storage references. Deliver exact historical-row and rollout
compatibility. Acceptance requires trusted source per stored field and no requester/
filename inference, with independently tested legitimate producers and denied unknowns.

### TC12 Secure every export private reader

Parent FND04/FND24. Verify provenance before status/recovery, URL creation, storage,
fetch and job/exam downloads. Acceptance requires all six retained foreign-tenant denials
pass in both directions, with legitimate owner/internal positives and zero unauthorized
private effects. Dependency is TC11's actual provenance chain.

### TC13 Complete resource-specific admin boundaries

Parent FND06/FND19. Implement the selected actor/request/target/store policy through
real guards and repository predicates. Acceptance requires conflicting context and
learner/wrong-audience rejection before reads, plus legitimate SHC and tenant-admin paths.
Ask Sol for a concrete classification only where the actual policy is still undefined.

### TC14 Secure private caches and client identity transitions

Parent FND07/FND14. Preserve provider lifecycle positives, prevent private service-worker
cache writes and stale reads, and isolate delayed responses/callbacks across authenticated
owner transitions. Acceptance requires mounted/remount, offline cache and queue/ack controls,
with browser persistence separately observed when authorized. Sonnet may change selected
display copy only, with no edits to the same production lifecycle files concurrently.

### TC15 Enforce verified audit actors and approval gates

Parent FND08/FND09/FND15/FND22. Bind actual backend audit actors to verified principal
and implement the selected persisted Gate 1 approval/permission contract. Acceptance
requires forged/missing/stale/wrong-workflow/unauthorized denial before writes, valid
approval and replay controls. Self-approval/product policy choices need Sol disposition.

### TC16 Finish authoritative identity, taxonomy and placement contracts

Parent FND13/FND18/FND19/FND24. Consolidate actual trust-boundary schemas/types and
consumers with historical adapters. Implement placement match:null for all uncalibrated
scores, explicit status and full DB-ordered jobs. Acceptance requires five taxonomy
entity routes/callers and actual placement helper-handler serialization/auth controls,
with source-backed null/zero semantics and no invented measurements.

### TC17 Correct assessment/question identity and scoring compatibility

Parent FND14/FND20. Trace supported option IDs/labels/text and historical answer encoding
through editor/bulk/API/service/scorer. Implement the Sol-selected unambiguous migration
and algorithm contract. Acceptance requires comma-containing option denial/credit behavior,
valid round-trip, malformed/duplicate input rejection and historical compatibility.
Do not silently change scoring policy to satisfy a fixture.

### TC18 Enforce canonical nested document and storage truth

Parent FND21/FND24. Build the historical shape/consumer matrix, then implement reviewed
recursive validation and preview-versus-persistence defaults. Acceptance requires retained
nested unknown/malformed and D1/I1 example-injection failures pass while supported legacy,
structural/versioned nested children and membership remain valid. Physical audit stays gated.

### TC19 Complete artifact and governance runtime contracts

Parent FND15/FND22. Preserve submitted hash validation/case compatibility and integrate
actual HTTP/service/evidence/approval callers. Acceptance requires valid and invalid hash,
wrong-workflow/actor/evidence controls and distinction between digest, signature and
approval. Sonnet owns only reference/unavailable presentation under these selected contracts.

### TC20 Complete event delivery, critical integration and review packet

Parent FND23-FND30. Implement selected producer/consumer type/tenant/event identity,
payload conflict and durable claim/commit/retry semantics under the reviewed worker
compatibility manifest. Resolve correlation and cross-brand dedupe without losing valid
old messages. Acceptance requires Gemini adverse/integration/quality evidence, retained
critical failures genuinely resolved and exact remaining physical gates. Submit reviewable
production commits and a complete critical-item ledger to Sol. Keep all thirty FND tasks
and group gates attributable; no self-closure or automatic main/deployment action.

## First handoff

Start with TC01-TC08 to repair the e3e944f0 CHANGES_REQUESTED ownership/people submission.
Notify the user when a stable critical slice is ready for Gemini using the central
protocol. Continue independent critical items while tests/review proceed in an isolated
checkout. Gemini sends production failures back to Tera. Sol alone assigns acceptance.
