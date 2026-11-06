# Sol architectural resume and critical ownership checkpoint

Issued 2026-11-06. Assigned role: Sol, principal architect and final approver. Runtime:
Codex; the exact backend model variant is not exposed to this session. Owner instruction
now replaces Tera/Terra with Argon for critical implementation. This supersedes the
temporary role split, not the D1-D7 architecture or independent acceptance requirements.

## Baseline, governance and workspace reconciliation

Actual local and independently queried remote branch remediation/w1-2-batch-05-targeted
both resolve to 2ca1889b430fed5e67379dcf264a968769b0f770. Remote was checked using
git ls-remote origin refs/heads/remediation/w1-2-batch-05-targeted. Main checkout started
clean. TC20-A's eight file blobs match isolated Argon revision 68496546; git diff between
those revisions under packages/marketing-site/src/lib is empty. This proves source
equivalence, not security acceptance. The eight include an implementer diagnostic test.

Registered worktrees were inspected, not reset or merged:

- Main remediation checkout at 2ca1889b, clean at review start.
- .worktrees/argon-tc20a at 68496546, clean. It is behind the integration branch; do not
  resume changes from it without explicitly reconciling the new source and manifests.
- .worktrees/remediation-patch-blocks-schema at 4350b14a reports 8,589 porcelain entries,
  including extensive deleted/untracked content. Ownership and intent are unverified.
  Leave it untouched and do not use it as a clean TC18 implementation baseline.
- Two detached verification worktrees remain registered, one locked. They were not
  authorized as writers or cleaned. One older temporary build worktree is prunable;
  no pruning was performed.

No evidence establishes that a running external Tera session has stopped. The owner must
direct any such session to freeze its edits. Argon must inspect status/ownership before
writing; a role assignment does not interrupt another host. Use a new isolated clean
worktree based on this checkpoint's committed revision for new implementation. Never
reset another workflow, reuse a dirty checkout or merge competing writers automatically.

The delegated Sol decision in Sol_Argon_Temporary_Delegation_TC20A_385976ad.md at 8f090903
is ratified for its bounded TC20-A implementation. D1-D7 remain controlling. The prior
advisory tooling review is assessed below, not adopted as independent acceptance.

The TC20-A source has been published despite the delegation's explicit no-push rule.
This is a recorded process deviation. Git author identity does not establish who initiated
the push, and the initiating actor is not inferred. Do not rewrite history or revert the
implementation merely for publication. Treat the remote snapshot as frozen, unaccepted
source. Argon must record the publication/deviation in its next handoff, use explicit-path
staging and local review commits, and perform no further push without owner authorization.
Remediation-branch publication is not main merge, release approval or deployment authority.

## P0. TC20-A amendment decision: APPROVED

Argon may extend the production manifest by exactly one file:
packages/marketing-site/src/lib/analytics/tracker.ts.

In AnalyticsTracker.trackEvent, pass the already constructed baseContext.brandId into
the existing resolveIdentity and updateSession object arguments. Preserve their current
anonymous/session identity, timing, event classification and error behavior. Do not add
a default brand, derive authority from partialContext, relax validation, redesign tracker
dedupe or expand this into ingress authority work. Original eight files are frozen
read-only during this caller repair; any additional production repair needs a new manifest.

Gemini may update legitimate positive calls in
packages/marketing-site/src/lib/analytics/__tests__/marketing-phase2.test.ts to include
a valid explicit brand on identity and both session-update inputs. Keep all original
positive assertions and missing/unknown-brand zero-mutation negatives. Do not change
brand-dedupe-control.test.ts. The real tracker-provider-http test must pass through the
corrected caller, not through a new mock hiding the failure.

Sol independently ran a config:false, one-worker, no-file-parallelism Node Vitest selection
over analytics/__tests__/ and analytics/providers/__tests__/, using the existing
W1_W3_Offline_Test_Network_Guard.ts before application imports and clearing environment
names matching DATABASE|DIRECT_URL|REDIS|UPSTASH|NEON|QSTASH. Result: seven files,
12 passed / 3 failed, exit 1. Failures were exactly the two phase-2 missing-brand calls
and tracker-provider-http's real tracker path, all invalid_analytics_brand.
pnpm --filter @quiz/marketing-site exec tsc --noEmit independently exited 0.
The typecheck does not find these runtime failures because legacy overloads still accept
unscoped arguments. Do not equate signature acceptance to correct runtime integration.

Required next frozen evidence: complete marketing-site typecheck and guarded analytics
selection, unchanged FAIL-04, same-brand session/score/funnel/identity continuity,
cross-brand identity/journey/attribution/features separation, aggregate getter scoping,
missing/unknown brand denial before mutations, and real tracker provider failure/acceptance.
Gemini must report source and test revisions separately. Diagnostic evidence is not
independent simply because it passes. No TC20-A acceptance is issued by this amendment.

