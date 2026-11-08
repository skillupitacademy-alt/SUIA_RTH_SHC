# Sol Slice 21 source, inventory and physical evidence review

Date: 2026-11-07. **PARTIAL_ACCEPTANCE.** Slice 19 and Slice 20 Q1/Q2 scoped acceptances
are preserved. Report/harness corrections are CHANGES_REQUESTED. W1-W3 closure and W4
implementation remain NOT APPROVED. No broad source rewrite is requested.

## Actual baseline and independent observations

Initial HEAD and verification revision: `4692afaa743bdb6c55764c08f68a1b20448eb4c5`,
branch `remediation/w1-2-batch-05-targeted`, clean.
Source: `d5f58b18fba226da69af3408db544ef356f75fb9`.
Handoff: `1ad5caa176934e86db53d65e9d58a054ae2a8e86`.
Gemini's new commit changes audit/UAT test files, not production. Argon's source commit
includes a modified taxonomy test: preserve that implementer-test attribution.

Sol independently reran the pre-import-guarded, config-free selected controls:

| Selection | Observed |
| --- | --- |
| `node audit/Sol_Slice20_Repository_Review.mjs` | 1 file / 40 passed; exit 0 |
| `node audit/Sol_SQL_Authority_Review_7f66e7eb.mjs` | 1 file / 8 passed; exit 0 |
| `node audit/Gemini_SQL_Authority_Invariant_Review.mjs` | 1 file / 6 passed; exit 0 |
| `node audit/Sol_Lease_Adapter_Review_27243c6e.mjs` | 1 file / 7 passed; exit 0 |
| SHC `hierarchy-contract.test.ts`, actual schemas, isolated guarded Vitest | 1 file / 27 passed; exit 0 |
| `pnpm --filter @quiz/api-server exec tsc --noEmit` | exit 0 |
| `pnpm --filter @quiz/skillhubcore-admin exec tsc --noEmit` | exit 0 |
| `node --check` on both changed marketing CJS scripts | exit 0; parsing only, no script execution |
| TypeScript createSourceFile parseDiagnostics on changed migrations/schema.ts | zero syntax diagnostics; not workspace typecheck acceptance |

The new schema-field preservation and syntax corrections are useful source progress.
Twenty-seven schema tests do not qualify all five CRUD routes, their authorization,
alias-conflict behavior, persistence or cross-app serialization. Finish actual caller
composition evidence for FND19/TC16; retain the sound bounded corrections.

Gemini's full reported arithmetic is **301** selected test executions: 40+8+6+7+114+99+27.
The executive 298 was incorrect and is corrected. Neither total means unique requirements
or full FND/group coverage. Broader runs/typechecks are attributed to their reported
commands unless independently listed above. No network/service/physical test was run by
Sol during this review. Syntax checks do not start the UAT scripts.

## I1: arithmetic accepted; source completeness and anchors remain unqualified

Mechanically reproduced: crosswalk 91 data rows, 68 unique formal IDs and 23 prose rows;
base inventory 109 entries, additional MA/TI inventory 72 entries. All 72 new referenced
paths exist. Accept this enumeration arithmetic and path-existence boundary only.

Sample current `CompleteProjectAudit.md` anchors in the reconciliation are stale or
incorrect: 6298 is a code fence, 6302 an arrow, 6366 blank, 6414 discusses an admin
hierarchy boundary rather than the assigned analytics finding description. If references
belong to another revision, pin that revision and exact original finding text/hash; do
not treat newly assigned CPA IDs as proof of correct source linkage. No fabricated intent
is inferred, but current references cannot support acceptance as written.

Argon/Sonnet must re-anchor prose findings and mechanically validate distinct IDs, caller
function/field/data owner, coverage and dispositions. A file existing does not prove the
listed caller's claimed authorization or remediated status. FND01/FND12/FND17 remain
PARTIAL until this original-finding/source/evidence chain is independently qualified.

## I2: canonical governance/evidence corrections

Both new report and reconciliation relabeled G1-G9 while asserting definitions were
preserved. Sol restored the canonical definitions in those current files. P1-P5 are
execution packet labels, not new foundation groups. Existing TC-to-FND assignments in
the original packet remain authoritative; several new matrix pairings are not accepted
(for example export FND04 is not the profile-composition TC05, and taxonomy schema tests
are not evidence of complete W2 production truth).

RC-ID-01 remains identity/session/authorization/brand authority; BROWSER-01 remains
installed-browser qualification. Tester PASS/QUALIFIED labels do not close these roots.
FND26 is not VERIFIED merely because scoped packages compile while workspace check is red.
Sol's addenda supersede blanket author-completion claims without erasing historical results.

## P3 browser: reported selected observations, qualification still open

The supplied harness logs results but does not fail on false test flags. Its weaknesses:

- Login success is inferred from leaving /login OR matching cookie-name fragments; it
  does not require HTTP 200 plus expected authenticated subject and a successful protected
  application response. Caught redirect timeouts may still produce a green-looking result.
- Cross-host navigation with naturally host-scoped cookies is useful isolation observation,
  but is not an explicit foreign-token replay against the protected server boundary.
- Service-worker test uses a fresh unauthenticated context and checks only absence of one
  legacy cache NAME. It does not install/control/upgrade the worker, seed old private
  entries, enumerate cached request bodies or authenticate A -> logout -> B. NO_CACHE_API
  even satisfies the current legacy-name absence predicate. `accountSwitching` stays false
  without an implemented journey.
- The admin attempt targets the student portal, not a successful SHC Admin journey. A 401
  establishes rejection of that attempt only; it does not prove every administrator's
  credential ownership or absence of all cross-tenant paths.

