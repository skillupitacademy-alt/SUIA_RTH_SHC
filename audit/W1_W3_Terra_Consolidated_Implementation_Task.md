# Consolidated W1-W3 foundation implementation assignment for Terra

Assigned 2026-11-05 by Sol / Codex at the owner's request to consolidate the nine
remaining foundation groups before W4. Implementer Terra / Tera. Independent reviewer
and architecture acceptance Sol. Status PLANNED, with prior submitted work retaining
its existing disposition. This is one assignment with thirty tasks, FND01-FND30.

## Objective and counted groups

Deliver reviewable implementation and evidence for the remaining foundation work,
then establish which W4 prerequisites are satisfied. The nine-group count is a planning
aggregation. W1.2 contains multiple existing tickets and acceptance gates.

| Group | Existing plan scope | Assigned tasks |
| --- | --- | --- |
| G1 | W1.2 critical authorization, including Batch 08 and early browser qualification | FND02-FND10 |
| G2 | W1.2-EMAIL people projection uniqueness design | FND11 |
| G3 | W2.1 authoritative production truth | FND12-FND17 |
| G4 | W3.1 identity contracts | FND18 |
| G5 | W3.2 educational taxonomy contracts | FND19 |
| G6 | W3.3 question/assessment contracts | FND20 |
| G7 | W3.4 tutorial/ILS contracts | FND21 |
| G8 | W3.5 Project LLM contracts | FND22 |
| G9 | W3.6 analytics/event contracts | FND23 |

FND01 and FND24-FND30 provide inventory, integration and independent-review readiness.
Each named group must receive its own disposition. A completed task ledger alone
cannot close a group. W1.2-EMAIL closure covers its approved design scope, with any
migration remaining a separate operation. W4 readiness is determined by its actual
dependencies and the approved execution sequence.

## Governing inputs and current baseline

Read FinalAechitecture.md, Architecture_Remediation_Execution_Plan.md,
CompleteProjectAudit.md, CompleteProjectMatrix.md, Canonical_Root_Cause_Register.csv
and Audit_Finding_Root_Cause_Crosswalk.csv. Retain original finding/ticket IDs.
Read the existing Batch 08 twenty-package assignment, handoff, progress identity design
and latest independent dispositions. Capture actual starting HEAD and working edits.

At assignment preparation, HEAD is 95bba4c3. Terra's J continuation is present in
cba76c1f, d217753e and 95bba4c3. Its current reported results have not received Sol's
independent acceptance. They remain IMPLEMENTED_UNVERIFIED. The accepted I correction
and all historical accepted scopes retain their recorded meanings.

Subsequent independent J review is recorded in W1.2_Terra_J01_J20_Sol_Review_95bba4c3.md.
Captured learning-session metadata passes at the tested transport seams. Whole-correction
acceptance is withheld for J-R1 hidden-time credit during session cutover and J-R2 deferred
visit work after teardown. The submitted UI selection reproduces sixty passes, while
the combined selection with Sol's new regression has sixty-one passes and two failures.
This is a checkpoint within FND01-FND30. All thirty tasks remain in the active assignment.

This consolidated assignment becomes the active work list for the remaining W1-W3
foundation work. It incorporates unfinished J01-J20 and T01-T20 duties through FND02-FND10
and the integration tasks. Preserve their ledger and IDs rather than creating duplicate
implementations or erasing retained failures. This assignment expands implementation
work only through the boundaries below. Terra retains no self-acceptance authority.

## Execution and implementation authority

One implementation worker owns the branch. Use dependency order and small commits.
Read-only inventory, isolated failing controls and decision proposals may advance across
groups concurrently in the work schedule. Integrate behavior-changing consumers only
after their identity/resource authority and canonical contract are established. Independent
W2 corrections may proceed while a W1 policy decision awaits Sol. Continue useful
independent tasks whenever a dependency is unavailable.

