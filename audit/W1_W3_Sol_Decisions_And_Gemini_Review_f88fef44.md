# Sol review and implementation decisions at f88fef44

Date: 2026-11-06. Assigned project role: Sol, principal architecture and independent
acceptance. Runtime: Codex, exact backend variant not exposed in this session.
Branch: remediation/w1-2-batch-05-targeted. Reviewed production revision:
6d0217df175ee71a80b6a189f499d3d479fc6b86. Independent test/report revision:
f88fef44e6840405797f370b1634ff4dd0838e10. Starting working tree was clean.

Verdict: PARTIAL ACCEPTANCE OF SPECIFIED OFFLINE CONTAINMENT; CHANGES_REQUESTED for
the critical packet as a whole. No FND task, group, W1-W3 or runtime gate is closed.
This document selects the policies requested by Tera/Gemini. It authorizes bounded
implementation under TC01-TC20, not execution of migrations, live services or deployments.

## Independently reproduced evidence

The audit runner Sol_W1_W3_Checkpoint_f88fef44.mjs uses config:false, one worker,
the existing offline network guard before application imports, and clears database,
Redis, Upstash, Neon and QStash bindings. It reads only tracked app tsconfig path maps
for source resolution. This is an isolated source runner, not a deployed package test.

| Command from repository root | Observed result | Scope |
| --- | --- | --- |
| node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary | Exit 1; six files, 60 passed / 1 failed | Ownership/guard 27, admission/normalization 25, RTH worker 4, SkillUp worker 4 passed / 1 failed |
| node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs placement nested analytics | Exit 1; separate selections below | Do not interpret the combined exit as every selection failing |
| placement selection | Three files, 21 passed / 3 failed | Helpers 13, route suite 8 passed / 3 failed. The two placement route cases pass, giving 15 placement-specific passes |
| nested selection | Two files, 18 passed / 5 failed | Four malformed-child denials fail, plus D1 example-injection denial |
| analytics selection | One file, 3 passed / 0 failed | Accepted HTTP response, rejected transport and HTTP 503 propagation |
| pnpm --filter @quiz/api-server exec tsc --noEmit | Exit 1, two TS2739 errors | Profile route ownership contexts at lines 144 and 304 lack requestingTenant/resourceTenant |

Initial diagnostic attempts were stopped after the piped Node invocations produced no
usable result. Initial alias configurations separately failed to collect a route and a
storage suite. Neither attempt counts as a security failure or a pass. The committed
runner derives ordered aliases from the app configs and reproduces the collected results
above. No test expectations or application files were changed by Sol.

Accepted only within the demonstrated boundary:

- Public ownership helper tenant mismatch/missing-context denials and linked guard controls.
  Their passes do not establish same-tenant private-profile authorization; D1 below applies.
- Existing-account SkillUp admission containment with the real normalized-email export and
  predicate-discriminating isolated adapter. This does not complete new-account admission,
  invitation delivery, normalized uniqueness or database concurrency.
- RTH private tutorial Cache API bypass and tested SkillUp private navigation/static behavior.
  These are handler simulations, not installed browser worker/upgrade observations.
- Placement nullable truth behavior and selected mocked helper-to-handler auth/serialization.
  The filename placement-http-truth.test.ts does not make helper tests physical HTTP evidence.
- Removal of guessed schema defaults and deliberate SQL execution blockers is source-level
  containment. The blocked migrations are not runnable, accepted migration implementations.

## D1. Private profile ownership and explicit tenant provenance

Applies to TC02-TC05, TC13, FND03/06/18/24 and GM03/04.

PROFILE_READ and PROFILE_WRITE describe self-profile access in an ownership API. An ordinary
student permission must not grant a different local subject's private profile. All ownership
entry points and summaries must enforce the same policy. Existing permission-only routes for
other resources are not globally rewritten. Faculty exam grading still needs its own assigned
resource policy, rather than being inferred secure from a generic role positive.

Privileged profile management belongs to an explicit management route/service with verified
administrative authority, target tenant, target subject and repository predicate. A role name,
client flag or newly supplied allowOverride boolean is not sufficient. The self-profile route
has no arbitrary target override. Keep a legitimate management positive through the actual
privileged boundary, not a blanket admin bypass in a private-profile helper.

A verified learner with roles: [] still has self-profile access when tenant/local ownership
is proved. Do not manufacture a student role or use createRBACUser's nonempty-role requirement
to deny that authenticated self path. Authentication/self-profile access confers no course,
exam or administrative entitlement. Include that legitimate positive independently.

Remove createRBACUser's auth.brand || 'realtutorialhub' fallback. Reject missing/unknown brands
before constructing an authorized user. Preserve supported verified SHC callers explicitly.
Do not equate local and shadow IDs merely to fill required properties.