Retain reported successful SUIA/RTH login/redirect observations as scoped, un-replayed
tester evidence. Full gateway trust, account switches, delayed callbacks and installed
worker lifecycle, SHC Admin positive and denial paths remain NOT_EXECUTED/UNQUALIFIED.
Do not mark G1/G2/G6 or BROWSER-01 fully passed from these observations.

Gemini repairs positive and negative assertions, actual journeys, structured sanitized
results and nonzero exit on any required failure. Do not launch it again until its exact
environment/credential and side-effect authorization is pinned.

## P4 R2: mechanics reported, ACL/export qualification not established

Upload/head/signed fetch/delete observations are useful scoped storage mechanics, but
the harness treats HTTP 400 OR any fetch exception as access denial and any HEAD exception
as confirmed deletion. These can be malformed URL, DNS, timeout or authentication errors,
not verified ACL/NotFound. Cleanup is in the normal success path, not finally. Caught errors
do not set a nonzero exit. It does not assert expiration or call application export routes
with authorized, same-tenant non-owner and foreign-tenant credentials.

Gemini must use correct raw-object endpoint semantics, require observed authorization
response and positive controls, discriminate NoSuchKey/404 from transport/auth errors,
always attempt targeted cleanup in finally, assert post-delete state, and report failed
cleanup/required flags nonzero. R2 mechanics alone cannot close FND04/TC11/TC12 or object
access gate. Sol did not repeat storage operations or confirm the reported cleanup live.

## P1 SQL: wrong schema in harness; exact migration preparation required

Production outbox table is **event_outbox**, not tutorial_event_outbox. Its absence is NOT
established by a query for the wrong table. Reported student_invitations absence is a
tester observation only, not re-probed by Sol. The SQL test INSERT uses enquiry_id,
tenant_id and raw token, while actual schema requires user_id, platform and token_hash.
It uses status claimed instead of claiming and weaker hand-written ownership/expiry
predicates. After migration it would fail or test a different contract. The outbox INSERT
also uses absent aggregate_type and omits required event_id. Several purported race cases
are sequential terminal-state checks, not synchronized independent transactions.

Gemini must rebuild the harness against actual repository/schema contracts with barriers,
independent connections, SQLSTATE/affected rows and final state. Do not apply DDL merely
to make this incorrect harness runnable. No actual SQL concurrency/rollback case is accepted.

The migration files are not registered in their journals. People journal ends 0008,
tutorial 0028; tutorial folder already has a different 0015 migration. See the exact
[offline preparation packet](Sol_Slice21_UAT_Migration_Preparation_4692afaa.md). Preparation
is APPROVED; execution is NOT APPROVED until target identity, backup/restore, exact
registration/DDL and rollback are filled, reviewed and specifically authorized. Preserve
the owner's UAT intent, but do not infer authorization from a _prod name or available secret.

## P2 Redis: environmental failure, provider cause unknown

ENOTFOUND establishes failed resolution from the tester environment, not that the provider
paused, deprecated or deleted the cluster. Dashboard/endpoint identity and independent
resolver evidence are needed under explicit access authorization. Do not create/replace
clusters, change secrets or upgrade a plan merely on this observation. Actual lease/queue
delivery and crash/ack tests remain BLOCKED/NOT_EXECUTED, with source simulation retained.

## Credential housekeeping and audit authorization

This review redacts literal UAT account/password details from the current Slice 21 report
and replaces hardcoded browser credentials with required environment bindings. No actual
credentials were printed or used by Sol. Only configuration/redaction changed; weak UAT
assertions are intentionally returned to Gemini and not relabeled passing. Browser script
syntax was checked without launching Chromium. Prior Git/chat exposure remains; no history
rewrite or account/password rotation occurred. The account owner must assess/authorize
credential replacement where exposed bindings remain active, and external traces need
the same sanitation. Shared password values are not proof of disposable credentials.

The report asserts owner physical-test authorization; the checked-in artifacts do not
pin its exact target/operations/source-build identities. Preserve the reported activities;
record the authorization reference before further execution. Do not retroactively declare
unobserved permission or repeat live operations as part of this offline review.

## Disposition and exact next handoff

- **Accepted:** prior Slice 19/20 boundaries retained; inventory arithmetic/path existence;
  bounded schema-test and syntax-check evidence at the stated source revision.
- **CHANGES_REQUESTED to Gemini:** report count/mapping scope and credential sanitation;
  browser/R2 assertion and SQL-schema harness defects; safe logs/artifacts, exact exits,
  source-build attribution, actual caller/physical cases and cleanup results.
- **Argon:** complete actual taxonomy CRUD/caller and canonical alias behavior evidence,
  re-anchor inventories (optional Sonnet docs), prepare exact migration/rollback/registration
  packet and remaining full TC/FND requirements; no broad rewrite of accepted code.
- **Environment/account owner:** supply confirmed UAT targets, backup/restore record,
  physical execution permission and active Redis endpoint; decide exposed credential action.
- **Sol:** review concrete migration plan, corrected independent evidence and original
  per-requirement/per-group readiness. No blanket migrations, live service actions, secret
  changes, push, main merge, deployment, W1-W3 closure or W4 GO is granted by this review.

The [single thirty-task checklist](Claude_Sonnet45_W1_W3_Completion_Directive.md#consolidated-remaining-work-checklist-for-w4-readiness)
remains the full pending scope, not a new or reduced assignment. Mandatory physical gates
must be observed or handled only through exceptions actually permitted by governing policy.