Apply SOLID pragmatically, DRY, KISS, YAGNI, separation of concerns, least privilege,
explicit ownership, high cohesion/low coupling, readable types and testability. Preserve
sound behavior. Reuse existing runtime schemas and services. Every implementation slice
must follow the master plan's ticket protocol and include its exact allowed-file manifest,
root-cause/finding IDs, caller inventory, invariants and acceptance tests before edits.
The manifest is a required artifact of this assignment. Routine compatible implementation
within the rules below needs no repeated owner confirmation.

Authorized source roots are the existing implementation/test files under these paths,
limited to the named foundation defects and contract consumers in each task.

- apps/api-server/src/app/api and apps/api-server/src/modules
- apps/skillhubcore-admin/src, apps/skillup-web/src and apps/realtutorialhub-web/src
- src/share-branding
- packages/auth/src, packages/api-client/src, packages/types/src and packages/validation/src
- packages/db/src, packages/db-people/src, packages/db-skillup/src, packages/db-rth/src
- packages/db-tutorial/src, packages/identity-bridge/src and packages/events/src
- packages/ui/src, packages/observability/src and packages/project-llm-discovery
- tests/e2e/auth-qualification for offline controls and readiness preparation only

W2 may also correct verified false production claims in the existing marketing-site
package and the two marketing apps, limited to truth/empty/error/demo behavior identified
by FND12. General marketing, consent or release work stays in its own wave.
Audit outputs belong in existing scoped reports, a consolidated handoff and the master plan.

Source manifests do not authorize arbitrary refactoring across these roots. Do not
introduce a guessed tenant authority, identity mapping or resource ownership rule. A
policy-changing choice, new public breaking contract, persisted key/schema migration,
session TTL/issuer change, publication locking or auth-owner epoch redesign requires a
documented Sol decision before that dependent runtime change. Deliver one recommended
option with compatibility, exact prospective paths and discriminating tests. Implement
already selected policies and confirmed compatible corrections while the decision is pending.
Keep domain-specific refactors beyond the foundation requirements in W4-W6.

Use isolated keys, stores and intercepted transport. Remove live DB/cache/queue bindings
from runners and exclude ignored environment files. Restore environment, DI, singleton
and transport overrides. Keep credentials, tokens, cookie values, DB URLs and private
responses out of retained outputs. Record layers and fixture limits explicitly.

Current assignment excludes live DB/browser execution, account provisioning/mutation,
server restarts, physical migrations, production traffic, load tests, implementer push,
main merge and deployment. Draft migrations and runtime-readiness recipes may be reviewed
as artifacts. Previously authorized live smoke history supplies its historical evidence
only. Missing physical/browser evidence remains an explicit dependent gate.

## Thirty actionable tasks

### FND01 Build the foundation completion register

Parent all nine groups / existing RC IDs. Depends on baseline capture. Allowed paths
are audit reports and the execution plan. Deliver an enumerated finding-to-source-to-task
register from the governing audit/crosswalk, including source-backed newly found issues.
Acceptance requires every W1-W3 finding to have an existing accepted scope, an assigned
correction or an explicit dependency/exception proposal. Identify the precise paths for
each implementation slice and avoid estimated completion percentages.

### FND02 Reconcile submitted J work and retained controls

Parent G1 / Batch 08. Depends on FND01. Allowed paths are existing Batch 08/UI/ILS tests
and audit evidence. Reproduce the submitted provider/delivery, composed ILS, representation,
repository and BFF selections with current counts. Run the retained Sol security probes.
Acceptance requires commands, selection, exit codes and failures remain attributable,
with overlapping sets separated. Submit this evidence for Sol's independent checkpoint.
The checkpoint can proceed while other independent tasks advance.

### FND03 Settle tenant/resource authority prerequisites

