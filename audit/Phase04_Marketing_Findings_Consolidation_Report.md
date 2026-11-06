# SUIA Marketing — Phase 04 Principal Architect Findings Consolidation Report

**Date:** 2026-11-01
**Repository:** `skillupitacademy-alt/SUIA_RTH_SHC`
**Pinned source commit:** `5efd1129d905d05c912acfef66e52df9ca15120b`
**Git subtree:** `a1753abdf166364bdc76c55df6ed33e1a014a8c4`
**Scope:** Source-led consolidation for `packages/marketing-site/src/`, plus audit evidence review.
**Decision:** **Phase 04 evidence-based consolidation delivered; complete historical-ledger certification NOT PASSED; production release NOT APPROVED.**

## Executive assessment

The Phase 03 assessment contains **eight source-backed integration findings (P03-01–P03-08)**. They resolve to **six root-cause families**, not eight independent root causes. Several are connected to existing MKT IDs (especially MKT-223, MKT-228, MKT-285, MKT-286); others have **no proven canonical MKT mapping**. Phase 01 and Phase 02 supplied evidence classifications and partial source review, not a full text register of MKT-001–286. Thus a 286-entry item-by-item deduplication, closure state, and fix validation **cannot be certified**. **Do not infer that 286 issues remain open or that any is resolved.**

The principal architectural blockers for source-level sign-off are provider consent enforcement, brand-scoped tracker isolation, durable delivery and truthful acknowledgement, and conflict-safe identity resolution. All deployment/runtime claims remain qualified until validated in integration testing.

## Scope, inputs and evidence boundaries

Read `Phase01_Marketing_Coverage_Audit_Report.md`, `Phase01_Marketing_Evidence_Summary.json`, `Phase02_Marketing_Source_Audit_Report.md`, `Phase02_Marketing_290_File_Review_Tracker.csv`, `Phase03_Marketing_Integration_Security_Audit_Report.md`, `FinalAechitecture.md`, `ProjectAuditReport.md`, and `ResolveProjectAuditReport.md`. Phase 01 inventory: 290 source files; 106 pinned-retrieved, 45 historical-report-only, 139 no mapped path evidence. Phase 02: 20 additional pinned source files retrieved; at least 126 with pinned-source retrieval evidence. **Retrieval evidence is not complete line-by-line certification.** The historical master MKT register containing each ID's full canonical description, owner, fix commit and test result is not supplied in these documents. The counts represent historical audit IDs, not a validated live defect population.

No production deployment, tests, database, pipeline runtime, network delivery, or remediation branch was executed here. Phase 03 source excerpts and exact line references are the authoritative source-level evidence for the eight entries; listed architecture documents express desired design, not deployed reality.

## Consolidation methodology

1. Maintain immutable source and independent stable Phase-03 identifiers. No automatic new MKT-287+ IDs.
2. Group by independently correctable **root cause**, not by occurrence count or file count.
3. Preserve distinct failure modes as testable subcases under one root family where applicable.
4. Link existing MKT IDs **only** where preceding reports explicitly establish relevant overlap; mark adjacent/not-equivalent cases rather than silently merging.
5. Assign **source-confirmed**, **conditional**, and **runtime-unverified** statuses separately; never infer remediation status from audit documentation.
6. Block release approval where a high-severity integrity/consent/security issue is not remediated and retested.

## Root-cause families and decisions

| Root cause | Related findings | Severity | Consolidation | Release implication |
|---|---|---|---|---|
| **RC-01 Consent enforcement** | P03-01 server; P03-07 direct browser APIs | High | One family, two independent bypass paths | **Blocker candidate** |
| **RC-02 Tenant/brand isolation** | P03-02 singleton | High | Distinct from identity scoping | **Blocker candidate** |
| **RC-03 Delivery reliability** | P03-03 server; P03-08 client | High | Shared delivery family with independent per-provider subcases; MKT-223/228 adjacent | **Blocker candidate** |
| **RC-04 Identity merge correctness** | P03-04 | High | Conflicting merge and missing namespace; MKT-226 hashed-data issue is adjacent, **not necessarily duplicate** | **Blocker candidate** |
| **RC-05 Consent storage/schema** | P03-05 | Medium/High | Storage exceptions overlap MKT-285; invalid schema remains distinct acceptance test | Must fix |
| **RC-06 Persistent preference UX** | P03-06 | Medium/High | Provisional until site-wide launcher is checked | Verify and correct if absent |

### Detailed findings and remediation acceptance

