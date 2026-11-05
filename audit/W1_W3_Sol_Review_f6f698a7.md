# Consolidated foundation independent checkpoint

Reviewed by Sol / Codex on 2026-11-05 at Terra submission f6f698a7, based on df81a5c0.
Disposition PARTIAL. All nine groups and the thirty-task assignment remain incomplete.
No group closure or W4 readiness is granted. Authority remains FinalAechitecture.md and
the consolidated foundation assignment. Source review covered the submitted diff, with
execution concentrated on the listed slices. This checkpoint does not accept every
changed file in the 138-file submission.

## Verified and retained findings

The two original provider lifecycle assertions now pass. Starting new timing paused
while hidden prevents the reproduced hidden credit, and teardown invalidates deferred
visit work. These behaviors are VERIFIED within the mounted fixtures. Captured interval
metadata, retry and exact central/BFF limits retain their previous scoped disposition.
Whole provider correction acceptance remains withheld for the additional StrictMode
visit regression below.

The submitted six-file UI selection independently passes 66 tests. Its StrictMode case
checks credited seconds, while an added Sol assertion checks initial visit emission.
During StrictMode effect replay, teardown advances transitionGenerationRef and the next
setup returns early because the same interval is already active. The deferred initial
visit sees an obsolete generation and is suppressed. The new assertion observes zero
visits where one is required. The lifecycle file with that added assertion reports
six passes and one failure. Fix mounted replay and real teardown together while
retaining the established no-post-teardown-visit and credit invariants.

The selected report truth tests pass, including aggregate score/total and incomplete
question uncertainty. A new mounted Sol boundary control exposes the previous exam
result while the next exam request is pending. Cancellation prevents an obsolete
response from committing, but current result/loading/retry state is not reset or keyed
to examId. The old subject remains rendered under the next exam selection until its
response resolves. The added control fails, with the next exam positive included.
This is stale mounted report evidence, with no live account-access claim.

The compliance brief workflow-switch controls pass at the mocked client/router/context
boundary. Binding loadedContract to workflowId and ignoring obsolete responses correctly
prevents the tested A/B mixing, including pending and failed B. Backend contract validation,
actor permission and persisted approval remain open. Reference/unavailable disclosures
pass the selected mounted controls. Full contract/governance acceptance remains pending.

SkillUp program/faculty/batch and other helper truth controls pass through isolated query
adapters. The broad fetchSkillupApi fallback after non-OK responses remains a separate
authority concern. Those helper passes cannot close the HTTP authorization boundary.

SHC user and subscription pages now display unavailable states. This removes the former
prototype management actions and detail interactions. The visible feature impact is
material. Their tests establish the unavailable presentation only. Full functional
management acceptance remains open, with source-backed real data/actions to be inventoried
before any restoration. Other large Project LLM panel replacements require their own
functional coverage and finding disposition before whole-page acceptance.

## Reproduced test sets and gates

All interpreted runs used NODE_ENV=test, removed DATABASE/DIRECT_URL/REDIS/UPSTASH/NEON/
QSTASH runner bindings and installed the pre-import offline network guard. Programmatic
config:false runners used explicit app aliases and React plugin for mounted app tests.
UI used the existing package config with an absolute guard setup path. Raw runner output
was captured and reduced to counts and fixed case names.

| Selection | Independent result |
| --- | --- |
| Submitted UI six-file selection | 66 passed, exit 0 |
| Sol lifecycle file after adding initial StrictMode visit assertion | 6 passed, 1 failed, exit 1 |
| Changed SHC mounted tests | 18 files, 56 passed, exit 0 |
| Changed SkillUp helper/page tests | 7 files, 22 passed, exit 0 |
| Report and newsletter | 2 files, 8 passed, exit 0 |
| New report selection-change control | 1 failed, exit 1 |
| Event type/retry/linked transport, analytics HTTP and topic schema | 5 files, 9 passed, 4 failed, exit 1 |
| Export trigger/URL/status/download and admin context | 5 files, 60 passed, 7 failed, exit 1 |