Parent G1 / RC-ID-01 and RC-DB-01. Depends on FND01. Allowed edits are the identity design
and decision record. Deliver a single decision table covering signed learner subject,
SkillUp shadow/local mapping, canonical private stores, export provenance, admin resource
classification and publication semantics. Recommend a contract per boundary, exact source
owners and denied ambiguous states. Acceptance requires each unavailable policy/deployment
input named once, prospective runtime paths and tests, then Sol disposition before the
corresponding policy-changing implementation. No recurring evidence-only rewrite cycle.

### FND04 Complete export authority corrections under selected policy

Parent G1 / RC-ID-01 and RC-ASSESS-01. Depends on FND03 for unresolved provenance.
Allowed files are the existing export trigger/status/download/urls/workflow routes,
their actual services/repositories and directly linked worker readers within the source
roots. Implement selected tenant and local-owner binding through producer and reader paths.
Acceptance requires legitimate owner/internal positives, foreign tenant equal-ID denial,
malformed credential denial and denial before Redis/storage/dispatch where required.
Retain failing probes for any policy/migration-dependent case until it is genuinely fixed.

### FND05 Complete progress ownership containment

Parent G1 / RC-ID-01 and RC-TUTORIAL-01. Depends on FND03 for private owner/store authority.
Allowed files are existing tutorial/progress and tutorial/ils routes, their learner BFFs,
learning-progress service/repositories and selected callers. Correct confirmed defects
under the selected authority contract. Acceptance requires same-user legitimate read/write,
cross-user and colliding cross-tenant denial, forged-header rejection and stable retry
semantics. Keep legacy containment, canonical completion, active-time and private persistence
as four separate evidence lanes. No legacy feature development.

### FND06 Complete admin request-context boundaries

Parent G1 / RC-ID-01. Depends on FND03 resource classification. Allowed files are the
existing proxy, auth RBAC/audience/route guards and affected admin user/question handlers
and repository predicates. Implement the selected actor/target/store policy. Acceptance
requires conflicting context rejection, learner/wrong-audience sanitized denial, zero
privileged reads on rejection and retained legitimate tenant-admin/SHC compatibility.

### FND07 Close supported client-state and pending-response defects

Parent G1 / RC-ID-01 and RC-TUTORIAL-01. Depends on FND02 and FND03 for any auth-owner
decision. Allowed files are the actual shared/learner auth view state, affected progress
component/cache owners and telemetry provider/delivery code named in the slice manifest.
Correct confirmed stale response/private cache defects using the selected lifecycle
authority. Acceptance requires teardown/remount and continuously mounted A-to-B controls,
delayed request/callback and logout cases. Distinguish mounted isolated behavior from
actual browser authentication. Durable storage/owner-epoch redesign remains decision-gated.

Immediate metadata-lifecycle priorities are J-R1 and J-R2 from the independent J review.
In BlockTelemetryProvider.tsx and blockTelemetryDelivery.ts, preserve current document
visibility when starting a cutover interval and invalidate obsolete deferred visit work
on teardown. Reuse existing timing/queue lifecycle mechanisms. Acceptance requires the
three-case sol-session-transition-lifecycle.test.tsx pass, plus hidden-to-visible resume,
null/enabled cutover, deferred settlement and supported React effect replay controls.
Retain captured headers, acknowledgement, final best-effort flush and observer semantics.
These bounded lifecycle corrections need no new authority or owner-policy selection.
They do not expand backend session attribution, BFF forwarding or authenticated owner scope.

### FND08 Bind Project LLM audit actors to verified server identity

Parent G1 / RC-ID-01 and RC-PLLM-01. Depends on FND01 and applicable identity contracts.
Allowed files are the actual Project LLM API ingress, existing domain/application service,
audit persistence adapter and the corresponding SHC client. Trace the caller before edits,
then remove browser authority over the persisted actor. Acceptance requires authorized
positive, forged actor negative, unauthenticated denial and preserved audit correlation.
Use isolated persistence. Broader Project LLM workflow redesign stays in W4.

### FND09 Secure the existing Human Gate 1 approval boundary