#### P03-01 — High — Server-side consent enforcement absent

- **Source evidence:** `lib/analytics/tracker.ts:145-159; lib/privacy/consent-manager.ts:52-63; lib/analytics/server/route.ts:14-31; lib/analytics/server/pipeline.ts:261-266`
- **Existing MKT alignment:** No proven canonical MKT crosswalk.
- **Decision:** Retain as distinct candidate.
- **Recommended owner role:** Security + Analytics.
- **Remediation:** Implement trusted consent proof and server-side provider gate.
- **Evidence needed to close:** Negative consent matrix; direct POST; revocation; expiry.
- **Evidence qualification:** Source-confirmed enforcement gap; jurisdictional applicability untested.

#### P03-02 — High — Analytics singleton not brand-scoped

- **Source evidence:** `lib/analytics/tracker.ts:197-229`
- **Existing MKT alignment:** No proven canonical MKT crosswalk.
- **Decision:** Retain as distinct candidate.
- **Recommended owner role:** Analytics Platform.
- **Remediation:** Key tracker by brand, test config invariants.
- **Evidence needed to close:** Shared-runtime two-brand routing and provider tests.
- **Evidence qualification:** Source-confirmed API invariant; shared runtime deployment unknown.

#### P03-03 — High — Analytics acknowledgements can mask delivery failure

- **Source evidence:** `lib/analytics/server/pipeline.ts:84-113,122-148,249-275,327-335; lib/analytics/server/route.ts:33-39`
- **Existing MKT alignment:** MKT-223; MKT-228; related MKT-286.
- **Decision:** Merge under delivery reliability root-cause family; preserve individual failure modes.
- **Recommended owner role:** Analytics Platform / SRE.
- **Remediation:** Durable queue; response.ok checks; per-provider result and replay.
- **Evidence needed to close:** HTTP 4xx/5xx, timeout, partial successes, restart and replay.
- **Evidence qualification:** Source-confirmed failure path; infra not tested.

#### P03-04 — High — Conflicting identifiers merged; identity not brand-namespaced

- **Source evidence:** `lib/analytics/identity/user-merge-engine.ts:19-45; identity-store.ts:20-41; identity-resolver.ts:35-96`
- **Existing MKT alignment:** MKT-226 adjacent but not equivalent.
- **Decision:** Separate merge-conflict finding from hashed-identifier finding.
- **Recommended owner role:** Identity / Security.
- **Remediation:** Conflict quarantine; deterministic merge rules; brand scoping.
- **Evidence needed to close:** Cross-brand collision and conflicting authenticated identities.
- **Evidence qualification:** Merge behavior source-confirmed; deployment scope unverified.

#### P03-05 — Medium/High — Consent storage exceptions and invalid records

- **Source evidence:** `lib/privacy/consent-storage.ts:10-18,22-27; lib/privacy/tracking-permissions.ts:8-12; components/privacy/ConsentBanner.tsx:11-17`
- **Existing MKT alignment:** MKT-285.
- **Decision:** Merge storage-exception portion with MKT-285; retain invalid-schema subcase.
- **Recommended owner role:** Frontend / Privacy.
- **Remediation:** Runtime consent schema; fail-closed fallback; guarded storage.
- **Evidence needed to close:** Malformed JSON/object, blocked storage, expiry and recovery.
- **Evidence qualification:** Invalid object can throw in consumer; no runtime test.

#### P03-06 — Medium/High — Consent banner lacks reopening control

- **Source evidence:** `components/privacy/ConsentBanner.tsx:11-17,28-47`
- **Existing MKT alignment:** No proven canonical MKT crosswalk.
- **Decision:** Provisional pending global site preference control verification.
- **Recommended owner role:** Frontend / Privacy.
- **Remediation:** Persistent accessible preferences/revocation entry.
- **Evidence needed to close:** Site-wide consent preference launcher and keyboard test.
- **Evidence qualification:** Local component missing launcher; global alternative not established.

#### P03-07 — Medium — Direct analytics operations bypass consent-gated flush

- **Source evidence:** `lib/analytics/tracker.ts:109-132,145-152,240-268`
- **Existing MKT alignment:** P03-01 related; distinct execution path.
- **Decision:** Subcase within consent-enforcement family, retain separately testable behavior.
- **Recommended owner role:** Analytics / Privacy.
- **Remediation:** Unify permissions for track, identify, pageview, properties.
- **Evidence needed to close:** Consent-negative direct APIs and pageview tests.
- **Evidence qualification:** Source-confirmed client API path.