Counts overlap and remain separate. The last selection retains four distinct failures.
Registered type mismatch invokes the handler. Handler failure leaves an idempotency marker
that causes the next retry to be acknowledged without another handler attempt. HTTP 503
resolves as successful analytics dispatch. Named topic complexity is silently discarded.
The event verifier, transport and stores are fixtures, with physical queue/store semantics
unexecuted.

The security selection reproduces six foreign-tenant export failures across trigger,
URL, status, missing-job fallback and both download paths, plus one conflicting admin
tenant failure. The 67 selected cases use disposable signed credentials and isolated
resource/storage adapters. They establish the tested source boundary failures, with
actual physical tenant routing unexecuted.

Installed tsc --noEmit checks for packages/ui, apps/skillup-web, apps/realtutorialhub-web,
apps/skillhubcore-admin, apps/api-server and packages/events all exit 0. Inclusion follows
the existing project configs, with UI/API/SkillUp tests excluded as documented in the
handoff. No comprehensive repository test typing, build or lint pass is claimed here.
Review-range git diff --check reports an extra EOF blank line in
packages/marketing-site/src/lib/analytics/providers/__tests__/internal-http-failure.test.ts.
The submitted range therefore retains a whitespace failure.

An initial UI command used an unsupported CLI setup flag, and a programmatic retry used
a relative setup path resolved under packages/ui. Those runs did not execute tests.
The absolute setup path rerun produced the interpreted 66 passes. Sol added two focused
regression assertions and review/assignment records. Production code was not edited.

## Incidents and scope dependencies

Terra recorded a mounted-page test whose failed mock allowed configured GET fetch attempts.
No successful response was observed and destination arrival remains unknown. This violates
the offline execution boundary. The later intercepted tests cannot establish what occurred
in that earlier run. The pre-import transport/socket/DNS guard is now mandatory for all
review and implementation runners, with an intercepted positive before invoking app code.

Terra also recorded a read-only inspection that displayed a tracked fixed admission
credential in tool output. Sol confirmed only file tracking, email lookup and credential
field presence through boolean output, suppressing the value. Current credential validity,
affected accounts and wider exposure are unverified. Source correction and account-level
remediation require separate evidence. Existing secrets must never be printed, reused or
copied into tests. Physical account actions remain outside the offline assignment.

The services/project-ai backend and apps/skillup-admin admission consumer are genuine
scope gaps in the previous manifest roots. The updated assignment permits targeted source
inspection and isolated backend tests there, with bounded runtime authority as specified.
The API schema directory is also explicitly added so a confirmed schema mismatch can be
resolved without another administrative scope loop.

## Architectural disposition and continuation

The verified tenant plus tenant-local subject is selected as the ownership tuple.
SHC projections remain references and cannot replace learner ownership or merge equal
emails. Ambiguous historical export/progress provenance must deny. This policy alone
does not supply missing schema/deployment facts. Terra must deliver an exact source/data
manifest and draft compatible migration for any persisted key expansion before that
dependent runtime rollout. Physical migration and backfill remain separately authorized.

For analytics, a fulfilled HTTP error response is failed dispatch. A narrow sanitized
non-OK rejection is authorized now, retaining 2xx success and transport failure behavior.
This selects no new retry scheduler, outbox or delivery guarantee.

For taxonomy, silent loss of an explicitly supplied complexity value is unacceptable.
Numeric complexityLevel remains supported. Until an authoritative named-to-numeric mapping
is established, reject unsupported named complexity through existing validation/error
handling. Coordinate actual client behavior and compatibility. Do not invent an expert
level or accept a value that is then ignored.

For shared events, registered type and payload type must agree before effects. Domain
producer and consumer registrations must be migrated together. A handler failure cannot
be acknowledged as completed work. Deliver the exact claim/commit/retry compatibility
manifest with worker-owned markers, immutable event keys, crash/replay and same-correlation
controls before changing shared idempotency semantics. A simple marker deletion or moving
the write after the handler does not establish atomicity and is not an approved guarantee.

The active FND01-FND30 assignment retains every task and now includes these bounded
priorities and scope clarifications. Continue independent W2/W3 tasks while physical
ownership and policy dependencies are resolved. Batch 08, BROWSER-01 and RC-ID-01 remain
IN_PROGRESS. Sol retains group acceptance and W4 entry decisions.