Parent G1 / RC-ID-01 and RC-PLLM-01. Depends on FND08 and selected approval permission.
Allowed files are the real Gate 1 handler/service and SHC action owner identified in the
slice manifest. Bind approval to verified identity and explicit existing authorization.
Acceptance requires unauthorized/client-state-only attempts cannot advance the persisted
gate, valid authorized action succeeds and replay cannot duplicate approval effects.
If approval authority is undefined, deliver the exact Sol decision input before runtime edits.

### FND10 Prepare W1 browser and physical-store completion evidence

Parent G1 / BROWSER-01. Depends on implemented W1 boundaries. Allowed paths are existing
qualification fixtures and scoped readiness/evidence docs. Inventory accepted journeys
and outstanding deployment/build, browser, gateway and physical-store checks. Prepare
minimal discriminating commands, required accounts/store isolation and sanitized evidence
contracts. Acceptance requires source-provenance and execution prerequisites per scenario.
Actual browser/DB checks remain NOT EXECUTED until separately authorized and observed.
Do not claim W1 closure from offline substitutes.

### FND11 Complete the people-projection uniqueness design

Parent G2 / W1.2-EMAIL. Depends on FND01. Read actual identity bridge, people repository,
schema, staff auth and retry consumers. Allowed edits are audit/design and isolated
consumer-disambiguation tests. Deliver the selected recommendation for scoped lookup,
uniqueness, partial writes, compatibility, migration sequencing and rollback. Acceptance
requires equal-email tenant cases and ambiguous lookup denial, plus all affected consumers
enumerated. A schema migration or physical cleanup is a separate decision and operation.

### FND12 Enumerate fabricated production truth

Parent G3 / RC-TRUTH-01. Depends on FND01. Allowed edits are audit inventory and targeted
controls. Trace every governing W2 finding to its active route/component, data source and
current fallback. Classify persisted authoritative, unavailable, empty, demo/reference or
fabricated. Acceptance requires exact file/function and finding coverage across the three
apps, shared code and W2 marketing targets. Avoid treating every static label as fake data.

### FND13 Correct fabricated SkillUp educational data

Parent G3 / W2.1. Depends on FND12. Allowed files are skillup-data.ts and the actual
batch/program/faculty/placement/recording callers, services and tests identified by the
inventory. Reuse existing authoritative APIs, otherwise expose truthful empty/unavailable
or explicitly isolated demo state. Acceptance requires no synthesized enrollment, placement
or recording record presented as real, and valid persisted data retains its behavior.

### FND14 Correct fabricated assessment and result values

Parent G3 / W2.1 and RC-ASSESS-01. Depends on FND12. Allowed files are active exam/result
data adapters and views in the learner apps and their shared callers. Remove fabricated
authoritative metrics/fallback results. Acceptance requires genuine zero, missing value,
request failure and persisted result to be distinct and tested. Keep assessment algorithm,
deadline and lifecycle redesign outside this truth-correction slice.

### FND15 Correct false SHC operational and Project LLM claims

Parent G3 / W2.1 and RC-PLLM-01. Depends on FND12, with approval boundaries coordinated
with FND08/FND09. Allowed files are identified active operational/audit/certification and
Project LLM evidence panels, adapters and existing services. Replace manufactured PASS,
VERIFIED, health and audit authority with persisted evidence or truthful unavailable/demo
presentation. Acceptance requires reference material cannot authorize governance actions
and valid evidence retains its attributable source/time/status.

### FND16 Correct unpersisted production success claims

Parent G3 / W2.1. Depends on FND12. Allowed files are exact active learner/marketing
form/action callers identified in that inventory. A UI success state must follow actual
confirmed persistence or clearly described local-only behavior. Acceptance requires
success, rejection, timeout/unknown outcome and unavailable service be distinguishable,
with duplicate/retry behavior preserved. General marketing or backend product expansion
stays outside this bounded correction.