#### P03-08 — Medium — Client provider failures discarded

- **Source evidence:** `lib/analytics/tracker.ts:145-174; lib/analytics/providers/internal.provider.ts:19-28`
- **Existing MKT alignment:** MKT-223 and MKT-228 related.
- **Decision:** Subcase within delivery family.
- **Recommended owner role:** Analytics Platform.
- **Remediation:** Provider-level retries and response status validation.
- **Evidence needed to close:** Offline, transient failure, partial provider outage.
- **Evidence qualification:** Source-confirmed no requeue for failed providers.

## Other historical source-audit issue families (not fully deduplicated)

These historical IDs have concrete references in prior round summaries, but **were not included in a complete canonical MKT register**; preserve them for Phase 04 follow-up rather than assigning final status:

| Family | Known historical IDs | Disposition |
|---|---|---|
| Content integrity/course marketing | MKT-255–257, MKT-261, MKT-262, MKT-274, MKT-275 | Validate published claims, schedule, grading and data contracts; no remediation proof |
| Unsafe source-mutation scripts | MKT-276, MKT-279–281 | Quarantine legacy rewriting and replace with validated migrations |
| UX, keyboard and navigation | MKT-219, MKT-240–242, MKT-282, MKT-283 | Accessibility verification and correction |
| Animation/scroll integration | MKT-245, MKT-249, MKT-260, MKT-284 | Lifecycle tests and initialization consistency |
| HTML injection | MKT-271 | Replace `innerHTML` with JSX text; severity/production-input trust review |
| Analytics lifetime and consent | MKT-223, MKT-225, MKT-226, MKT-228, MKT-285, MKT-286 | Crosswalk to RC-01/03/04/05 where justified; avoid falsely treating all as duplicates |

## Remediation ordering and release gates

**Priority A — block source-level approval:** (1) server/client consent policy and negative tests (RC-01); (2) brand-keyed analytics tracker and cross-brand tests (RC-02); (3) durable event outbox/queue, provider `response.ok`, idempotency, replay and failure transparency (RC-03); (4) conflict-safe and brand-aware identity policy (RC-04). Each needs a reviewed fix commit plus automated failure-mode evidence. These are **blocker candidates pending owner triage**, not evidence that a release currently occurred.

**Priority B — before production approval:** (5) fail-closed runtime consent schema and storage adapter (RC-05); (6) persistent preference UI verification (RC-06); (7) eliminate `innerHTML` fallback, fix major accessibility/navigation defects, ensure course claims match verified source of truth and test animations/CTAs.

**Priority C — audit governance:** obtain the complete 286-item historical findings register, assign each old ID a canonical title/source/evidence, root-cause family, severity, owner, fix commit, test evidence and disposition; reconcile phase 03 with that register. Repeat against the intended release commit; the pinned snapshot is not necessarily the release branch.

## Acceptance matrix

| Exit criterion | Result | Explanation |
|---|---|---|
| Phase 03 eight findings accounted for | **PASS** | 8/8 items present in machine-readable crosswalk |
| Root-cause grouping and prioritization | **PASS, provisional** | 6 families with distinct path/subcase details |
| Known prior MKT overlaps explicitly marked | **PASS, limited** | Only supported mappings recorded |
| MKT-001–286 exhaustively reconciled | **FAIL** | Historical canonical per-ID register not available |
| Fix status and current code retested | **NOT VERIFIED** | No remediation commit or test evidence supplied |
| Production approval | **WITHHELD** | High-severity source-level blockers and missing tests |

## Phase 05 handoff

1. Obtain canonical MKT-001–286 export and remediation tracker, then create exact one-row-per-ID crosswalk with duplicate-parent pointers; do not invent old text or fix states.
2. Require reviewed corrective commits and explicit acceptance artifacts for RC-01–RC-05, plus site-wide consent preference validation for RC-06.
3. Run negative consent matrix, multi-brand isolation, delivery/replay/timeout, identity-conflict, accessibility and course navigation/content tests.
4. Reconcile Phase 02's incomplete per-file proof; issue full source coverage certificate only if every path has sufficient pinned-commit evidence.
5. Deliver conditional architecture risk report. **No unconditional production sign-off** absent these gates.

**Principal Architect decision:** The Phase 04 *consolidation deliverable* is completed for the evidence available. The stronger Phase 04 exit criterion—definitive deduplication and disposition of all 286 historical IDs—**is not achieved**, and must remain open. No source code was changed.
