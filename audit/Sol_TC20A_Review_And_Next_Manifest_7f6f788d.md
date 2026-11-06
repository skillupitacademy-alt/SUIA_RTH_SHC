# Sol TC20-A independent review and next manifest

Date: 2026-11-06. Assigned role: Sol, architect and final acceptance. Runtime: Codex;
exact backend variant not exposed. Branch remediation/w1-2-batch-05-targeted.
Production source: 123a5450eb3d0817e5b26870de080966a059754c. Gemini test/report revision:
7f6f788d7242804bb17756dc93b0a72d8b530184. Main checkout started clean. Argon is the sole
critical implementation owner; Gemini independently tests, Sonnet owns noncritical work.
D1-D7 and the full Argon TC01-TC20 packet remain in force.

## Disposition

TC20-A overall: CHANGES_REQUESTED. Accept the two-call tracker amendment and the selected
FAIL-04 pipeline containment within the independently tested process-local boundary.
Do not label all downstream entry points secure. The merge boundary below fails a
requirement of the original delegation: no cross-brand identity linking.

No TC20/FND23/W1-W3 group closes. TC20-A2 ingress authority, TC20-B durable events,
physical effects, BROWSER-01 and RC-ID-01 remain open. This review authorizes no push,
main merge, deployment, live database, browser, queue or migration execution.

## Reproduced evidence and attribution corrections

Sol ran the same two-directory analytics selection using startVitest with config:false,
watch:false, maxWorkers:1, fileParallelism:false, environment:node, reporters:verbose,
silent:true, excluding node_modules and .worktrees, and loading
audit/W1_W3_Offline_Test_Network_Guard.ts before application imports. Credential variables
matching DATABASE|DIRECT_URL|REDIS|UPSTASH|NEON|QSTASH were removed from the process.
Result: exit 0, eight files, 26 passed, zero failed. The package typecheck command
pnpm --filter @quiz/marketing-site exec tsc --noEmit also exited 0 independently.

| File | Actual passing cases |
| --- | --- |
| gemini-tc20a-verification.test.ts | 11 |
| tc20a-brand-isolation.test.ts | 2 |
| marketing-phase2.test.ts | 4 |
| brand-dedupe-control.test.ts | 2 |
| marketing-intelligence.test.ts | 2 |
| tracker-provider-http.test.ts | 1 |
| ingest-failure-behavior.test.ts | 1 |
| providers/__tests__/internal-http-failure.test.ts | 3 |

The total 26 is reproducible. Gemini's per-file 9/8 counts are incorrect and its list
omits the three provider cases. Its baseline paragraph confuses file and case counts:
the earlier frozen caller source had 13 passed / 2 failed across seven files, not
six passed / one failed test. Correct the report without erasing historical observations.

The Gemini commit changes only three permitted test/audit paths. marketing-phase2 has
only the three approved brandId additions. brand-dedupe-control.test.ts is unchanged
between 2ca1889b and 7f6f788d. The tracker production diff is the approved two arguments.
Some independent negative cases assert throws rather than snapshotting every state;
the implementer suite supplies additional store-count snapshots. Attribute both layers.
The manual distinct-ID feature/journey checks do not alone prove ID production; the
actual composed pipeline positive in Argon's suite supplies that linked evidence.

The report's claim of complete elimination across every subsystem is rejected. This
review's conclusion is bounded to source and observed effects, not the review model name
printed in a prior document. Assigned role Sol does not imply a specific runtime model.

## New confirmed merge-entry failure

Source: packages/marketing-site/src/lib/analytics/identity/user-merge-engine.ts,
mergeIdentityNodes(primaryId, secondaryId). It resolves each node using a brand-prefixed
ID, then merges without comparing the nodes' brands. The resolver caller supplies
same-brand nodes in the tested pipeline, but the merge entry itself has no such guard.

Sol added audit/Sol_TC20A_Merge_Boundary_7f6f788d.test.ts with synthetic in-memory nodes.
Under the same isolated guarded runner it produces exit 1, one passed / one failed:

- Legitimate RTH-to-RTH merge passes.
- RTH primary plus SUIA secondary mutates both nodes, marks the SUIA node mergedInto
  the RTH identity and creates an authenticated_transition edge across brands. The
  required no-mutation denial fails. No real account, service, database or network used.

This is an exported module-entry defect. No HTTP reachability, live account compromise
or direct external exploit is claimed. It still contradicts the selected identity
boundary and prevents full TC20-A acceptance. Do not delete or invert the denial control.

## Immediate Argon corrective manifest: APPROVED

Production editable file only:
packages/marketing-site/src/lib/analytics/identity/user-merge-engine.ts.

Require both resolved nodes to have a supported explicit brand, equal to each other,
before any node write or graph-edge addition. Use existing canonical analytics brands
realtutorialhub and skillupitacademy; do not alias skillup or SHC implicitly. Missing,
unknown or conflicting brand must produce a sanitized denial/undefined without mutation.
Preserve missing-node and same-node behavior and legitimate same-brand merge semantics.
Do not use prefix equality alone as a replacement for the resolved node's verified
store scope/brand consistency. Do not redesign merge heuristics, scoring or persistence.

All other TC20-A production files are frozen. If this exact guard needs a shared export
or another file, submit a specific amendment before editing it. Argon may update only
its scoped handoff audit/Argon_W1_W3_Critical_Handoff.md for evidence. Work locally from
the actual current clean source, record full revision, run graph update and freeze.

