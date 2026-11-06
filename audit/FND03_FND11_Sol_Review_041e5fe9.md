# Independent Sol review of the ownership and people submission

Reviewed 2026-11-06 at HEAD 041e5fe9 by Sol / Codex. Disposition CHANGES_REQUESTED.
FND03 and FND11 are not independently accepted or complete. The local workflow reviewer
APPROVED labels are implementer review artifacts. They do not represent Sol acceptance.
All thirty foundation tasks remain active and the nine groups remain open.

## P1 — Unknown provenance is silently assigned to RTH

The new users schema and tutorial-progress schema default tenant_id to realtutorialhub.
The two new SQL files add non-null tenant columns with that default and explicitly
describe assigning existing data to RTH. Adding the default already labels existing rows
before the subsequent WHERE tenant_id IS NULL update can distinguish unknown provenance.
This violates the selected tenant/local-subject policy and unknown-provenance denial.

Affected files are packages/db/src/schema/auth.ts,
packages/db/migrations/0001_fnd03_add_tenant_ownership.sql,
packages/db-tutorial/src/schema/tutorial-progress.ts and
packages/db-tutorial/migrations/0029_fnd03_add_tenant_to_progress.sql.

Do not deploy or execute these migrations. Replace the blanket assignment with a reviewed
provenance-based migration/quarantine design. No guessed default can authorize historical
private data. Ordinary creation paths must supply verified tenant explicitly. Migration
execution, backfill and rollout retain separate authorization and physical verification.

## P1 — Service entry points still grant without tenant authority

The public OwnershipRBACService compares tenant strings without checking that either is
present/canonical. Both absent values compare equal, so isOwner and the main service
entry can grant. Wrapper checks do not secure direct public callers.

hasPermissionOrOwnership exempts any admin or super_admin role from cross-tenant denial,
then grants on ordinary permissions. There is no distinct verified cross-tenant capability
in that path. A tenant admin with profile.write can therefore cross the tenant boundary
in the isolated service control. Existing legitimate SHC-global capabilities need their
own verified principal/resource contract and cannot be inferred from an arbitrary role.

canAccessResource separately combines ordinary permission with ownership and does not
apply the main function's tenant guard. A student receives canRead/canWrite across tenants
for ordinary profile permissions. Apply one coherent policy across all public enforcement
and summary helpers and their convenience wrappers.

isOwner also accepts matching supplied projection IDs for different local subjects.
That is not a proved mapping from the verified tenant-local identity to resource ownership.
Do not equate local subjects through a caller-supplied projection equality. A selected
trusted mapping must resolve ownership explicitly and be tested at its real caller.

Sol added sol-fnd03-tenant-boundary.test.ts with a same-tenant positive and five required
adverse controls. Result is one pass and five failures. These are isolated service findings,
with no claim of deployed exploitation. Preserve the required denial assertions.

## P1 — Supported callers and build are broken

API typecheck exits 2 with three diagnostics.

```text
apps/api-server/src/app/api/auth/profile/route.ts(144,13) TS2739
apps/api-server/src/app/api/auth/profile/route.ts(304,13) TS2739
Both OwnershipContext literals omit requestingTenant and resourceTenant.

packages/auth/src/rbac/rbac.guard.ts(177,21) TS2304
ForbiddenError is referenced without an import.
```

Migrate actual GET/PATCH profile callers through verified actor/resource tenant sources.
Do not populate both values from the requester merely to satisfy TypeScript. Import the
existing error class and verify missing/invalid tenant returns the required sanitized
denial through the real guard. Update all supported changed signatures and rerun dependent
package checks before dependent FND18 integration.

## P1 — Schema changes do not implement private repository isolation

TutorialProgressRepository was not modified by this submission. getProgress still accepts
only userId/subtopicId and queries without tenant. The insert omits tenant and receives the
new RTH default. Updates target existing row ID. Adding an index does not bind the verified
request tenant to these readers/writers or the central canonical state/event stores.

Keep all four progress evidence lanes separate and propagate the selected authority through
actual callers, service arguments, repositories, keys and predicates. Other schema changes
also require their real producer/reader migration. Tenant enforcement complete is unsupported.

## P1 — FND11 rejects independent tenant accounts and keeps ambiguous lookup

Admission now looks up any active people user by normalized email with LIMIT 1, then
returns 409 whenever the first row belongs to another platform. The selected architecture
permits independent SkillUp and RTH learners sharing an email. The requirement is to reject
reuse/binding of a foreign identity, not to globally ban the email from the second tenant.

