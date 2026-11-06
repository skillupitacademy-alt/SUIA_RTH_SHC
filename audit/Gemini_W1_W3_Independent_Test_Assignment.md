# Gemini independent foundation testing packet

Assigned by the owner through Sol on 2026-11-06. Gemini owns independent test design,
test changes, execution and evidence for the remaining foundation work. Read
W1_W3_Model_Routing_And_Handoff_Protocol.md and declare actual runtime identity if
available, assigned testing role, exact source/test revision and next handoff.
Sol owns architectural acceptance. Production fixes belong to Tera or Sonnet by risk.

## Test ownership and execution contract

Use a frozen submitted revision or isolated review worktree. Record source revision,
test revision, normal entry point, simulated dependencies, command, configuration,
environment, exit code and fixed safe observations. Install the existing network/socket/
DNS guard before app imports and remove live DB/cache/queue bindings. Use disposable
keys and restore overrides. No secret-bearing output. Live DB/browser/queue tests need
their separately authorized readiness gate and observed results.

Implementers may run existing checks while coding. Gemini supplies the independent
adverse/composition evidence and owns its test files during review. Do not fix production
code or alter an expected denial to match insecure behavior. A diagnostic alias may
help isolate an import failure, but it cannot count as a repaired runtime package export.
Use actual predicates/callers rather than fixtures that return the desired row regardless
of the query. Keep fixture and physical guarantees explicit.

## Independent test matrix

| Item | FND linkage | Required observable acceptance |
| --- | --- | --- |
| GM01 | FND01/FND12/FND17 | Validate unique enumerated finding/caller rows, classifications, current dates/source refs, accurate counts and no invented exhaustive coverage. |
| GM02 | FND02/FND26 | Reproduce exact focused baselines and diagnose larger failures/timeouts by selection/config. Preserve interrupted/filtered outcomes and configured test-type inclusions. |
| GM03 | FND03/FND06/FND18 | Missing/empty/unknown tenant, ordinary tenant-admin cross-access, summary-helper consistency, local/projection difference and legitimate positives through every public helper. |
| GM04 | FND03/FND18/FND24 | Actual profile GET/PATCH and guard/caller composition with trusted actor/resource sources. Verify package imports, typechecks and sanitized denial; no test-only module alias hiding failures. |
| GM05 | FND03/FND05 | Inspect migrations/metadata for unknown-provenance quarantine, schema/key/FK compatibility and real producer/repository propagation. Physical migration/SQL checks remain separately gated. |
| GM06 | FND11 | Normalize email, discriminate actual platform/deleted predicates, independent equal-email tenant accounts, foreign binding denial, ambiguity, concurrency design and secure admission flow. |
| GM07 | FND04 | All six retained foreign-tenant export denials plus both directions, unknown provenance, job/exam/worker/cache/storage and legitimate owner/internal positives; denial before effects. |
| GM08 | FND05 | Four progress lanes independently. Trusted identity, wrong tenant/user, canonical membership, exact historical replay and actual caller/repository composition. |
| GM09 | FND05/FND21 | Concurrent distinct completion, retry, duplicate/conflict and partial transaction outcomes. Do not call serialized map tests SQL or cross-instance isolation. |
| GM10 | FND07 | Private cache no-write/no-stale-read, public cache positive, A/B mounted and remount, pending response/callback, hidden/session/StrictMode/teardown and queue acknowledgement. |
| GM11 | FND08/FND09 | Verified actor ignores forged body identity, absent/unauthorized/stale/wrong-workflow approval denies before writes, valid approval and safe replay. |
| GM12 | FND10 | Validate exact readiness/build/source/account/store recipes. Execute only separately authorized browser/gateway/physical tests and keep missing prerequisites visible. |
| GM13 | FND13 | Missing profile null, source-backed profile values, all raw similarity uncalibrated/null, invalid/nonfinite/unknown/reordered/subset vector responses, catalog order, no jobs, DB/service failure and actual handler auth/serialization. |
| GM14 | FND14 | Real report child rendering, zero versus missing, aggregate/detail uncertainty, A loaded/B pending/failure, obsolete response and backend timing contract compatibility. |
| GM15 | FND15/FND16 | Reference/unavailable/sample disclosure, legitimate feature retention, no false approval/health/certification, and each form's actual committed/accepted/unknown/rejected contract. |
| GM16 | FND19 | All five actual taxonomy entity callers/ingress/egress, numeric/named historical compatibility, identifiers, errors and canonical schema ownership. |
| GM17 | FND20 | Editor/bulk/schema/API/service/scorer round-trip, option identity, comma-containing text, duplicate/malformed input, partial/wrong credit and historical adapters. |
| GM18 | FND21/FND22 | Nested valid historical/structural/versioned content, malformed/unknown child and authoring example injection; hash positive/nonhex/case/HTTP/service/approval evidence boundaries. |
| GM19 | FND23 | Actual publisher/consumer/worker types, signature/tenant/event identity, same correlation distinct IDs, payload conflict, crash/commit/retry, cross-brand dedupe and positive compatible delivery. |
| GM20 | FND24-FND30 | Integrated affected suites, supported static/lint/build/whitespace gates, compatibility/principle evidence, complete per-group finding map and accurate W4/final packet. |

## Required handoff result

For failure, notify the user which implementation model is required, with exact item,
source revision, command, actual outcome and legitimate positive. Return critical
production failures to Tera and noncritical view/docs failures to Sonnet. For undefined
architecture or contract authority, send one decision-ready packet to Sol with supported
options and a recommendation. Continue independent test work in isolation.

For a stable passing slice, report the precise verified boundary and remaining gates,
then notify the user that Sol is required for architecture/integration acceptance.
Do not label task/group CLOSED, claim a main merge or impersonate Sol's approval.
Keep every retained security invariant required until the actual correction passes it.
All thirty FND tasks and nine groups remain accountable to the complete foundation scope.