For profile GET/PATCH, resolve the verified tenant to a trusted server-controlled binding and
use both that binding's database and its matching tables. The current getAuthBrandContext
already exposes db and tables, while the route can choose a shared fallback under
shouldUseBrandBinding() and uses imported default table objects. A test-mode generic database
is not tenant provenance. Supply explicit isolated tenant adapters in tests; do not change all
other auth services' test binding behavior incidentally.

For a physically segregated binding, provenance is the trusted store mapping plus exact local
subject predicate. For a shared store, require independently stored tenant/local ownership.
Copying the request brand into resourceTenant proves neither. Unknown provenance denies before
private reads/writes. Do not query a fallback store after a miss. Preserve a legitimate self
404/creation contract only inside the established tenant binding. An SHC/default-store profile
path needs its own explicit proof and positive; it cannot inherit learner tenant attribution.

Gemini must exercise real GET/PATCH, same-tenant different users, foreign equal IDs, missing
brand/provenance, binding/table mismatch, sanctioned management and zero unauthorized effects.
Both package and API typechecks must pass. Passing helpers alone cannot close TC05.

## D2. Catalog and worker caching

Applies to TC14/16 and GM10/13. Select network-only HTML/navigation, RSC and API responses for
SkillUp, including /programs and /api/programs. Keep catalog/faculty authentication and brand
validation. Public URL classification is not proof that a response is user-independent.
Future anonymous catalog caching would require a separately reviewed public response contract.

Gemini is authorized to replace the obsolete /programs cache-positive assertion with online
network forwarding, no cache read/write, and offline 503 despite a seeded stale entry. Retain
the valid same-origin immutable /_next/static asset cache positive. Supply real Request/auth
context for catalog/faculty success fixtures and add missing-auth 401/foreign-brand 403 with
zero data calls. Do not remove authentication or accept 500 to make those tests pass.

Tera must also address upgrade residue. The current SkillUp worker still uses the old
skillup-app-shell-v1 cache and can fall back to its /offline entry while fetching static
assets. Move to an assets-only namespace, remove that HTML fallback, and delete only the known
worker-owned legacy cache during activation. Inventory RTH's prior cache names before any
similar cleanup. Never delete unrelated origin caches or user data. Test static content type,
same-origin scope, stale residue and worker lifecycle; installed browser upgrade remains open.

## D3. Tenant persistence, progress, exports and admin context

Applies to TC06/09-TC13 and GM05/07-GM09. The authoritative private owner is the tuple of
verified canonical tenant and local subject. Projection IDs and equal email are not substitutes.
Every producer, worker payload, retry record, repository key, lookup, storage reference and
private reader must carry or independently resolve that same authority.

Use explicit tenant-scoped stores with trusted mappings or shared rows with tenant-qualified
keys and predicates. A request brand, filename, path, local-ID equality, platforms array or
nullable new column cannot backfill historical ownership. Unknown rows remain quarantined and
unreadable until independently attributed. Never relabel old data wholesale as RTH.

Tera may implement the provenance chain and prepare expand/backfill/constraint/reader rollout
migrations with mixed-version denial. Submit the exact migration and rollback manifest for Sol
review before any physical execution. Retain original blocked migrations as historical safety
evidence or replace them only within that reviewed migration plan. No live backfill is authorized.

All six retained export tenant denials remain required, not merely the two-download subset.
Check ownership before dispatch, recovery, Redis, URL signing, storage and file fetch. Trusted
internal credentials still need a bounded tenant/job operation; they do not imply global access.
Bind worker messages to stored authority, not a requester-supplied tuple alone. Check conflicting
admin actor/request/target/store tenant context before reads, preserving explicit legitimate
SHC management operations and tenant-admin positives.

Select database-atomic progress merge/upsert or optimistic compare-and-swap at the actual
repository transaction, keyed by tenant/local subject/canonical document/block/version. Do not
use read-modify-write replacement or a process mutex as the distributed guarantee. Preserve
distinct completions, exact replay and rollback semantics. Serialized map fixtures remain
adapter evidence. Keep legacy section progress, canonical block progress, telemetry and browser
state as separate evidence lanes. No legacy feature development is added.

## D4. Persisted Gate 1 authority

Applies to TC15/19 and GM11/18. Gate 1 is the explicit human decision authorizing GUI_APPROVED,
distinct from the later implementation/artifact approval. Client auto-transition and a generic
transition body/evidenceId are not authority.

Use the existing contract_admin capability or an explicit human super_admin role, together with
a verified SHC admin credential (brand skillhubcore, admin token class, isAdmin true and
shc-admin audience). Preserve verified claims through the Python principal type rather than
accepting them from JSON. The existing is_super_admin helper also accepts infrastructure portal
identity; that shortcut alone must not authorize this human decision. Learners, tenant admins,
service/infrastructure identities without the human role and missing claims are denied.

