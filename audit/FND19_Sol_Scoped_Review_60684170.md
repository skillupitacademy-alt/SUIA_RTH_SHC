# FND19 independent scoped review

Reviewed by Sol / Codex on 2026-11-06 at submission 60684170. Disposition VERIFIED for
the isolated domain POST numeric-type rejection and the 27 schema assertions actually
executed. FND19 as a whole remains PARTIAL and IMPLEMENTED_UNVERIFIED outside that
bounded verification. All nine groups and the thirty-task assignment remain open.

## Independently reproduced result

The two actual POST handler controls pass with the admin guard and DB adapter mocked.
A valid name returns 201 and a JSON number name of 42 returns 400 before the insertion
values call. The current domainSchema accepts a nonempty string, including the string
"42". A rule rejecting all numeric-looking strings was neither implemented nor selected
by this verification. The actual sanitization/schema functions run in these tests.

The hierarchy contract selection passes 27 tests. Together, the two files report
29 passes, exit 0. The config:false runner uses jsdom, the React plugin, explicit SHC
@ alias, one fork worker and the pre-import offline network guard. Live DB/cache/queue
bindings were removed and NODE_ENV=test. No physical HTTP server or database was used.

The tested schemas define all five named entities. Their existence and selected parser
behavior are established. Complete canonical contract consolidation and integration into
every taxonomy ingress/egress remain open. The new SHC schema module overlaps the API
schema module and requires the existing W3 consumer/canonical-owner reconciliation.

## Submission corrections

The manifest describes skillSchema as validating topicId, skillIds and optional URLs.
Those fields are absent from the actual skill schema and tests. Current skill assertions
cover name, category and mappingType. UUID validation applies to the schemas that declare
UUID fields. The schema test does not reject domain string "42". Correct those details
before using the manifest as complete coverage evidence.

The POST handler acquires getDb before parsing. The fixture verifies no insertion values
call for a numeric name, with no physical DB involved. Describe the ordering as denial
before persistence effects rather than a proved absence of every DB access. Physical
constraints, auth, other route integration and historical data remain unqualified.

git diff --check a239ca39..60684170 passes. No new production code was needed in this
review. Existing quality-gate limitations remain recorded, with no fresh full package
typecheck or build pass claimed here.

## Ledger and selection reconciliation

The new thirty-task ledger exists locally, but is ignored by the repository status-file
pattern and was absent from tracked files at review start. It needs deliberate inclusion
to become portable handoff evidence. Its category totals are routing labels and cannot
establish completed scope or replace the actual findings register.

The ledger FND02 section still lists the StrictMode and stale-report corrections as
remaining, using the earlier Sol failure counts. Those two focused selections now pass.
Sol independently reran eight lifecycle cases and ten report cases in this checkpoint,
each exit 0 under guarded config:false runners. This resolves the focused count dispute.
A separate reported 140-failure run needs exact commands, selected files, alias/setup
configuration and diagnostics. It cannot replace the passing focused results or be
discarded without diagnosis. Larger provider integration remains its own gate.

Current report count is ten when both sol-report-truth-boundaries.test.tsx and
exam-summary-truth.test.tsx are selected. Seven refers to the latter file alone. Exact
selection must accompany every count. These reruns retain mounted jsdom/intercepted
transport limits and do not establish authenticated browser behavior.

## Continuation

Proceed with authorized independent FND12-FND17 and W3 implementation while Sol reviews
other stable slices. Retain all thirty FND tasks as the complete active assignment.
Do not mark reconciliation of every finding complete merely because a thirty-row ledger
exists. Prioritize concrete remaining root causes, canonical schema ownership and actual
caller integration, with policy requests limited to their dependent runtime edits.

Sol's edits in this checkpoint are review/manifest/ledger documentation only. No new
task list replaces the existing FND01-FND30 assignment, and W4 readiness remains open.