TC20-A2 ingress authority and TC20-B event delivery remain separate. The partialContext
merge and any mismatched browser baseContext/event context must be inventoried under A2;
do not silently change them in this two-call amendment.

## P2. Tooling disposition: PARTIAL_ACCEPTANCE

Reviewed Argon aa33e494, Sonnet 11ced9c1, Gemini corrected fixture/report revision 1adb10d0,
the advisory review at 385976ad, current source/config/test files and report wording.

OPT01-OPT05 may be used optionally for advisory navigation with full-source fallback.
This is not unrestricted tooling security acceptance. Existing tests/evidence support
usefulness but do not establish every VAL01-VAL12 guarantee. DOC01-DOC03 exist but total
about 86 KB and retain verbose/stale claims; presence alone does not satisfy the requested
concise guide structure. Sonnet must update only its three guides after the conditions below.
No AGENTS.md/CLAUDE.md edits or mandatory adoption are authorized.

| Condition | Current finding and required correction | Owner |
| --- | --- | --- |
| C1 | NOT SATISFIED. The report still broadly claims offline enforcement, describes header hashes as byte-level chunk integrity and omits the native Graphify subprocess limitation in key claims. Scope Node preload evidence to the guarded Node process/direct sockets, record unguarded native subprocesses and suite setup, and distinguish revision-pinned byte/heuristic estimates from measured model tokens. | Gemini report; Sonnet mirrors bounded wording |
| C2 | NOT SATISFIED. VAL04/05/12 and supplemental controls read shared .context-packets artifacts generated by earlier cases. No describe.sequential declaration or independent unique artifact setup fixes that dependency. Prefer each case generating its own isolated fixture/output, with individual filtered runs from empty dirs. Explicit sequential classification may preserve only a full-suite result, not individual reproducibility. | Gemini test files only |
| C3 | Required for any new comparative savings claim, optional for advisory retrieval. Freeze baseline source/file hashes or snapshot and count the same coverage plus discovery/manifest overhead actually loaded. A GRAPH_REPORT-heavy conventional recipe is a modeling choice, not observed normal usage. No stable 47% subscription/token-saving claim is accepted. | Argon tooling manifest/benchmark; Gemini checks |
| C4 | MANDATORY, remains in force. Every packet is advisory, even if its manifest says auditSafeForSecuritySignOff or COMPLETE_VERIFIED. Review current full source, all relevant decisions and independent FND evidence. A packet cannot close a security task. | All roles |

SUPP-05's existing test checks file coverage and hash headers; that does not compare actual
rendered bodies. The advisory review separately reports a 30/30 normalized-body probe.
Sol reran a fresh unique-output chunk-body probe; the observed outcome is recorded in the
review execution note below. Normalizing CRLF/trailing newlines is content-level
evidence, not raw byte identity. Keep that supplemental evidence separate from VAL suite
assertions. Do not change the hardcoded 214849 byte assertion to another moving magic number;
derive a revision-specific expected value or verify content/coverage rather than current size.

Sol supplemental execution note: a fresh Node subprocess under the tooling socket-denial
preload generated a full packet with --max-bytes 32768 into the unique ignored directory
.context-packets/sol-resume-integrity-keaITA. Expected fail-closed CLI exit was 1. Nine
chunks covered 30 files; stripping rendered line numbers and comparing normalized body
SHA-256 values to disk gave 30/30 matches, zero mismatches. Native Graphify was not executed.
This probe did not run the dependent VAL suite and does not satisfy C1 or C2.

Gemini is assigned C1/C2 and reproducible independent tooling evidence without delaying
critical testing. Argon prioritizes critical production over optional C3 implementation.
Sonnet owns docs/ai-context/operating-guide.md, fnd-checkpoint-template.md and
task-retrieval-guide.md only. Sol will review corrected conditions before expanding use.

## Current critical ownership and exclusive boundaries

Argon is sole critical implementation owner for TC01-TC20, including TC20-B, and the
critical portions of FND01-FND30. Tera has no continuing write assignment after this
owner-directed transfer. Historical Tera filenames and commit attribution remain intact.
The active packet is Argon_W1_W3_Critical_Implementation_Assignment.md, containing all
twenty inherited items; this checkpoint selects current priority and file ownership.