### FND17 Verify W2 coverage and legitimate empty/error behavior

Parent G3 / RC-TRUTH-01. Depends on FND13-FND16. Allowed edits are relevant regression
tests and the truth inventory. Exercise real data adapters/component entry points for
empty, zero, unavailable, reference and persisted cases. Acceptance requires every
enumerated W2 finding have code evidence and disposition, with required unresolved cases
remaining open. Submit G3 as a distinct reviewable group.

### FND18 Consolidate canonical identity contracts

Parent G4 / W3.1 and RC-CONTRACT-01. Depends on established W1 identity decisions.
Allowed files are existing auth/types/validation/API-client identity schemas and exact
verified consumers in the slice manifest. Reuse one runtime schema per canonical boundary
and inferred types, preserving explicit versioned migration adapters. Acceptance requires
independent tenant subjects, optional projections, purpose/audience/class and caller
compatibility be explicit. No guessed persisted discriminator or broad role redesign.

### FND19 Consolidate educational taxonomy contracts

Parent G5 / W3.2 and RC-CONTRACT-01. Depends on FND01 and applicable identity contracts.
Allowed files are existing shared taxonomy schema/types, API validation and exact SHC/
learner consumer adapters. Resolve demonstrated payload/enum/identity drift with canonical
validation and compatible adapters. Acceptance requires actual ingress/egress consumer
controls, malformed input denial and existing hierarchy positives. Route/repository
architecture extraction belongs to W4 unless required by this contract defect.

### FND20 Consolidate question and assessment contracts

Parent G6 / W3.3 and RC-CONTRACT-01. Depends on FND01 and taxonomy decisions where used.
Allowed files are existing question/assessment types and validation plus exact API,
editor/import/review consumers identified by the manifest. Resolve proven questionText/
text, enum and payload drift with a canonical boundary. Acceptance requires malformed
input rejection, valid round-trip and supported historical payload compatibility. Broader
question factory or exam lifecycle refactoring remains in application waves.

### FND21 Consolidate canonical tutorial and ILS contracts

Parent G7 / W3.4, RC-CONTRACT-01 and RC-TUTORIAL-01. Depends on selected W1 private owner
authority and reviewed membership behavior. Allowed files are existing tutorial-rich-
document schemas, tutorial/ILS API types, API-client boundaries and exact renderer/service
consumers. Establish block/version/nested identity, navigation and completion/telemetry
distinctions. Acceptance requires schema-valid positives, unknown/wrong-version denials,
canonical round-trip and explicit legacy adapter scope. Preserve observer policy unless
separately selected. Avoid developing the legacy tutorial model.

### FND22 Consolidate Project LLM governance/evidence contracts

Parent G8 / W3.5, RC-CONTRACT-01 and RC-PLLM-01. Depends on FND08/FND09 for authority.
Allowed files are packages/types/src/project-llm and actual backend/SHC client boundary
adapters. Resolve demonstrated candidate ID/hash, approval, audit and evidence shape drift.
Acceptance requires runtime schema validation, correct actor/evidence semantics, supported
caller compatibility and no browser-manufactured governance authority. Full workflow
orchestration changes remain in W4.

### FND23 Consolidate analytics and event contracts

Parent G9 / W3.6, RC-CONTRACT-01 and RC-EVENT-01. Depends on canonical identity and each
event's domain owner. Allowed files are existing event/type/validation schemas and exact
publisher/consumer/analytics adapters. Specify trusted tenant/subject, event identity,
version, timestamps, retry/deduplication and error semantics only where the domain uses
them. Acceptance requires linked producer-consumer positive, malformed/foreign-context
negative and compatible replay controls. New analytics infrastructure remains separately gated.

### FND24 Verify canonical contracts through actual callers