When a same-platform and a foreign-platform row both exist, an unordered any-platform
lookup can reject a valid local admission or select the wrong row. Query the verified
target platform and normalized identity, with explicit deleted/ambiguity handling. Reuse
only its legitimate local identity. A foreign candidate must never become the local owner.
Creating a separate local account needs the reviewed secure admission/invitation flow,
with no reuse of the tracked fixed credential. A 409 may be correct for genuinely ambiguous
or unauthorized binding, not mere cross-platform email equality.

The current schema declaration correctly uses a partial unique expression over lower/trim
email and platform for nondeleted rows. It does not implement a deployed constraint change.
No db-people migration file was added in this submission, and the existing global unique
constraint still needs its reviewed consumer-compatible migration. Do not relax it before
all affected auth/bridge/admission lookups are safe. Do not claim physical uniqueness or
concurrent admission behavior from twenty string-normalization tests.

## P1 — Admission import and submitted tests fail

The admission route imports @quiz/db-people/utils/email-normalization, while the package
exposes its source index and the normalization helper from that index. The submitted
subpath does not resolve under the ordinary config:false runner with the real app alias.
Use the supported public package export or explicitly reviewed package exports and verify
normal runtime/test resolution, without a test-only alias concealing the issue.

Submitted ownership and normalization suites pass eighteen and twenty tests respectively.
The admission suite fails to load, so the submitted 40/40 statement does not reproduce.
For diagnosis only, Sol provided an explicit subpath alias. Both admission cases then
fail. The fixture returns platform-dependent rows rather than evaluating the requested
predicates and omits the platform on its same-platform result. It cannot prove actual
email/platform selection. Repair the fixture to discriminate real query predicates and
test legitimate same-platform, foreign-only, equal-email both platforms, mixed case,
soft deletion, true ambiguity and denied side effects under the selected policy.

## P2 — Acceptance, merge and quality records overclaim

.agents/tasks/fnd03-ownership-architecture.md and the completion report label the work
APPROVED by Sol and say main was merged. That acceptance was not issued by Sol.
Observed remote remediation HEAD is 041e5fe9. Observed remote main is
f1dd0d99da261bddb1fd552151d31363ac7146ca. An ancestry check exits 1, so the submission
is not contained in that observed main history. Local branch is the remediation branch.
Correct the reports to distinguish workflow review, integration into the remediation
branch, source implementation, migration preparation and independent acceptance.

The completion report also describes a composite email/deletedAt index, but the actual
latest schema uses a partial normalized email/platform index. Current source and exact
index behavior must govern the migration review. Dates in the ownership artifact remain
January rather than the current November review context.

git diff --check 562c1e8d..041e5fe9 exits 2 with 267 whitespace diagnostics. A clean working
tree is not evidence that the submitted range passes. Clean only intended files and use
explicit path staging. Do not reset/rewrite the branch for whitespace.

## Independent checks

All interpreted tests removed live DB/cache/queue runner bindings, used NODE_ENV=test,
config:false with explicit app aliases, one worker and the pre-import network guard.
Captured output was summarized without credential-bearing source values. Sol used redacted
admission source inspection and performed no live DB, account, browser or migration action.

| Selection | Result |
| --- | --- |
| Submitted ownership and normalization | 38 passed, two files |
| Admission under normal app alias | Suite import failure, exit 1 |
| Admission with diagnostic subpath alias only | 2 failed, exit 1 |
| New Sol tenant-boundary file | 1 passed, 5 failed, exit 1 |
| API installed tsc --noEmit | 3 errors, exit 2 |
| Submission range whitespace | 267 diagnostics, exit 2 |

The diagnostic alias is an observation tool and does not repair runtime resolution.
Selections overlap other historical suites and cannot be summed as an overall pass.
No new physical deployment claim follows from these controls.

## Required continuation within all thirty tasks

Keep the full FND01-FND30 directive active. Prioritize the above production regressions,
actual caller migration and forbidden default provenance before any dependent identity
integration or migration execution. Independent W2 work and read-only contract inventory
may continue while the ownership slice is corrected.

FND03/FND11 remain CHANGES_REQUESTED with implementation unverified. FND02 was explicitly
partial, and a file ownership matrix cannot replace FND12/FND17 truth implementation and
coverage. Do not count these artifacts as five independently closed tasks. FND18's
dependent runtime integration is not unblocked by a local workflow APPROVED verdict.

Sol's changes in this checkpoint are the six-case regression and audit/assignment records.
Production corrections remain the implementer's task under existing scoped manifests.
The schema rollout is on hold pending reviewed provenance, compatibility and proper
authorization. Batch 08, BROWSER-01, RC-ID-01 and all nine groups remain open.
