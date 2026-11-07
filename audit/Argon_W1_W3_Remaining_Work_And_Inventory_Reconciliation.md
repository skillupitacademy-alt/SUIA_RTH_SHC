# Argon W1–W3 Remaining Work, Mechanical Inventory Reconciliation, and Physical Gate Readiness Packet

- **Author Role**: `Argon` (Critical Production Implementer — `Gemini 4 Argon (Medium)`)
- **Repository**: `E:\onlinewebsites\quiz-platform` (`skillupitacademy-alt/SUIA_RTH_SHC`)
- **Branch**: `remediation/w1-2-batch-05-targeted`
- **Accepted Baseline Revision (Sol Slice 20 Acceptance)**: `e828ce2a96549f6cfd47934c0c9ae29239125fbb` (`e828ce2a`)
- **Frozen Slice 21 Production + Inventory SHA (`SOURCE_SHA`)**: `d5f58b18fba226da69af3408db544ef356f75fb9` (`d5f58b18`)
- **Accepted Slice 20 Production SHA**: `dc75ace5286d2b0f0da97a8d3e9406f809dec46a` (`dc75ace5`)
- **Accepted Slice 20 Test Adaptation SHA**: `5614579187bfd28b36e770d2739e61037eb3da74` (`56145791`)
- **Accepted Slice 19 Production SHA**: `f6627115a8a2f9dacf12bc4d711aecf3677c11ee` (`f6627115`)
- **Current Governance Status**: `W1–W3 PARTIAL_ACCEPTANCE` | `W4 implementation NOT APPROVED`

---

## 1. Phase A — Mechanical Reconciliation of Inventory and Register Discrepancies (`FND01`, `FND02`, `FND12`, `FND17`, `TC01`)

### 1.1 Exact Mechanical Reconciliation of Finding Register Counts (`FND01`, `FND17`, `TC01`)

Prior audit documents cited `91`, `68`/`69`, `177`, and `696` without showing how each number is mechanically derived. Below is the exact, reproducible count from the repository files:

| Register / Artifact | Mechanical Row / Entry Count | Exact Breakdown | Why Earlier Counts Differed |
| :--- | :--- | :--- | :--- |
| `audit/Audit_Finding_Root_Cause_Crosswalk.csv` | **91 data rows** (92 lines with header) | **68 rows** with distinct formal `original_finding_id` values + **23 rows** with literal string `"No original audit ID"` (numbered prose findings in `audit/CompleteProjectAudit.md`). Looking at distinct string values in column `original_finding_id` yields `68 + 1 = 69` literal strings. | Counting total CSV data rows gives `91`; counting distinct string values in `original_finding_id` gives `69` (`68` formal IDs + `1` placeholder `"No original audit ID"`). |
| `audit/FND17_W2_Coverage_Map.md` | **177 W2 findings** (44 MKT + 74 SU + 37 RTH + 4 PA-A + 18 PH) | Contains **36 individual `### <ID>` headings** plus **6 range-collapsed headings** (`MKT-031..055` [25], `SU-AUTH-005..026` [22], `SU-DASH-003..030` [28], `SU-ILS-001..017` [17], `RTH-003..037` [35], `PH-005..018` [14]) = `36 + 141 = 177` findings. | Counting markdown `###` headings gave `42` (`36` single + `6` range headings), whereas expanding the 6 ranges yields `177` W2 findings. Section 1.3 below enumerates the range-collapsed groups. |
| `audit/W1_W3_Audit_Finding_Candidate_Index.csv` | **696 distinct candidate IDs** (697 lines with header) | Regex extraction of all uppercase hyphenated tokens from `audit/CompleteProjectAudit.md`: **63** appear in the 91-row crosswalk (`in_91_row_crosswalk = yes`) and **633** are additional section/finding/phase/contract tokens (`in_91_row_crosswalk = no`). Note: 5 formal IDs in the 91-row crosswalk use suffixes/formats outside the 63 exact token matches (`63 + 5 = 68`). | `696` is the full regex candidate index across all waves (`W1`–`W5`), not the 91-row executive root-cause crosswalk. |
| `audit/Phase04_Integration_Finding_Crosswalk.csv` | **8 data rows** (`P03-01`..`P03-08`) | Cross-service integration findings mapped to `RC-DATA-01`, `RC-EVENT-01`, `RC-BOUND-01`, `RC-ID-01`, `RC-CACHE-01`, `RC-OBS-01`. | Separate integration register. |
| `audit/Canonical_Root_Cause_Register.csv` | **12 data rows** (`RC-ID-01`..`RC-UI-01`) | Canonical root causes across identity, tenant, authz, data, cache, event, contract, boundary, state, config, observability, and UI. | Root-cause taxonomy register. |

### 1.2 Enumeration of the 23 `"No original audit ID"` Rows in `Audit_Finding_Root_Cause_Crosswalk.csv` (`FND01`)

To ensure no two distinct findings are collapsed under a shared `"No original audit ID"` placeholder, each of the 23 rows is preserved with its exact CSV row number, `CompleteProjectAudit.md` reference, and unique normalized tracking ID (`CPA-FND-*`):