Parent G4-G9 / RC-CONTRACT-01. Depends on FND18-FND23 as each domain stabilizes. Allowed
files are exact dependent caller adapters and tests from the manifests. Exercise runtime
schema to inferred type to HTTP/client boundary to domain consumer. Acceptance requires
obsolete aliases removed only after all callers migrate, explicit adapters for supported
historical data and dependency/build evidence. Keep domain suites individually attributable.

### FND25 Verify failure, retry and isolation sensitivity

Parent G1/G3-G9. Depends on each relevant correction. Allowed files are its isolated
tests and scoped reports. Use one discriminating adverse control per security/ownership,
truth and schema invariant that could falsely pass through a mock. Acceptance requires
real entry points where feasible, zero unauthorized effects and actual sensitivity to
the previously faulty behavior. State which infrastructure and transaction boundaries
remain simulated. Reuse accepted regression controls rather than duplicating them.

### FND26 Run supported static and build gates

Parent all implementation groups / RC-CI-01. Depends on stabilized slices. Use installed
supported package commands and exact source/test inclusions. Acceptance requires affected
typechecks, targeted lint, relevant builds and whitespace checks recorded per package,
with missing test lint/type gates disclosed. Do not load ignored live env, suppress
diagnostics or alter global configuration to obtain green outputs. Builds with unavailable
offline prerequisites receive their precise failure/dependency disposition.

### FND27 Produce compatibility and engineering-principle evidence

Parent all nine groups. Depends on implementation manifests. Allowed edits are scoped
tests/reports and proven small compatible fixes within approved slices. Record caller/data
compatibility, responsibility separation, reuse, dependency direction, simplicity,
least privilege and error/transaction behavior for each group. Acceptance requires
source-backed examples and regressions for affected historical inputs. Identify residual
full-app findings for W4-W6 without turning this task into a broad refactor.

### FND28 Deliver the foundation re-audit package

Parent all nine groups. Depends on FND17/FND24-FND27. Allowed edits are audit evidence.
Reconcile findings to actual implementation commits, test layers and unresolved gates.
Acceptance requires critical/high findings and unknown authority cases stay explicit,
with no aggregate pass hiding filtered/failed/unexecuted cases. Sol performs the independent
re-audit and assigns acceptance. Terra may prepare and reproduce evidence only.

### FND29 Evaluate W4 entry dependencies

Parent W1-W3 to W4 transition. Depends on group dispositions and FND28. Allowed edits
are the execution plan and W4 readiness matrix. For each W4.1-W4.6 item, name its required
foundation contract/security/truth dependency and evidence. Acceptance requires each
dependency marked accepted, pending or explicitly excepted by Sol. Do not begin full W4
runtime restructuring under this assignment or imply that the nine-group count proves readiness.

### FND30 Submit the single consolidated handoff

Parent all nine groups. Depends on all task dispositions. Allowed edits are
W1_W3_Terra_Consolidated_Handoff.md, scoped existing reports and the master execution plan.
Deliver FND01-FND30 and G1-G9 statuses, original-ticket linkage, exact manifests/commits,
commands/counts, policy inputs and remaining runtime prerequisites. Keep correction
commits reviewable by group. Acceptance requires every task have a result or exact
dependency, existing edits preserved and unreviewed work marked IMPLEMENTED_UNVERIFIED.

## Completion and acceleration rules

Submit an implemented group for independent review as soon as its evidence is stable.
Continue other independent tasks while Sol reviews it. Avoid rerunning already accepted
positive suites merely to improve totals. Run affected regressions and retained negative
controls after dependent edits stabilize. Resolve confirmed root causes with small,
complete corrections instead of repeatedly issuing design-only ledgers.

Sol may close a group only against its declared acceptance scope. Runtime, migration
and external policy dependencies can prevent closure even after source work is complete.
Report those dependencies precisely and keep progressing elsewhere. There is no promised
batch count or completion date. W4 starts when its required foundation acceptance gates
are met under the execution plan. Until disposition, Batch 08, BROWSER-01 and RC-ID-01
retain their recorded IN_PROGRESS statuses.