Gemini retains independent files and must rerun the unchanged Sol merge probe plus the
26-case selection and package typecheck. Add its own reverse-direction, unknown/missing
node-brand, same-brand deterministic merge/continuity and before/after node/index/edge
controls in gemini-tc20a-*.test.ts. Avoid test hooks that bypass the actual merge/store.
Keep brand-dedupe-control.test.ts unchanged. Fix report counts and overclaims in
audit/Gemini_TC20A_Independent_Review.md, recording source/test revisions separately.
No production edits by Gemini. Sol then decides limited TC20-A acceptance.

## Next slice TC20-A2: manifest approved, writes contingent on merge freeze

Argon's four-file ingress manifest is approved for the contract below after the merge
correction is frozen for Gemini. Because it touches tracker/config consumers from A,
use a separate clean worktree/branch rooted at that corrected source; do not edit the
checkout Gemini is verifying. No shared-checkout concurrent writers.

Exact production paths:

1. packages/marketing-site/src/config/analytics.ts
2. packages/marketing-site/src/lib/analytics/server/route.ts
3. services/analytics-collector-service/src/index.ts
4. packages/marketing-site/src/lib/analytics/tracker.ts

Select explicit server-controlled ingress binding. For this bounded implementation,
each receiving deployment/application instance must have one configured supported
analytics brand (server-only ANALYTICS_INGRESS_BRAND). Do not derive it from the event
body, x-analytics-brand, Origin or forwarded headers. A collector instance without that
binding is unavailable, not a default RTH endpoint. This is a deployment prerequisite;
no environment file editing, secret inspection, infrastructure change or restart is
authorized. If existing deployment requirements need one collector serving multiple
brands, submit the verified routing/configuration manifest first; no invented shared
credential or client-selected tenant fallback is approved.

Keep existing browser/config convenience resolution behavior separate from strict
server ingress resolution so unrelated callers do not silently change. Implement a
strict server resolver within config/analytics.ts. Validate configured brand against
the existing analytics vocabulary. Missing/invalid server binding returns sanitized
503 analytics_ingress_unavailable before parsing/private ingestion or mutation.

For the public Next route, additionally validate the request authority against the
exact configured brand hostname allowlist. Parse host/port safely, reject malformed,
userinfo, deceptive suffix and conflicting request/Host authorities, and require
exact registered host equality rather than endsWith brand inference. Do not trust
X-Forwarded-Host without an independently reviewed proxy boundary. Supported local/test
origins must be explicitly supplied in a typed server configuration/test fixture; no
wildcard localhost or automatic unknown-host mapping. If a real mounted route cannot
prove its authority under the current proxy, fail unavailable and inventory the needed
adapter rather than trusting a client header. The collector's dedicated brand binding
is authority even when its service hostname is neutral; its transport/routing protection
must be documented separately and does not authenticate an event's claimed user.

Body or x-analytics-brand hints may be absent. Any present unsupported, malformed or
different brand hint is rejected with sanitized 400 invalid_analytics_brand_context
before pipeline invocation; matching hints are consistency checks only. Handle headers
with repeated/comma-combined values explicitly, never choose the first valid brand.
Unknown/foreign public host is rejected, with no RTH fallback and zero ingestion effects.
Preserve legitimate 202 and rate-limit/error behavior. Do not leak configuration values
or raw error objects into responses/logs.

For the tracker, validate partialContext.brandId if present and reject any invalid or
different value before identity/session mutations. Pin the normalized outgoing event's
brand to the validated baseContext.brandId after context spreading. Do not move trust
to a client-provided metadata field or rewrite user/session semantics incidentally.
Preserve existing event context shape, provider behavior and same-brand positives.

Public analytics remains untrusted telemetry. This selects the receiving brand namespace,
not authenticated user identity, entitlement, financial completion or approval authority.
No claim of cryptographic browser-user provenance follows from allowed-host checks.

Gemini A2 test manifest is independent new gemini-tc20a2-*.test.ts files under analytics
tests and collector tests, plus audit/Gemini_TC20A2_Independent_Review.md. Exercise both
actual request handlers using synthetic Requests/Hono in-memory requests, not a listening
server. Disable collector autostart before imports, install the network guard first,
clear credentials, restore environment overrides, and simulate downstream effects.
Required positives/denials include both brands, neutral dedicated collector host,
absent/matching/foreign/unknown header/body, malformed authority, explicit local origins,
missing/invalid deployment binding, tracker context override, and zero mutations on every
denial. Retain the 26 downstream cases, merge controls, marketing-site and collector
typechecks. Tests must not hide ingress policy behind a mocked resolver.

## Continuing full assignment and remaining decisions

Argon still owns all TC01-TC20 and critical FND01-FND30 work; this is a priority amendment,
not a replacement two-task assignment. All other statuses in the 2ca1889b Sol checkpoint
remain open unless explicitly updated here. TC18 manifest with a document/** wildcard
is not an exact helper list; enumerate storage, import, delivery and validator changes
before production approval. TC17's proposed list omits the immediate exam.engine.ts
resolver used by the retained delimiter probe and does not cover versioned producers/
retrieval; revise that manifest before implementation. TC20-B must name the remediation
worker and durable claim store/transaction/producer adapters. Correlation-to-ID or
type-only edits without those caller migrations cannot satisfy D7.

Gate 1's D4 human/no-self-approval policy is already selected. Argon must submit the
persisted schema/service/route manifest; it need not ask Sol to choose the same policy
again. Physical schema application remains separately gated. Disjoint read-only
inventories may proceed while Gemini verifies the frozen merge correction.

Next required model: Argon for the one-file merge guard; Gemini for independent frozen
verification/report correction; Sol for TC20-A acceptance. Argon may then execute the
approved four-file A2 manifest in isolation while continuing independent critical
inventories. Sonnet retains noncritical work. No external agent dispatch is claimed.