| Role / active work | Exclusive editable scope now | Frozen/read-only and next gate |
| --- | --- | --- |
| Argon, TC20-A integration | tracker.ts only in production; scoped implementer handoff audit/Argon_W1_W3_Critical_Handoff.md | Original eight source/diagnostic files and Gemini controls frozen; submit local source SHA |
| Gemini, TC20-A testing | marketing-phase2.test.ts approved positive fixture edits; independent new tests under analytics/__tests__/gemini-tc20a-*.test.ts and audit/Gemini_TC20A_Independent_Review.md | brand-dedupe-control.test.ts unchanged; no production edits; test frozen corrected source |
| Gemini, existing GM01-GM20 | Existing independent acceptance files under their packet, excluding concurrent source writers | D1 obsolete admin positives may become self-only denial controls; require separate real management positives and preserve foreign denials |
| Gemini, tooling C1/C2 | tests/tooling/ai-context/** and audit/Gemini_Context_Optimization_Validation.md | No tools/ai-context/** implementation edits |
| Sonnet, noncritical | Existing SN packet and the three tooling docs, only in disjoint paths | No analytics/auth/scoring/document/event production edits or central ledger rewrite |
| Sol | Central decision, routing, assignment and plan documents | Final review/acceptance and next slice manifests |

Argon may read/inventory all next critical slices now. Production writes after TC20-A
must use a fresh exact manifest and sequential source integration. No second Argon worker
edits overlapping files just because both carry the same role. Separate read-only discovery
from write leases. Shared contracts, schemas, consumer migrations and lockfiles serialize.

Next delegation order: finish/freeze TC20-A; Gemini tests it while Argon inventories A2.
Prioritize TC20-A2 (client header/body brand selection and unknown-host fallback) for the
next manifest decision because downstream isolation alone cannot prevent intentional brand
spoofing. Inventory both real ingress paths, proxy trust and configured host bindings.
No production A2 edit is approved yet. TC18 and TC17 follow their D6/D5 inventories with
explicit allowed files and compatibility evidence. Their architecture is selected, but
this handoff does not approve an unenumerated implementation manifest. TC20-B stays Argon
owned under D7 with coordinated actual worker registration/producer inventory.

## TC01-TC20 disposition at this checkpoint

These are scope dispositions, not new claims that all historical suites were rerun.
Reported evidence is attributed to the latest Gemini/Tera handoffs unless explicitly
identified as the independent Sol rerun above. Every item remains open overall.

| Item | Current disposition | Next Argon action / independent gate |
| --- | --- | --- |
| TC01 | PARTIAL; current source/worktrees and transfer reconciled | Reconcile full twenty-row ledger and all thirty FND links at the next frozen source |
| TC02 | IMPLEMENTED, PENDING VERIFICATION across all supported callers | Verify canonical-brand adapter rejection and empty-role self path; do not restore RTH fallback |
| TC03 | CHANGES_REQUESTED for complete management policy; self-only D1 source reported | Gemini reconciles two obsolete admin positives; Argon supplies legitimate explicit management boundary |
| TC04 | PARTIAL / trusted mapping unqualified | Prove local/original/projection bridge; reject shadow/email equality as authority |
| TC05 | IMPLEMENTED, PENDING full composition acceptance | API/auth typechecks reported repaired; independently test both real profile GET/PATCH bindings, empty roles and zero-effects denial |
| TC06 | ACCEPTED only as prior source containment; migration/provenance rollout BLOCKED | Prepare actual expand/backfill/quarantine/constraint design; never apply blocked guessed migrations |
| TC07 | ACCEPTED within isolated normalized local lookup; uniqueness/concurrency incomplete | Complete reviewed platform-scoped uniqueness and all consumers |
| TC08 | ACCEPTED local-account containment only; provisioning NOT IMPLEMENTED | Secure invitation/new-account flow, conflict handling; no fixed credentials or foreign account binding |
| TC09 | NOT COMPLETE; private tenant persistence unresolved | Propagate trusted tenant/local ownership across four separately classified progress lanes |
| TC10 | NOT COMPLETE; physical SQL/concurrency unqualified | Database-atomic merge/CAS/transaction contract; no map fixture as distributed guarantee |
| TC11 | NOT COMPLETE; export producer/worker provenance unresolved | Trace stored owner/tenant through dispatch, retry, cache and storage |
| TC12 | CHANGES_REQUESTED; retained foreign export denials open | All six denials plus valid owner/internal operations, before effects |
| TC13 | CHANGES_REQUESTED; privileged target/context proof open | Resolve actor/request/target/store conflict and scoped management controls |
| TC14 | ACCEPTED only for reported isolated cache containment | Browser installation/upgrade, owner epochs and delayed-state evidence remain open |
| TC15 | ACCEPTED client auto-approval removal only; persisted gate NOT IMPLEMENTED | D4 human authority, no self-approval, immutable decision and atomic transition |
| TC16 | PARTIAL; placement selected evidence, taxonomy caller gaps | Preserve raw uncalibrated null; Gemini repairs catalog positives/401/403 fixtures without weakening auth |
| TC17 | INVESTIGATION / compatibility plan only | Immutable versioned IDs across both scorers and callers; no physical regrading |
| TC18 | CHANGES_REQUESTED; malformed nesting/example injection retained | D6 exact manifest, historical adapters, structural limits and storage truth |
| TC19 | PARTIAL; hash schema is not approval/runtime evidence | Compose HTTP/service/evidence authority and distinguish digest/signature/approval |
| TC20 | CHANGES_REQUESTED overall; A implemented unverified, integration red | Approved A caller fix; separate A2 authority and B durable delivery/retry; independent acceptance required |

## FND01-FND30 and foundation readiness

Critical implementation owner for every row is Argon; Sonnet owns only assigned noncritical
support. Gemini owns evidence, Sol acceptance. This table is the current checkpoint of
existing work, not a competing historical completion ledger.

| FND | Status and unresolved scope |
| --- | --- |
| 01 | PARTIAL register reconciliation; no accepted exhaustive finding count |
| 02 | PARTIAL baseline; selected runs and broader failure/harness attribution remain distinct |
| 03 | PARTIAL ownership containment; profile, mapping and storage provenance gates open |
| 04 | VERIFICATION_FAILED historical foreign export controls; all reader/producer paths open |
| 05 | PARTIAL progress lanes; tenant persistence and physical atomicity unresolved |
| 06 | PARTIAL self-only/profile and admin-context policy; real management scope pending |
| 07 | PARTIAL cache containment; installed browser/private owner-transition gates open |
| 08 | PARTIAL verified actor evidence; complete backend side-effect/audit composition open |
| 09 | NOT COMPLETE persisted human Gate 1; client containment is not authority |
| 10 | NOT COMPLETE runtime readiness/authorized physical journeys |
| 11 | PARTIAL local-account containment; secure provisioning and uniqueness/concurrency open |
| 12 | PARTIAL W2 source inventory, exhaustive totals not accepted |
| 13 | PARTIAL placement truth evidence; remaining actual consumer/source contracts open |
| 14 | PARTIAL report/race controls; full consumer and backend compatibility acceptance open |
| 15 | PARTIAL governance/operational truth; genuine action/evidence authority open |
| 16 | PARTIAL marketing acknowledgement; auth/mutation/commit contract coverage open |
| 17 | PARTIAL W2 coverage reconciliation; claimed complete totals unaccepted |
| 18 | PARTIAL trusted identity types/callers; projection/store integration open |
| 19 | PARTIAL taxonomy schema/domain evidence; all five real caller contracts not accepted |
| 20 | VERIFICATION_FAILED historical delimiter control; versioned scoring rollout pending |
| 21 | VERIFICATION_FAILED nesting and authoring-storage controls; physical history unqualified |
| 22 | PARTIAL hash validation; evidence/approval HTTP/runtime integration open |
| 23 | VERIFICATION_FAILED event invariants; analytics A integration also unaccepted |
| 24 | NOT COMPLETE cross-consumer integration; current analytics runtime regression reproduced |
| 25 | PARTIAL adverse controls; retained failures must be genuinely resolved |
| 26 | PARTIAL static/quality gates; passing marketing typecheck does not pass integration |
| 27 | PARTIAL architecture/principle evidence; full-codebase compliance unaccepted |
| 28 | NOT COMPLETE independent re-audit and per-group acceptance |
| 29 | NOT COMPLETE W4 entry/dependency gate; no readiness claim |
| 30 | NOT COMPLETE final handoff and Sol closure for all nine groups |

Physical database provenance/migrations and SQL concurrency, durable event/queue effects,
installed browser/service-worker identity changes, real storage/export controls, deployment
and release readiness remain unqualified. BROWSER-01 and RC-ID-01 remain IN_PROGRESS.
Neither this transfer nor tooling acceptance closes W1-W3, Batch 08 or any physical gate.

## Frozen checkpoints and next notifications

1. Argon starts from a clean revision containing this decision, applies only the tracker
   amendment, records its exact manifest/source SHA and hands it to Gemini without pushing.
2. Gemini applies the approved positive fixtures in an isolated checkout, runs all required
   analytics controls and records separate source/test SHAs. Report any new failure to
   Argon with its legitimate positive. Preserve unchanged FAIL-04 and broader failures.
3. Sol accepts/rejects TC20-A only within demonstrated downstream scope. Argon submits
   the A2 inventory/manifest for the next explicit production authorization in parallel.
4. Argon continues the full twenty-item packet through reviewable disjoint slices; Gemini
   independently verifies frozen slices. Sonnet corrects concise docs/ledgers in its scope.
5. Sol integrates accepted changes sequentially, updates group dispositions and authorizes
   any physical gate separately. No automatic push, main merge, migration or deployment.

No external session was dispatched or interrupted by this repository update. The owner
selects Argon in the implementation host, Gemini for testing, Sonnet for noncritical work,
and Sol for review. Role names cannot impersonate an actual runtime or prior approval.