Select no self-approval: verified approver must differ from the trusted recorded requester.
Persist an immutable decision bound to workflow ID, reviewed content/contract revision or hash,
verified actor, decision time and approval status/revocation. If a prototype artifact is part
of the reviewed input, bind its real identity/hash too. Do not manufacture evidence for an
absent artifact. New revisions invalidate the old decision. No arbitrary wall-clock expiry
is introduced as a substitute for revision binding.

The approval and conditional state transition must commit atomically. Every transition path,
including internal service callers, must require the persisted matching decision before
GUI_APPROVED. Exact authorized replay is idempotent; stale revision, self-approval, revoked,
forged or wrong-workflow decisions deny without writes. Remove automatic approval from
ensureCandidateRequested and expose the explicit review action with unavailable/denied states.
Keep later implementation approval independently enforced. Prepare schema changes offline only.

## D5. Question identity and historical scoring

Applies to TC17 and GM17. Select explicit versioned option-ID answer encoding for new canonical
submissions, with unique stable IDs bound to the immutable exam question snapshot/version and
an array of selected IDs. Labels and option text are display values. No comma-separated text
round-trip in either immediate or batch scoring. Reject duplicate/unknown IDs and malformed or
conflicting representations before score/persistence effects. Do not derive stable identity
from a mutable display position.

Preserve the existing partial-credit formula, penalty and bounds on normalized ID sets. This
changes ambiguous representation, not grading policy. The comma-containing correct-option
control must award the real correct selection and deny a different option matching a text
fragment. Both scorers, editor, bulk/API and retrieval must share the selected contract.

Historical finalized results remain immutable. Use an explicit legacy adapter only when the
stored question snapshot and answer have a unique interpretation. Do not guess ambiguous text,
labels or comma splits, silently rescore historical results, or award invented zero/partial
credit. Preserve ambiguous historical records with a needs-review disposition. An active
ambiguous submission must receive a recoverable validation result and retain the user's
selection until a supported encoding is available. Inventory active callers before enabling
new writes; preserve compatible old callers through versioned ingress, not silent format change.
Physical history migration/regrading is not authorized.

## D6. Nested canonical documents and authoring truth

Applies to TC18, FND21 and GM18. Bind every container child position recursively to the canonical
supported block union, replacing the z.any escape. Preserve supported schema-v1 legacy and
explicit versioned shapes. A C1 block missing its required version must not be reinterpreted
as valid legacy code. Validate identity, structure, family/version and duplicate IDs across
the whole document. Do not silently drop unknown children or coerce them to paragraphs.

Preserve the existing 500-root-block limit, including a 500-root document with a nested child.
Use MAX_NESTING_DEPTH=3 with root depth 0, detect in-memory cycles, and add a separate bounded
total-node guard of 10,000 for traversal. Test each boundary and all container positions before
changing callers. That total-node guard is distinct from the root-array limit. Previously
stored over-budget/unsupported documents require explicit read-only unsupported/quarantine
handling; no automatic truncation, deletion, publication or rewrite.

New published/storage writes must validate authored canonical content. Example educational
claims belong only in explicitly labeled preview/sample data. Preparing D1/I1 for persistence
must not fill missing authored material from examples. Preserve valid supplied content and
metadata. Show validation errors without losing unsaved editor work. If a supported draft
contract permits sparse content, preserve it losslessly as a draft; never imply publication
or invent a draft flag accepted by downstream readers without tracing that contract.

Historical read adapters must be explicit and versioned. Valid supported records continue to
render; malformed/unknown records show an actionable unavailable/quarantine state instead of
being saved in normalized form. Inventory import/composer/delivery/membership consumers and
test them. Real historical database audit and migration remain unexecuted and gated.

## D7. Events, retry and analytics deduplication

Applies to TC20 and GM19. Enforce parsed envelope type equals registered handler type even
when a custom schema is supplied. Inventory actual worker registrations and correct producer/
schema mismatches with explicit version adapters. Signature verification is necessary but does
not alone prove tenant authority for an arbitrary payload.

Select at-least-once delivery with idempotent effects and durable processing state. Identity
is verified tenant plus event ID plus consumer/operation version. correlationId is tracing,
not event uniqueness. Include a canonical immutable payload fingerprint. Same identity with
different payload is a conflict, not an acknowledged duplicate. A completed exact retry is
acknowledged without another effect. Reject missing/unknown tenant before tenant-private effects.