| CSV Line | Normalized Tracking ID | Original `CompleteProjectAudit.md` Reference | Primary Area | Root Cause ID | Target Remediation Wave |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 4 | `CPA-FND-03` | Finding 3 (`CompleteProjectAudit.md:6298`) — Shared JWT fallback secret & unverified decode paths | Auth / Identity | `RC-ID-01` | `W1.2` |
| 5 | `CPA-FND-04` | Finding 4 (`CompleteProjectAudit.md:6302`) — Refresh token rotation race & non-atomic grace window | Auth / Session | `RC-STATE-01` | `W1.2` |
| 6 | `CPA-FND-05` | Finding 5 (`CompleteProjectAudit.md:6306`) — Admin audience (`aud`) and role claim conflation | Auth / RBAC | `RC-AUTHZ-01` | `W1.2` |
| 7 | `CPA-FND-06` | Finding 6 (`CompleteProjectAudit.md:6310`) — Cross-brand session cookie bleed (`SUIA` vs `RTH`) | Auth / Tenant | `RC-TENANT-01` | `W1.2` |
| 8 | `CPA-FND-07` | Finding 7 (`CompleteProjectAudit.md:6314`) — Missing tenant scoping in tutorial progress queries | Data / Tenant | `RC-TENANT-01` | `W1.3` |
| 9 | `CPA-FND-08` | Finding 8 (`CompleteProjectAudit.md:6318`) — Service worker caching authenticated responses | Client / Cache | `RC-CACHE-01` | `W1.2` |
| 10 | `CPA-FND-09` | Finding 9 (`CompleteProjectAudit.md:6322`) — Export status/download IDOR & missing provenance | API / Exports | `RC-AUTHZ-01` | `W1.3` |
| 11 | `CPA-FND-10` | Finding 10 (`CompleteProjectAudit.md:6326`) — Multi-select scoring display-text fallback credit | Scoring / Exam | `RC-DATA-01` | `W1.4` |
| 16 | `CPA-FND-15` | Finding 15 (`CompleteProjectAudit.md:6346`) — Event consumer non-atomic idempotency & source-as-tenant | Events / Queue | `RC-EVENT-01` | `W1.3` |
| 17 | `CPA-FND-16` | Finding 16 (`CompleteProjectAudit.md:6350`) — Worker lease fallback to process-local memory | Events / Workers | `RC-STATE-01` | `W1.3` |
| 20 | `CPA-FND-19` | Finding 19 (`CompleteProjectAudit.md:6362`) — Non-transactional outbox dispatch before DB commit | Events / Outbox | `RC-EVENT-01` | `W1.3` |
| 21 | `CPA-FND-20` | Finding 20 (`CompleteProjectAudit.md:6366`) — Student invitation claim/commit race & memory fallback | People / Onboarding | `RC-STATE-01` | `W2.2` |
| 23 | `CPA-FND-22` | Finding 22 (`CompleteProjectAudit.md:6374`) — Enquiry admission email normalization & collision handling | People / CRM | `RC-DATA-01` | `W2.2` |
| 24 | `CPA-FND-23` | Finding 23 (`CompleteProjectAudit.md:6378`) — Marketing internal analytics HTTP 4xx/5xx reported as `ok: true` | Marketing / Analytics | `RC-OBS-01` | `W2.1` |
| 26 | `CPA-FND-25` | Finding 25 (`CompleteProjectAudit.md:6386`) — Placement portal mock fallback & HTTP 200 on upstream failure | Placement / Web | `RC-OBS-01` | `W2.2` |
| 28 | `CPA-FND-27` | Finding 27 (`CompleteProjectAudit.md:6394`) — Nested tutorial document schema drops recursive child blocks | Content / Schema | `RC-CONTRACT-01` | `W3.1` |
| 29 | `CPA-FND-28` | Finding 28 (`CompleteProjectAudit.md:6398`) — Tutorial storage preparation fabricates `saved: true` | Content / Admin | `RC-OBS-01` | `W3.1` |
| 30 | `CPA-FND-29` | Finding 29 (`CompleteProjectAudit.md:6402`) — Project LLM evaluation auto-publishes without Gate 1 review | AI / Governance | `RC-BOUND-01` | `W3.2` |
| 31 | `CPA-FND-30` | Finding 30 (`CompleteProjectAudit.md:6406`) — Admin taxonomy table silent fallback to `MOCK_*` catalogs | Admin / Taxonomy | `RC-OBS-01` | `W3.1` |
| 32 | `CPA-FND-31` | Finding 31 (`CompleteProjectAudit.md:6410`) — Taxonomy CRUD schema drift (`depth`/`depthLevel`, `order`/`orderIndex`) | Admin / Taxonomy | `RC-CONTRACT-01` | `W3.1` |
| 33 | `CPA-FND-32` | Finding 32 (`CompleteProjectAudit.md:6414`) — Analytics user-merge cross-tenant identity contamination | Analytics / Identity | `RC-TENANT-01` | `W2.1` |
| 56 | `CPA-PRINC-6294` | Principal Finding (`CompleteProjectAudit.md:6294`) — Cross-app architectural boundary & authority split | Architecture | `RC-BOUND-01` | `W1.1`–`W1.4` |
| 78 | `CPA-SKILL-6232` | Skill Contract Drift (`CompleteProjectAudit.md:6232`) — Skill/topic mapping contract & schema divergence | Domain / Skills | `RC-CONTRACT-01` | `W3.1` |

### 1.3 Exact Mechanical Reconciliation of Caller Inventory (`109` vs `181`, `FND12`)

In `audit/FND12_Complete_Truth_Inventory.md`:
- Sections 1–5 contain **109 enumerated table rows**:
  - `SD-01`..`SD-32` (**32 rows**: Static/Seeded Data & In-Memory Stores)
  - `AR-01`..`AR-17` (**17 rows**: Stubbed/Degraded API Routes)
  - `OP-01`..`OP-26` (**26 rows**: Degraded Operational Paths & Silent Fallbacks)
  - `GT-01`..`GT-17` (**17 rows**: Governance/Truthfulness Gaps)
  - `FA-01`..`FA-17` (**17 rows**: Fake/No-Op UI Actions)
  - **Subtotal = `32 + 17 + 26 + 17 + 17 = 109` enumerated rows.**
- The Executive Summary in `FND12` cited `181` total callers (`109 + 29 marketing analytics + 43 tutorial/ILS`), while Section "Exclusions & Limitations" (lines 523–529) left those `72` callers unenumerated.
- Below, all **72 previously unenumerated callers** (`MA-01`..`MA-29` = 29 marketing analytics callers; `TI-01`..`TI-43` = 43 tutorial/ILS callers) are explicitly enumerated with their exact repository file paths and verification status (`109 + 29 + 43 = 181` total enumerated callers):

#### Marketing Analytics Callers (`MA-01`..`MA-29`, 29 Callers)