Reject the proposed get-then-set or marker-after-success shortcut as a distributed atomicity
solution. Use atomic claim/lease and durable completed state. Pending/failed/crashed processing
must remain retryable under a bounded recovery policy, never be treated as completed. Bind
transactional DB effects and completion through the same transaction/outbox where possible.
External side effects require their own idempotency token/reconciliation. Lease duration must
be configured against a bounded handler deadline; inventory existing deadlines/retry budgets
and submit the exact rollout values before deploying. Do not claim exactly-once delivery.

Old correlation-only markers cannot be migrated by guessing which events completed. Inventory
old traffic and apply a versioned replay/reconciliation policy. No live replay is authorized.
For analytics, include the authoritative server-selected brand in dedupe identity, preserving
the existing anonymous/session boundary. Do not trust a client-selected brand to cross tenants.
The HTTP-503 provider correction is already passing in isolation and must not be reimplemented.

## Twenty-item continuation and role ownership

Tera retains the full TC01-TC20 packet, not a new two-task assignment. Before each slice,
declare actual baseline and exact allowed production paths, reuse existing fixes, then
freeze a reviewable commit. Separate migrations/design from runtime execution.

| Item | Concrete next action / required evidence |
| --- | --- |
| TC01 | Reconcile current baseline and all twenty dispositions against this review; retain all thirty FND/group links |
| TC02 | Remove adapter tenant fallback and test canonical/missing/unknown brand handling through supported callers |
| TC03 | Implement D1 self-profile policy consistently across helpers/summaries; preserve distinct management authority |
| TC04 | Trace local/projection bridge and reject equality-by-shadow/email without trusted mapping |
| TC05 | Repair real GET/PATCH store/table provenance and both TS2739 errors, with handler composition |
| TC06 | Prepare provenance-aware migration/quarantine and mixed-version reader rollout; no live execution |
| TC07 | Complete scoped normalized people identity, deleted/duplicate handling and uniqueness design |
| TC08 | Keep local admission containment; design secure expiring invitation/provisioning, no fixed credential or cross-tenant reuse |
| TC09 | Implement tenant/local progress persistence through all four separately classified lanes |
| TC10 | Implement D3 atomic completion/replay transaction contract and distinguish adapter from SQL evidence |
| TC11 | Bind export producer/job/worker/cache/storage provenance including historical unknowns |
| TC12 | Resolve every export reader denial with zero unauthorized effects and legitimate owner/internal positives |
| TC13 | Resolve conflicting actor/request/target/store context before privileged queries |
| TC14 | Apply D2 worker upgrade cleanup and retained mounted owner-transition protections |
| TC15 | Implement D4 verified actor and persisted human Gate 1 path at every transition entry |
| TC16 | Preserve placement null-for-uncalibrated contract; finish all five taxonomy caller contracts |
| TC17 | Implement D5 versioned answer identity across both scorers and actual consumers |
| TC18 | Implement D6 recursive validation and preview/storage separation with historical adapters |
| TC19 | Compose artifact hash HTTP/service/approval provenance without equating digest to approval/signature |
| TC20 | Implement D7 events, integrate affected gates and submit the complete FND/group closure evidence |

First priorities are TC02/03/05 and TC14 because the decisions are now explicit and the
API build remains red. Continue independent TC15/17/18/20 work in disjoint files while
Gemini tests frozen slices. Same-file edits, shared-contract consumers and migrations
must be integrated sequentially. Do not launch overlapping writers in this working tree.

Next required model: Tera for the selected production corrections under its existing packet.
Gemini then owns independent GM01-GM20 verification on a frozen source commit. It may update
the obsolete cache/catalog fixtures only under D2, add D1/D4-D7 adverse controls, and must
retain every genuine security denial until corrected. Sonnet continues assigned noncritical
inventory/presentation work, with no critical ownership changes. Sol retains acceptance.

## Report corrections and remaining gates

The Gemini assignment remains authoritative for GM IDs: GM07 is exports, GM08 progress,
GM09 concurrency. Its report disposition matrix transposed those scopes. Do not create
new IDs or infer completed execution from historical test names/counts.

The report's GM19 marketing HTTP-503 failure is stale: Sol reproduced 3/3 provider passes.
Event type/retry/correlation/brand-dedupe defects remain separate and open. Historical
GM11/14/16/17 counts were not all rerun here and remain attributed historical evidence.
The 181 caller and 177 finding claims are unaccepted inventories pending enumeration,
deduplication and source verification, not settled exhaustive totals.

No physical database migration, SQL concurrency, queue/worker delivery, storage fetch,
installed service-worker upgrade, browser identity transition or deployment was executed.
All physical readiness gates, Batch 08, BROWSER-01 and RC-ID-01 remain IN_PROGRESS.
No remote push, main merge or implementation self-acceptance is authorized by this review.