| Caller ID | Source File Path | Role / Boundary | Verification / Remediation Status |
| :--- | :--- | :--- | :--- |
| `MA-01` | `packages/marketing-site/src/components/analytics/GTMProvider.tsx` | Client GTM bootstrap & consent gate | Verified (`analytics` suite) |
| `MA-02` | `packages/marketing-site/src/config/analytics.ts` | Brand-scoped analytics endpoint config | Verified (`analytics` suite) |
| `MA-03` | `packages/marketing-site/src/lib/tracking.ts` | Public marketing tracking entry helper | Verified (`analytics` suite) |
| `MA-04` | `packages/marketing-site/src/lib/analytics/tracker.ts` | Multi-provider analytics dispatcher | Remediated (`FND21` / `TC20`) |
| `MA-05` | `packages/marketing-site/src/lib/analytics/events.ts` | Canonical marketing event schema | Verified (`analytics` suite) |
| `MA-06` | `packages/marketing-site/src/lib/analytics/context.ts` | Brand/session context extractor | Verified (`analytics` suite) |
| `MA-07` | `packages/marketing-site/src/lib/analytics/enrichment.ts` | Event metadata enrichment | Verified (`analytics` suite) |
| `MA-08` | `packages/marketing-site/src/lib/analytics/funnel.ts` | Conversion funnel stage tracker | Verified (`analytics` suite) |
| `MA-09` | `packages/marketing-site/src/lib/analytics/lead-scoring.ts` | Marketing lead scoring calculator | Verified (`analytics` suite) |
| `MA-10` | `packages/marketing-site/src/lib/analytics/automation.ts` | Marketing automation trigger | Verified (`analytics` suite) |
| `MA-11` | `packages/marketing-site/src/lib/analytics/observability.ts` | Telemetry failure/health reporter | Remediated (`FND14` / `TC15`) |
| `MA-12` | `packages/marketing-site/src/lib/analytics/warehouse.ts` | Analytics warehouse sink adapter | Verified (`analytics` suite) |
| `MA-13` | `packages/marketing-site/src/lib/analytics/providers/internal.provider.ts` | Internal HTTP ingest provider (checks `res.ok`) | Remediated (`FND14` / `TC15`) |
| `MA-14` | `packages/marketing-site/src/lib/analytics/providers/ga4.provider.ts` | GA4 provider adapter | Verified (`analytics` suite) |
| `MA-15` | `packages/marketing-site/src/lib/analytics/providers/gtm.provider.ts` | GTM dataLayer provider adapter | Verified (`analytics` suite) |
| `MA-16` | `packages/marketing-site/src/lib/analytics/providers/meta.provider.ts` | Meta Pixel provider adapter | Verified (`analytics` suite) |
| `MA-17` | `packages/marketing-site/src/lib/analytics/identity/user-merge-engine.ts` | Tenant-isolated anonymous-to-user merge | Remediated (`FND21` / `TC20A`) |
| `MA-18` | `packages/marketing-site/src/lib/analytics/identity/anonymous-linking.ts` | Anonymous session linking | Remediated (`FND21` / `TC20A`) |
| `MA-19` | `packages/marketing-site/src/lib/analytics/identity/identity-graph.ts` | Tenant-scoped identity graph | Remediated (`FND21` / `TC20A`) |
| `MA-20` | `packages/marketing-site/src/lib/analytics/identity/identity-resolver.ts` | Brand/tenant identity resolver | Remediated (`FND21` / `TC20A`) |
| `MA-21` | `packages/marketing-site/src/lib/analytics/identity/identity-store.ts` | Identity state store | Remediated (`FND21` / `TC20A`) |
| `MA-22` | `packages/marketing-site/src/lib/analytics/server/route.ts` | Server ingest route handler | Remediated (`FND14` / `TC20`) |
| `MA-23` | `packages/marketing-site/src/lib/analytics/server/pipeline.ts` | Server analytics validation pipeline | Remediated (`FND14` / `TC20`) |
| `MA-24` | `packages/marketing-site/src/lib/analytics/server/admin-route.ts` | Admin analytics summary handler | Verified (`analytics` suite) |
| `MA-25` | `packages/marketing-site/src/lib/domain-tracking/course-tracking.ts` | Course view/enrollment domain tracker | Verified (`analytics` suite) |
| `MA-26` | `packages/marketing-site/src/lib/domain-tracking/engagement-tracking.ts` | Section/scroll engagement tracker | Verified (`analytics` suite) |
| `MA-27` | `packages/marketing-site/src/lib/domain-tracking/funnel-tracking.ts` | Funnel progression domain tracker | Verified (`analytics` suite) |
| `MA-28` | `packages/marketing-site/src/lib/domain-tracking/lead-tracking.ts` | Enquiry/lead capture tracker | Verified (`analytics` suite) |
| `MA-29` | `packages/marketing-site/src/lib/domain-tracking/payment-tracking.ts` | Checkout/payment intent tracker | Verified (`analytics` suite) |

#### Tutorial & Interactive Learning System (ILS) Callers (`TI-01`..`TI-43`, 43 Callers)

| Caller ID | Source File Path | Role / Boundary | Verification / Remediation Status |
| :--- | :--- | :--- | :--- |
| `TI-01` | `apps/realtutorialhub-web/src/app/api/tutorial/assignments/[subtopicId]/complete/route.ts` | RTH assignment completion route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-02` | `apps/realtutorialhub-web/src/app/api/tutorial/assignments/[subtopicId]/route.ts` | RTH assignment fetch route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-03` | `apps/realtutorialhub-web/src/app/api/tutorial/assignments/[subtopicId]/start/route.ts` | RTH assignment start route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-04` | `apps/realtutorialhub-web/src/app/api/tutorial/assignments/help/route.ts` | RTH assignment help request route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-05` | `apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts` | RTH tutorial content delivery route | Remediated (`FND07` / `TC14`) |
| `TI-06` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/active-time/route.ts` | RTH ILS active-time telemetry route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-07` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-active-time/route.ts` | RTH ILS block active-time route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-08` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-completion/route.ts` | RTH ILS block completion route | Remediated (`FND05` / `TC06`) |
| `TI-09` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-visit/route.ts` | RTH ILS block visit route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-10` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/complete-node/route.ts` | RTH ILS node completion route | Remediated (`FND05` / `TC06`) |
| `TI-11` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts` | RTH ILS navigation state route | Remediated (`FND05` / `TC06`) |
| `TI-12` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/subtopic/[subtopicId]/progress/route.ts` | RTH ILS subtopic progress route | Remediated (`FND05` / `TC06`) |
| `TI-13` | `apps/realtutorialhub-web/src/app/api/tutorial/ils/visit/route.ts` | RTH ILS visit route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-14` | `apps/realtutorialhub-web/src/app/api/tutorial/interactions/[type]/route.ts` | RTH tutorial interaction route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-15` | `apps/realtutorialhub-web/src/app/api/tutorial/progress/mark-complete/route.ts` | RTH progress mark-complete route | Remediated (`FND05` / `TC06`) |
| `TI-16` | `apps/realtutorialhub-web/src/app/api/tutorial/progress/route.ts` | RTH canonical progress GET/POST route | Remediated (`FND05` / `TC06`) |
| `TI-17` | `apps/realtutorialhub-web/src/app/api/tutorial/projects/[projectId]/route.ts` | RTH project detail route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-18` | `apps/realtutorialhub-web/src/app/api/tutorial/projects/submissions/route.ts` | RTH project submissions list route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-19` | `apps/realtutorialhub-web/src/app/api/tutorial/projects/submit/route.ts` | RTH project submit route | Remediated (`FND18` / `TC12`) |
| `TI-20` | `apps/realtutorialhub-web/src/app/api/tutorial/remediation/[examResultId]/route.ts` | RTH exam remediation detail route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-21` | `apps/realtutorialhub-web/src/app/api/tutorial/remediation/route.ts` | RTH exam remediation list route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-22` | `apps/realtutorialhub-web/src/app/api/tutorial/sections/[subtopicId]/route.ts` | RTH tutorial sections route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-23` | `apps/realtutorialhub-web/src/app/api/tutorial/sessions/[requestId]/route.ts` | RTH live session detail route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-24` | `apps/realtutorialhub-web/src/app/api/tutorial/sessions/my-requests/route.ts` | RTH student session requests route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-25` | `apps/realtutorialhub-web/src/app/api/tutorial/sessions/request/route.ts` | RTH live session request creation route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-26` | `apps/skillup-web/src/app/api/tutorial/content/[subtopicId]/route.ts` | SUIA tutorial content delivery route | Remediated (`FND07` / `TC14`) |
| `TI-27` | `apps/skillup-web/src/app/api/tutorial/ils/active-time/route.ts` | SUIA ILS active-time telemetry route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-28` | `apps/skillup-web/src/app/api/tutorial/ils/block-active-time/route.ts` | SUIA ILS block active-time route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-29` | `apps/skillup-web/src/app/api/tutorial/ils/block-completion/route.ts` | SUIA ILS block completion route | Remediated (`FND05` / `TC06`) |
| `TI-30` | `apps/skillup-web/src/app/api/tutorial/ils/block-visit/route.ts` | SUIA ILS block visit route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-31` | `apps/skillup-web/src/app/api/tutorial/ils/complete-node/route.ts` | SUIA ILS node completion route | Remediated (`FND05` / `TC06`) |
| `TI-32` | `apps/skillup-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts` | SUIA ILS navigation state route | Remediated (`FND05` / `TC06`) |
| `TI-33` | `apps/skillup-web/src/app/api/tutorial/ils/subtopic/[subtopicId]/progress/route.ts` | SUIA ILS subtopic progress route | Remediated (`FND05` / `TC06`) |
| `TI-34` | `apps/skillup-web/src/app/api/tutorial/ils/visit/route.ts` | SUIA ILS visit route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-35` | `apps/skillup-web/src/app/api/tutorial/interactions/[type]/route.ts` | SUIA tutorial interaction route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-36` | `apps/skillup-web/src/app/api/tutorial/progress/route.ts` | SUIA canonical progress GET/POST route | Remediated (`FND05` / `TC06`) |
| `TI-37` | `apps/skillup-web/src/app/api/tutorial/sections/[subtopicId]/route.ts` | SUIA tutorial sections route | Verified (`requireStudentAuth` + tenant scope) |
| `TI-38` | `packages/db-tutorial/src/repositories/tutorial-progress.repository.ts` | CAS & tenant-mandatory tutorial progress repository | Remediated (`FND05` / `TC06`) |
| `TI-39` | `packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository.ts` | Tenant-scoped ILS navigation progress repository | Remediated (`FND05` / `TC06`) |
| `TI-40` | `packages/db-tutorial/src/repositories/block-learning-state.repository.ts` | Tenant-scoped block learning state repository | Remediated (`FND05` / `TC06`) |
| `TI-41` | `packages/db-tutorial/src/repositories/block-telemetry-event.repository.ts` | Tenant-scoped block telemetry repository | Verified (`db-tutorial`) |
| `TI-42` | `packages/db-tutorial/src/repositories/project-submission.repository.ts` | Project submission & Gate 1 pending_review repository | Remediated (`FND18` / `TC12`) |
| `TI-43` | `packages/db-tutorial/src/repositories/event-outbox.repository.ts` | Durable SQL outbox repository (`@quiz/db-tutorial`) | Accepted Slice 19 (`f6627115`) |

### 1.4 Preservation of Canonical `G1`–`G9`, `RC-ID-01`, and `BROWSER-01` Definitions (`FND02`)

No gate or root-cause identifier is redefined or repurposed:

| Identifier | Canonical Definition | Current Source Scope | Current Physical Runtime Scope |
| :--- | :--- | :--- | :--- |
| `G1` | Canonical identity, JWT verification, refresh rotation, and session revocation across SUIA & RTH | `PASS` (Offline/Simulated) | `NOT_EXECUTED` (`Gate P3`) |
| `G2` | Brand/tenant boundary isolation (`skillup` vs `realtutorialhub`) across auth, DB, and analytics | `PASS` (Offline/Simulated) | `NOT_EXECUTED` (`Gate P1`, `Gate P3`) |
| `G3` | Strict admin audience (`aud: 'admin'`), token class (`tokenType: 'admin'`), and resource ownership guards | `PASS` (Offline/Simulated) | `NOT_EXECUTED` (`Gate P3`, `Gate P5`) |
| `G4` | Export job trigger/status/URL/download ownership authority and schema provenance | `PASS` (Offline/Simulated) | `NOT_EXECUTED` (`Gate P1`, `Gate P4`) |
| `G5` | Tenant-mandatory tutorial progress persistence with optimistic CAS concurrency retry | `PASS` (Offline/Simulated) | `NOT_EXECUTED` (`Gate P1`) |
| `G6` | Client/service-worker private-state cache exclusion and legacy cache eviction on upgrade | `PASS` (Offline/Simulated) | `NOT_EXECUTED` (`Gate P3` / `BROWSER-01`) |
| `G7` | Multi-select versioned option-ID scoring truth and nested rich-document cycle-safe schema preservation | `PASS` (Offline/Simulated) | `PASS` (Pure deterministic domain logic) |
| `G8` | Durable SQL transactional outbox, atomic Redis/SQL worker lease ownership, and tenant-scoped QStash consumer idempotency | `PASS` (Accepted Slice 19 `f6627115` in source/SQL-sim scope) | `NOT_EXECUTED` (`Gate P1`, `Gate P2`) |
| `G9` | Operational truth across CRM admission/invitation SQL authority, placement HTTP status, analytics ingest, taxonomy CRUD, and Gate 1 human review | `PASS` (Accepted Slice 20 `dc75ace5` + taxonomy/workspace typecheck fixes) | `NOT_EXECUTED` (`Gate P1`, `Gate P5`) |
| `RC-ID-01` | Identity & session boundary root cause (shared token assumptions, cookie scope, gateway/service propagation) | Remediated in code (`packages/auth`) | Pending live multi-app browser/gateway verification (`Gate P3`) |
| `BROWSER-01` | Installed browser runtime qualification (Chromium/Playwright cookie jar, service-worker cache lifecycle, account switching) | Offline unit harnesses pass | Pending installed Chromium binary execution (`Gate P3`) |

---

## 2. Phase B — Consolidated Remaining-Work & Evidence Matrix (`FND01`–`FND30`, `TC01`–`TC20`, `FND28`, `FND30`)

Every finding (`FND01`–`FND30`) and test checkpoint (`TC01`–`TC20`) is recorded below using the required `RequirementEvidence` fields:

| Req ID | Finding IDs | Primary Caller / Source Paths | Impl Status | Offline / Sim Test Command & Status | Physical Gate & Status | Sol Decision |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `FND01` / `TC01` | `FND01`, `CPA-FND-03`..`32` | `audit/Audit_Finding_Root_Cause_Crosswalk.csv`, `audit/Argon_W1_W3_Remaining_Work_And_Inventory_Reconciliation.md` | `COMPLETED` | Mechanical Python/node row verification (`91 = 68 + 23`, `181 = 109 + 72`) — `PASS` | N/A (Document/Register) | Pending Sol review |
| `FND02` | `FND02`, `G1`–`G9`, `RC-ID-01`, `BROWSER-01` | `audit/Argon_W1_W3_Remaining_Work_And_Inventory_Reconciliation.md` | `COMPLETED` | Canonical definition preservation check — `PASS` | N/A (Governance) | Pending Sol review |
| `FND03` / `TC02` | `FND03`, `RC-TENANT-01`, `RC-AUTHZ-01` | `packages/auth/src/rbac/rbac.service.ts`, `packages/auth/src/rbac/ownership.service.ts`, `apps/api-server/src/modules/auth/admin-audience.util.ts` | `COMPLETED` | `node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` & `node audit/Sol_W1_W3_Integrated_Review_f574daa5.mjs admin` — `PASS` | `Gate P3` (`NOT_EXECUTED`) | Scoped source pass |
| `FND04` / `TC05` | `FND04`, `CPA-FND-09` | `apps/api-server/src/app/api/export/{trigger,urls,download,status/[jobId]}/route.ts`, `packages/db/migrations/0003_loving_multiple_man.sql` | `COMPLETED` | `node audit/Sol_W1_W3_Integrated_Review_f574daa5.mjs exports` (60/60) — `PASS` | `Gate P1`, `Gate P4` (`NOT_EXECUTED`) | Scoped source pass |
| `FND05` / `TC06` | `FND05`, `CPA-FND-07` | `packages/db-tutorial/src/repositories/tutorial-progress.repository.ts`, `apps/skillup-web/src/app/api/tutorial/progress/route.ts`, `apps/realtutorialhub-web/src/app/api/tutorial/progress/route.ts` | `COMPLETED` | `Sol_W1_W3_Integrated_Probes_f574daa5.test.ts` progress CAS & tenant probes — `PASS` | `Gate P1` (`NOT_EXECUTED`) | Scoped source pass |
| `FND06` / `TC07` | `FND06`, `CPA-FND-05` | `apps/api-server/src/modules/auth/admin-audience.util.ts`, `apps/skillhubcore-admin/src/lib/admin-route-guard.ts` | `COMPLETED` | `node audit/Sol_W1_W3_Integrated_Review_f574daa5.mjs admin` (9/9) — `PASS` | `Gate P3`, `Gate P5` (`NOT_EXECUTED`) | Scoped source pass |
| `FND07` / `TC14` | `FND07`, `CPA-FND-08`, `BROWSER-01` | `apps/skillup-web/src/app/sw.ts`, `apps/realtutorialhub-web/src/app/sw.ts` | `COMPLETED` | `node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` (SW private cache tests) — `PASS` | `Gate P3` (`NOT_EXECUTED`) | Scoped source pass |
| `FND08` / `TC09` | `FND08`, `CPA-FND-10` | `apps/api-server/src/modules/exam-engine/exam.engine.ts`, `apps/api-server/src/modules/answer-engine/evaluators/multi-select.evaluator.ts` | `COMPLETED` | `node audit/Sol_W1_W3_Integrated_Review_f574daa5.mjs scoring` (2/2) — `PASS` | Pure domain logic (`PASS`) | Scoped source pass |
| `FND09` / `TC11` | `FND09`, `CPA-FND-15`, `CPA-FND-16`, `CPA-FND-19` | `packages/events/src/consumer.ts`, `packages/events/src/worker-lease.ts`, `packages/events/src/outbox.ts`, `packages/db-tutorial/src/repositories/event-outbox.repository.ts`, `apps/skillup-admin/src/app/api/workers/{issue-certificate,award-project-badge}/route.ts` | `ACCEPTED` (`f6627115`) | `Sol_Slice20_Repository_Review.mjs` (40/40), `Sol_SQL_Authority_Review_7f66e7eb.mjs` (8/8), `Gemini_SQL_Authority_Invariant_Review.mjs` (6/6), `Sol_Lease_Adapter_Review_27243c6e.mjs` (7/7) — `PASS` | `Gate P1`, `Gate P2` (`NOT_EXECUTED`) | **Accepted by Sol** (`Slice 19` `f6627115` & `Slice 20` `e828ce2a`) |
| `FND10` | `FND10` | Section 3 of this document (`Gate P1`–`Gate P5` execution packets) | `COMPLETED` | Execution recipes & pass/fail predicates prepared without unauthorized live mutation — `PASS` | `Gate P1`–`Gate P5` (`NOT_EXECUTED`) | Pending physical execution |
| `FND11` / `TC08` | `FND11`, `RC-ID-01` | `packages/auth/src/tokens/token.service.ts`, `packages/auth/src/session/session.service.ts` | `COMPLETED` | `node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary` — `PASS` | `Gate P2`, `Gate P3` (`NOT_EXECUTED`) | Scoped source pass |
| `FND12` | `FND12` | Section 1.3 of this document + `audit/FND12_Complete_Truth_Inventory.md` | `COMPLETED` | All `181` callers (`109 + 29 + 43`) explicitly enumerated by ID & path — `PASS` | N/A (Inventory) | Pending Sol review |
| `FND13` / `TC03` / `TC04` | `FND13`, `CPA-FND-20`, `CPA-FND-22` | `packages/db-people/src/repositories/student-invitation.repository.ts`, `apps/skillup-admin/src/lib/student-invitation.ts`, `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts`, `packages/db-people/src/utils/email-normalization.ts` | `ACCEPTED` (`dc75ace5`) | `node audit/Sol_Slice20_Repository_Review.mjs` (40/40) & `boundary` checkpoint — `PASS` | `Gate P1`, `Gate P5` (`NOT_EXECUTED`) | **Accepted by Sol** (`Slice 20` `e828ce2a`) |
| `FND14` / `TC15` | `FND14`, `CPA-FND-23` | `packages/marketing-site/src/lib/analytics/providers/internal.provider.ts`, `apps/realtutorialhub-site/components/footer/FooterBrand.tsx` | `COMPLETED` | `node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs analytics` & `Integrated_Review analytics` — `PASS` | `Gate P3` (`NOT_EXECUTED`) | Scoped source pass |
| `FND15` / `TC13` | `FND15`, `CPA-FND-25` | `apps/skillup-web/src/lib/placement-api.ts`, `apps/skillup-web/src/app/api/placement/**/route.ts` | `COMPLETED` | `node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs placement` (38/38) — `PASS` | `Gate P3` (`NOT_EXECUTED`) | Scoped source pass |
| `FND16` / `TC10` / `TC19` | `FND16`, `CPA-FND-27`, `CPA-FND-28` | `packages/types/src/tutorial-rich-document/schemas/document.schema.ts`, `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/storage-preparation.ts` | `COMPLETED` | `node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs nested` (11/11) — `PASS` | `Gate P1` (`NOT_EXECUTED`) | Scoped source pass |
| `FND17` | `FND17` | `audit/FND17_W2_Coverage_Map.md`, Section 1.1 of this document | `COMPLETED` | Reconciled 42 headings (`36` single + `6` range headings) = `177` W2 findings — `PASS` | N/A (Inventory) | Pending Sol review |
| `FND18` / `TC12` | `FND18`, `CPA-FND-29` | `apps/skillup-admin/src/lib/project-evaluation-gate.ts`, `packages/db-tutorial/src/repositories/project-submission.repository.ts` | `COMPLETED` | Gate 1 `pending_review` state enforcement verified — `PASS` | `Gate P5` (`NOT_EXECUTED`) | Scoped source pass |
| `FND19` / `TC16` | `FND19`, `CPA-FND-30`, `CPA-FND-31` | `apps/api-server/src/schemas/hierarchy.schemas.ts`, `apps/skillhubcore-admin/src/schemas/hierarchy.schemas.ts`, `apps/api-server/src/app/api/admin/subtopics/{route,[id]/route}.ts`, `apps/skillhubcore-admin/src/app/api/admin/{domains,topics,subtopics}/**`, `apps/skillhubcore-admin/src/components/questions/{Domain,Subject,Topic,Subtopic,Skill}Table.tsx` | `COMPLETED` | `apps/skillhubcore-admin/src/schemas/__tests__/hierarchy-contract.test.ts` (24/24) — `PASS` | `Gate P1` (`NOT_EXECUTED`) | Pending Gemini/Sol retest of taxonomy schema/route alignment |
| `FND20` / `TC17` / `TC18` | `FND20` | `apps/skillhubcore-admin/src/components/entry/__tests__/bulk-caller-contract.test.tsx`, `apps/api-server/src/modules/domain/hierarchy.factory.ts` | `COMPLETED` | Hierarchy factory & bulk caller contract tests — `PASS` | `Gate P1` (`NOT_EXECUTED`) | Scoped source pass |
| `FND21` / `TC20` | `FND21`, `CPA-FND-32` | `packages/marketing-site/src/lib/analytics/identity/user-merge-engine.ts`, `audit/Sol_TC20A_Merge_Boundary_7f6f788d.test.ts` | `COMPLETED` | `node audit/Sol_W1_W3_Integrated_Review_f574daa5.mjs analytics` (28/28) — `PASS` | `Gate P3` (`NOT_EXECUTED`) | Scoped source pass |
| `FND22`–`FND25` | `FND22`–`FND25` | `audit/W1_W3_Offline_Test_Network_Guard.ts`, `audit/Sol_Slice20_Repository_Review.mjs`, `audit/Gemini_SQL_Authority_Invariant_Review.mjs` | `COMPLETED` | Offline network guard, fresh repository instances, and negative controls active — `PASS` | `Gate P1`–`Gate P5` (`NOT_EXECUTED`) | Accepted in Slice 19/20 |
| `FND26` | `FND26` | `packages/db-tutorial/migrations/schema.ts`, `packages/marketing-site/src/lib/update_subsubtitle.cjs`, `packages/marketing-site/src/lib/update_subsubtitle_slug.cjs` | `COMPLETED` | All 23 syntax errors from `Sol_Slice20_Workspace_Typecheck.log` resolved; all 5 affected package typechecks (`@quiz/db-people`, `@quiz/db-tutorial`, `@quiz/events`, `@quiz/skillup-admin`, `@quiz/skillhubcore-admin`) exit `0`; root flat `pnpm exec tsc --noEmit` still exits `2` in semantic phase due to conflicting monorepo-wide `@/*` path aliases and legacy test/scratch files (`tests/temp-*.tsx`) — `PARTIAL / DISPOSITIONED` | N/A (Static compilation gate) | Pending Gemini/Sol verification |
| `FND27` | `FND27` | Clean commit hygiene on `remediation/w1-2-batch-05-targeted` (`git diff --check` exit 0) | `COMPLETED` | `git status -s` & `git diff --check` — `PASS` | N/A | Pending Sol review |
| `FND28`–`FND30` | `FND28`–`FND30` | Sections 2, 3, and 4 of this document + `audit/Argon_W1_W3_Critical_Handoff.md` | `COMPLETED` | Evidence ledger, physical gate packets, and W4 readiness matrix complete — `PASS` | `Gate P1`–`Gate P5` (`NOT_EXECUTED`) | `W1–W3 PARTIAL_ACCEPTANCE`; `W4 NOT APPROVED` |

---

## 3. Concrete Execution Packets / Recipes for Physical Qualification Gates (`Gate P1`–`Gate P5`, `FND10`)

Per governance constraints, Argon has **not** executed live database migrations, live Redis/QStash mutations, or external browser/storage mutations. The following self-contained execution packets define the exact prerequisites, commands, and pass/fail predicates required to move `Gate P1`–`Gate P5` from `NOT_EXECUTED` to `PASS`.

### Gate P1 — Physical PostgreSQL Authority, Concurrency & Migration Provenance (`G2`, `G4`, `G5`, `G8`, `G9`)

- **Required Environment**:
  - Ephemeral or staging PostgreSQL 15+ instance with `DATABASE_URL` (`@quiz/db`), `PEOPLE_DATABASE_URL` (`@quiz/db-people`), and `TUTORIAL_DATABASE_URL` (`@quiz/db-tutorial`).
- **Execution Recipe**:
  1. Apply Drizzle migrations cleanly from scratch:
     ```powershell
     pnpm --filter @quiz/db db:migrate
     pnpm --filter @quiz/db-people db:migrate
     pnpm --filter @quiz/db-tutorial db:migrate
     ```
  2. Verify migration provenance for `0003_loving_multiple_man.sql` (`exports.tenant_id`, `exports.requested_by`) in `drizzle.__drizzle_migrations`.
  3. Execute the 6 Slice 20 invitation concurrency races (`claim vs claim`, `claim vs expire`, `redeem vs expire`, `revoke vs redeem`, `resend vs claim`, `duplicate commit`) using two independent `pg.Pool` connections with `BEGIN` / `COMMIT` barriers against real `student_invitations`.
  4. Execute concurrent `TutorialProgressRepository.markBlockComplete` calls across two independent `pg.Pool` clients against `tutorial_progress` (`version` CAS column) and assert both block IDs persist without lost update.
  5. Execute `DrizzleTransactionalOutboxRepository.upsertTransactionalOutboxIntent` inside a real `db.transaction` that rolls back, and assert zero rows exist in `tutorial_event_outbox`.
- **Pass Predicate**: All 3 schema migrations exit `0`; all 6 physical SQL invitation races preserve single-winner state truth; CAS progress retains both concurrent blocks; rolled-back transaction leaves 0 outbox rows.

### Gate P2 — Physical Redis Lua Lease Ownership, QStash Queue & Worker Crash Recovery (`G1`, `G8`)

- **Required Environment**:
  - Physical Redis 7+ / Upstash Redis instance (`REDIS_URL`) and local QStash CLI / staging receiver (`QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`).
- **Execution Recipe**:
  1. Run `acquireWorkerLease`, `renewWorkerLease`, `completeWorkerLease`, and `releaseWorkerLease` against physical Redis (`EVAL` Lua scripts in `packages/events/src/worker-lease.ts`).
  2. Simulate Lease Owner A acquiring key `lease:test:1` with TTL `2000ms`; before expiry, assert Lease Owner B cannot acquire, renew, complete, or release `lease:test:1`.
  3. Simulate Worker A crashing mid-flight (lease expires without `completeWorkerLease`); after `2100ms`, assert Worker B reclaims `lease:test:1`, executes the effect once, and transitions the SQL outbox row to `dispatched`.
  4. Send two concurrent signed QStash webhook requests with identical `(tenantScope, eventType, eventId)` to `createQStashHandler`; assert Redis `SET key value NX EX` admits exactly one handler, returns `409`/`425` to the in-flight duplicate, and returns `200` on subsequent identical-payload replay without re-invoking the effect.
- **Pass Predicate**: Zero dual-owner lease execution; zero lost events on simulated worker crash; exact-once side-effect execution across concurrent and sequential QStash deliveries.

### Gate P3 — Installed Browser (`BROWSER-01`), Service Worker Cache Upgrade & Gateway Session Isolation (`G1`, `G2`, `G3`, `G6`, `RC-ID-01`)

- **Required Environment**:
  - Playwright Chromium binary installed (`pnpm exec playwright install chromium`) + running local/staging instances of `skillup-web`, `realtutorialhub-web`, `skillhubcore-admin`, and `api-server`.
- **Execution Recipe**:
  1. Seed a legacy Cache API entry under `skillup-app-shell-v1` containing a private `/dashboard` HTML response, then activate the current `apps/skillup-web/src/app/sw.ts` service worker in Chromium; assert `caches.keys()` no longer contains `skillup-app-shell-v1`.
  2. Authenticate as User A in `skillup-web` and fetch `/dashboard` and `/api/tutorial/content/<subtopicId>`; log out, authenticate as User B in the same browser profile, and assert zero cached private responses from User A are served.
  3. Verify `RC-ID-01` cross-brand cookie/session boundary: present a valid `skillup` session token to `realtutorialhub` protected routes and assert `403 Forbidden` before any tenant DB read.
- **Pass Predicate**: `pnpm --filter @quiz/e2e test` exits `0` against real Chromium with zero cross-user cached responses and zero cross-brand session acceptance.

### Gate P4 — Private Object Storage Permissions, Signed URLs & Cross-Tenant Export Denial (`G4`)

- **Required Environment**:
  - Staging S3/R2/GCS private bucket with `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`.
- **Execution Recipe**:
  1. Trigger an export as Tenant A / User 1 (`POST /api/export/trigger`), poll `GET /api/export/status/[jobId]`, and fetch `GET /api/export/urls?jobId=...`.
  2. Verify direct unauthenticated `GET` to the raw object key returns `403 Forbidden` from object storage, while the time-bounded signed URL succeeds.
  3. Replay `GET /api/export/status/[jobId]`, `GET /api/export/urls`, and `GET /api/export/download` as User 2 (same tenant) and Admin of Tenant B; assert `403 Forbidden` on every route.
- **Pass Predicate**: Raw bucket objects are non-public (`403`); signed URLs expire as configured; cross-user and cross-tenant export access returns `403`.

### Gate P5 — Persisted Gate 1 Human Review, Actor Credentials & SMTP Delivery (`G3`, `G9`)

- **Required Environment**:
  - Staging database + configured SMTP transport (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) + non-default actor credentials.
- **Execution Recipe**:
  1. Submit a student project for AI evaluation; assert the persisted row in `project_submissions` remains in `pending_review` (`Gate 1`) and is not visible as a finalized grade/badge to the learner until an authenticated admin/faculty actor explicitly approves it.
  2. Trigger student invitation creation and resend via `apps/skillup-admin`; verify SMTP transport delivery receipt and verify that SMTP failure leaves the invitation recoverable via `resendInvitation` without corrupting claim/redemption state.
- **Pass Predicate**: Zero auto-published AI evaluations without persisted human reviewer approval; verified SMTP delivery and failure-recovery path.

---

## 4. `W4.1`–`W4.6` Entry Dependency & Readiness Matrix (`FND29`)

`W4` implementation remains **NOT APPROVED**. The table below maps each planned `W4` workstream against `G1`–`G9`, the accepted source/SQL-simulation baselines (`Slice 19` `f6627115` and `Slice 20` `dc75ace5`), and the remaining physical gates (`Gate P1`–`Gate P5`):

| W4 Workstream | Description | Required Foundation Gates (`G1`–`G9`) | Source / SQL-Sim Baseline Status | Blocking Physical Gates | Current Readiness Recommendation for Sol |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `W4.1` | Cross-Platform Student Onboarding & Unified Admission Flow | `G1`, `G2`, `G8`, `G9` | `PASS` (Accepted Slice 19 `f6627115` & Slice 20 `dc75ace5`) | `Gate P1` (PostgreSQL invitation concurrency), `Gate P5` (SMTP delivery) | `NO_GO` until `Gate P1` & `Gate P5` pass (or `BOUNDED_GO` for offline/non-live scaffolding only if explicitly authorized by Sol) |
| `W4.2` | Distributed Event-Driven Certificate & Badge Issuance Pipeline | `G2`, `G8`, `G9` | `PASS` (Accepted Slice 19 `f6627115`) | `Gate P1` (SQL outbox rollback/durability), `Gate P2` (Redis Lua lease & QStash replay) | `NO_GO` until `Gate P1` & `Gate P2` pass |
| `W4.3` | Interactive Learning System (ILS) Adaptive Progression & Telemetry | `G1`, `G2`, `G5`, `G6`, `G7` | `PASS` (`Sol_W1_W3_Checkpoint_f88fef44.mjs` & `Integrated_Probes`) | `Gate P1` (PostgreSQL CAS), `Gate P3` (`BROWSER-01` SW cache) | `NO_GO` until `Gate P1` & `Gate P3` pass |
| `W4.4` | Enterprise Assessment Export & Reporting Lifecycle | `G1`, `G2`, `G3`, `G4`, `G7` | `PASS` (`Sol_W1_W3_Integrated_Review_f574daa5.mjs scoring exports admin`) | `Gate P1` (Migration `0003`), `Gate P4` (Private object storage) | `NO_GO` until `Gate P1` & `Gate P4` pass |
| `W4.5` | AI-Assisted Content & Project Evaluation Workflows | `G3`, `G7`, `G8`, `G9` | `PASS` (`nested` checkpoint & Gate 1 `pending_review` enforcement) | `Gate P1`, `Gate P5` (Persisted human Gate 1 approval) | `NO_GO` until `Gate P1` & `Gate P5` pass |
| `W4.6` | Cross-Brand Attribution, Funnel Analytics & CRM Conversion | `G1`, `G2`, `G6`, `G9` | `PASS` (`Sol_TC20A_Merge_Boundary_7f6f788d.test.ts` & `analytics` suites) | `Gate P3` (`BROWSER-01` & `RC-ID-01` cookie/session isolation) | `NO_GO` until `Gate P3` passes |
