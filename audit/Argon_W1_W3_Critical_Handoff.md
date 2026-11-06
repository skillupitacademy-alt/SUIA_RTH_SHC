# Argon W1–W3 Critical Implementation Handoff

## Sol review at Gemini revision 7f6f788d

The tracker repair and unchanged FAIL-04 pass in Sol's independent 26-case run, but
TC20-A overall remains CHANGES_REQUESTED. A direct merge entry mutates nodes and
graph edges across brands. [Sol's review](Sol_TC20A_Review_And_Next_Manifest_7f6f788d.md)
authorizes exactly identity/user-merge-engine.ts for the immediate correction and
the subsequent isolated A2 four-file manifest under a strict server-binding policy.
Gemini tests the frozen correction before Sol acceptance. TC17/TC18/TC20-B manifests
need the specified precision/caller coverage. Do not repeat already selected D4-D7
policy questions or claim all twenty items accepted. Historical evidence below stays.

- **Issued**: 2026-11-06
- **Assigned role**: `Argon` — Primary critical production implementer for `TC01`–`TC20` (including `TC20-B`) and critical portions of `FND01`–`FND30`
- **Runtime identity**: `Gemini 4 Argon (Medium)`
- **Governing authorities**:
  - `audit/Argon_W1_W3_Critical_Implementation_Assignment.md` (committed at `daf693da`)
  - `audit/Sol_W1_W3_Resume_Checkpoint_2ca1889b.md` (committed at `daf693da`)
  - `audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md` (`D1`–`D7`)
  - `audit/Sol_Argon_Temporary_Delegation_TC20A_385976ad.md` (`8f090903`)
  - `audit/Tera_W1_W3_Critical_Handoff.md`
  - `audit/Gemini_W1_W3_Independent_Verification_Report.md`
- **Next handoff**: **Gemini** (for independent `TC20-A` verification with approved `marketing-phase2.test.ts` positive fixture updates) and **Sol** (for `TC20-A` acceptance and next-slice manifest approvals on `TC20-A2`, `TC18`, `TC17`, and `TC20-B`).

---

## A. Confirmed Baseline, Workspace Reconciliation & Process Deviation Record

### 1. Revision Reconciliation
- **Local governance baseline (`daf693da`)**: `daf693dacab1552f59202d0377eb3cfbb9516913` (`docs(audit): transfer critical implementation to Argon and resume Sol control`) on branch `remediation/w1-2-batch-05-targeted`.
- **Pushed TC20-A implementation (`2ca1889b`)**: `2ca1889b430fed5e67379dcf264a968769b0f770` (`fix(analytics): isolate downstream state stores by brand for TC20-A [IMPLEMENTED_UNVERIFIED]`) on `origin/remediation/w1-2-batch-05-targeted`.
- **Earlier isolated Argon worktree (`68496546`)**: `68496546a198b94fbfa8374d805c805b7c5ad89c` on `argon/tc20a-analytics-isolation` in `.worktrees/argon-tc20a` (source-equivalent under `packages/marketing-site/src/lib` to `2ca1889b`, now behind `remediation/w1-2-batch-05-targeted` and left untouched).
- **Other registered worktrees (untouched)**:
  - `.worktrees/remediation-patch-blocks-schema` at `4350b14a` (dirty; untouched and not used as a `TC18` baseline).
  - `.worktrees/verification/verify-9db3b8c89322` (`f14539b9`) and `.worktrees/verification/verify-adb8cba63a89` (`8721b534`, locked) — untouched.

### 2. Recorded Process Deviation (`2ca1889b` / `68496546` Remote Publication)
Per `audit/Sol_W1_W3_Resume_Checkpoint_2ca1889b.md` (lines 39–45), the earlier `TC20-A` commits (`2ca1889b` on `remediation/w1-2-batch-05-targeted` and `68496546` on `argon/tc20a-analytics-isolation`) were pushed to `origin` despite the delegation's no-push rule. That remote publication is recorded here as a process deviation; the remote snapshot is treated strictly as frozen, unaccepted source (`IMPLEMENTED_UNVERIFIED`). No history was rewritten or reverted, explicit-path staging is used for this commit, and **no push is performed** for this `TC20-A` caller amendment.

---

## B. Updated TC01–TC20 Implementation Matrix & FND01–FND30 Crosswalk

### 1. TC01–TC20 Disposition Matrix (Preserving Sol Checkpoint Statuses)

| Item | Parent FND | Current Sol Disposition | Argon Status / Next Action & Independent Gate |
| :--- | :--- | :--- | :--- |
| **TC01** | FND01, FND02, FND26 | `PARTIAL`; current source/worktrees and transfer reconciled | Reconciled in this handoff across all 20 TC items and 30 FND tasks at frozen source. |
| **TC02** | FND03, FND06, FND18 | `IMPLEMENTED, PENDING VERIFICATION` across all supported callers | Verify canonical-brand adapter rejection and empty-role self path; do not restore RTH fallback. |
| **TC03** | FND03, FND06 | `CHANGES_REQUESTED` for complete management policy; self-only D1 source reported | Gemini reconciles two obsolete admin positives (`ownership.service.test.ts` L49, L97); Argon supplies legitimate explicit management boundary after Sol manifest approval. |
| **TC04** | FND03, FND05, FND18 | `PARTIAL` / trusted mapping unqualified | Prove local/original/projection bridge; reject shadow/email equality as authority. |
| **TC05** | FND03, FND18, FND24, FND26 | `IMPLEMENTED, PENDING` full composition acceptance | `@quiz/auth` and `@quiz/api-server` typechecks exit 0; Gemini independently tests real profile GET/PATCH bindings, empty roles, and zero-effects denial. |
| **TC06** | FND03, FND05, FND18 | `ACCEPTED` only as prior source containment; migration/provenance rollout `BLOCKED` | Prepare expand/backfill/quarantine/constraint design offline; never apply blocked guessed migrations (`0001_fnd03_add_tenant_ownership.sql`, `0029_fnd03_add_tenant_to_progress.sql`). |
| **TC07** | FND11, FND18 | `ACCEPTED` within isolated normalized local lookup; uniqueness/concurrency incomplete | Complete reviewed platform-scoped uniqueness design and consumer inventory. |
| **TC08** | FND11, FND16 | `ACCEPTED` local-account containment only; provisioning `NOT IMPLEMENTED` | Design secure expiring invitation/new-account flow and conflict-safe transaction; no fixed credentials or foreign account binding. |
| **TC09** | FND03, FND05, FND21 | `NOT COMPLETE`; private tenant persistence unresolved | Propagate trusted tenant/local ownership across four separately classified progress lanes after TC06 provenance schema disposition. |
| **TC10** | FND05, FND21, FND25 | `NOT COMPLETE`; physical SQL/concurrency unqualified | Implement D3 database-atomic merge/CAS/transaction contract at actual repository calls. |
| **TC11** | FND03, FND04, FND23 | `NOT COMPLETE`; export producer/worker provenance unresolved | Bind stored owner/tenant across exam/job creation, dispatch, retry, cache, and storage references. |
| **TC12** | FND04, FND24 | `CHANGES_REQUESTED`; retained foreign export denials open | Enforce provenance verification before all six reader/status/URL/storage/download paths (depends on TC11). |
| **TC13** | FND06, FND19 | `CHANGES_REQUESTED`; privileged target/context proof open | Resolve actor/request/target/store conflict before privileged queries. |
| **TC14** | FND07, FND14 | `ACCEPTED` only for reported isolated cache containment | Browser installation/upgrade, authentication-owner epoch transitions, and delayed callback isolation remain open. |
| **TC15** | FND08, FND09, FND15, FND22 | `ACCEPTED` client auto-approval removal only; persisted gate `NOT IMPLEMENTED` | Implement D4 verified actor and persisted atomic human Gate 1 approval contract at every backend transition entry. |
| **TC16** | FND13, FND18, FND19, FND24 | `PARTIAL`; placement selected evidence, taxonomy caller gaps | Preserve `match: null` for uncalibrated scores; finish all five taxonomy caller contracts; Gemini repairs catalog route test auth fixtures (`routes.test.ts`). |
| **TC17** | FND14, FND20 | `INVESTIGATION` / compatibility plan only | Inventory & manifest submitted in §E.3 below for D5 immutable versioned option-ID answer encoding across both scorers and callers. |
| **TC18** | FND21, FND24 | `CHANGES_REQUESTED`; malformed nesting/example injection retained | Inventory & manifest submitted in §E.2 below for D6 recursive validation (`MAX_NESTING_DEPTH=3`, 10,000-node guard, 500-root limit) and preview/storage separation. |
| **TC19** | FND15, FND22 | `PARTIAL`; hash schema is not approval/runtime evidence | Compose HTTP/service/evidence authority and distinguish digest, signature, and approval. |
| **TC20** | FND23–FND30 | `CHANGES_REQUESTED` overall; `TC20-A` caller fix frozen (`IMPLEMENTED_UNVERIFIED`); `TC20-A2` & `TC20-B` open | **TC20-A**: `tracker.ts` caller repair completed and frozen in this commit for Gemini. **TC20-A2** & **TC20-B**: Inventories and proposed manifests submitted in §E.1 and §E.4 below. |

### 2. FND01–FND30 Status Summary (Argon Critical Implementation Ownership)

- **PARTIAL (20)**: `FND01`, `FND02`, `FND03`, `FND05`, `FND06`, `FND07`, `FND08`, `FND11`, `FND12`, `FND13`, `FND14`, `FND15`, `FND16`, `FND17`, `FND18`, `FND19`, `FND22`, `FND25`, `FND26`, `FND27`.
- **VERIFICATION_FAILED (4)**: `FND04` (foreign export controls), `FND20` (delimiter/option-ID scoring), `FND21` (nested documents & authoring storage truth), `FND23` (event invariants & unaccepted analytics A integration).
- **NOT COMPLETE (6)**: `FND09` (persisted human Gate 1), `FND10` (runtime readiness/physical journeys), `FND24` (cross-consumer integration — `tracker.ts` caller repaired here, pending Gemini verification), `FND28` (independent re-audit), `FND29` (W4 entry gate), `FND30` (final closure).

---

## C. P0 TC20-A Tracker Caller Correction & Diagnostic Evidence

### 1. Authorized Production Manifest & Exact Changes
Per `audit/Sol_W1_W3_Resume_Checkpoint_2ca1889b.md` (§P0, lines 47–57 and 136), Argon's exclusive editable scope for this slice is:
1. `packages/marketing-site/src/lib/analytics/tracker.ts` (production)
2. `audit/Argon_W1_W3_Critical_Handoff.md` (scoped implementer handoff)

**Change applied in `packages/marketing-site/src/lib/analytics/tracker.ts` (lines 45–54)**:
- Passed `brandId: baseContext.brandId` into `resolveIdentity({ brandId: baseContext.brandId, ... })`.
- Passed `brandId: baseContext.brandId` into `updateSession({ brandId: baseContext.brandId, ... })`.
- No default brand was added, no authority was derived from `partialContext`, no validation was relaxed, and the original 8 `TC20-A` files plus `brand-dedupe-control.test.ts` and `marketing-phase2.test.ts` were left 100% untouched.

### 2. Verification Commands, Exit Codes & Observed Results

| Verification Check | Exact Command | Exit Code | Result |
| :--- | :--- | :--- | :--- |
| **Marketing-site Typecheck** | `pnpm --filter @quiz/marketing-site exec tsc --noEmit` | `0` | **PASS** (0 errors) |
| **Guarded 7-File Offline Analytics Suite** | `node --input-type=module -e "import path from 'node:path'; import { startVitest } from 'vitest/node'; for (const k of Object.keys(process.env)) { if (/DATABASE\|DIRECT_URL\|REDIS\|UPSTASH\|NEON\|QSTASH/i.test(k)) delete process.env[k]; } const ctx = await startVitest('test', ['packages/marketing-site/src/lib/analytics/__tests__/', 'packages/marketing-site/src/lib/analytics/providers/__tests__/'], { config: false, watch: false, maxWorkers: 1, fileParallelism: false, environment: 'node', reporters: ['verbose'], exclude: ['**/node_modules/**', '**/.worktrees/**'], setupFiles: [path.resolve('audit/W1_W3_Offline_Test_Network_Guard.ts')] }); process.exit(ctx?.state.getCountOfFailedTests() ? 1 : 0);"` | `1` | **6/7 files passed; 13 passed / 2 failed** (improved from 12 passed / 3 failed at checkpoint `2ca1889b`) |
| **Code Graph Update** | `graphify update .` | `0` | **PASS** (AST graph updated) |

**Per-File Breakdown of the 7-File Guarded Selection**:
1. `packages/marketing-site/src/lib/analytics/__tests__/tracker-provider-http.test.ts`: **PASS (1/1)** — real `AnalyticsTracker.trackEvent` path now succeeds with `baseContext.brandId`, recording failed dispatch on HTTP 503 and no failure on HTTP 202.
2. `packages/marketing-site/src/lib/analytics/__tests__/brand-dedupe-control.test.ts`: **PASS (2/2)** — unchanged `FAIL-04` regression (`sessionDepth = 1`, `leadScore = 2` across colliding IDs) and same-brand retry deduplication pass.
3. `packages/marketing-site/src/lib/analytics/__tests__/tc20a-brand-isolation.test.ts`: **PASS (2/2)** — cross-brand isolation across lead score, session timeline, funnel, identity, journey, attribution, and AI features (`retention_session_depth`, `recommendation_lead_score`), plus missing/unknown brand fail-closed zero-mutation checks pass.
4. `packages/marketing-site/src/lib/analytics/__tests__/marketing-intelligence.test.ts`: **PASS (2/2)**.
5. `packages/marketing-site/src/lib/analytics/__tests__/ingest-failure-behavior.test.ts`: **PASS (1/1)**.
6. `packages/marketing-site/src/lib/analytics/providers/__tests__/internal-http-failure.test.ts`: **PASS (3/3)**.
7. `packages/marketing-site/src/lib/analytics/__tests__/marketing-phase2.test.ts`: **2 passed / 2 failed** — lines 12 (`resolveIdentity`) and 26 (`updateSession`) omit `brandId` and fail closed with `Error: invalid_analytics_brand`. Per `Sol_W1_W3_Resume_Checkpoint_2ca1889b.md` (lines 59–63, 137), Gemini owns adding explicit valid `brandId` values to those two positive fixture calls.

---

## D. Gemini Next Independent Verification Handoff (`TC20-A`)

1. **Frozen Source Revision**: Use the local commit SHA of this handoff on `remediation/w1-2-batch-05-targeted`.
2. **Authorized Gemini Scope (`Sol_W1_W3_Resume_Checkpoint_2ca1889b.md` L59–65, L137)**:
   - Update only the legitimate positive calls in `packages/marketing-site/src/lib/analytics/__tests__/marketing-phase2.test.ts` (lines 12, 26, 32) to supply an explicit valid `brandId` (`"realtutorialhub"`).
   - Add independent adverse/positive controls in `packages/marketing-site/src/lib/analytics/__tests__/gemini-tc20a-*.test.ts` and report in `audit/Gemini_TC20A_Independent_Review.md`.
   - Keep `brand-dedupe-control.test.ts` unchanged and do not edit any production files.
   - Verify all 7+ analytics test files pass (`0` failures) under the offline network guard with service credentials cleared, and report source and test commit SHAs separately to Sol.

---

## E. Proposed Next Critical Implementation Slices (Inventories & Allowed-File Manifests for Sol Approval)

### 1. Slice Priority 1: `TC20-A2` — Analytics Ingress Brand Authority & Browser Context Integrity
- **TC / FND Mapping**: `TC20` (`FND23`, `FND24`, `FND26`).
- **Source Inventory**:
  1. **Next.js Ingress (`packages/marketing-site/src/lib/analytics/server/route.ts` L14–31)**: `handleAnalyticsTrackRequest` reads `const brandHeader = request.headers.get("x-analytics-brand")` and passes it as `brandId` to `resolveBrandAnalyticsConfig({ brandId, hostname })`. Because `resolveBrandAnalyticsConfig` (`packages/marketing-site/src/config/analytics.ts` L84–104) checks `if (input.brandId) return brandConfigs[input.brandId]` before checking `hostname`, any unauthenticated client can spoof `x-analytics-brand` to write into another tenant's analytics partition.
  2. **Collector Service Ingress (`services/analytics-collector-service/src/index.ts` L32–49)**: `app.post('/track')` identically reads `c.req.header('x-analytics-brand')` and calls `resolveBrandAnalyticsConfig({ brandId, hostname })`.
  3. **Unknown-Host Fallback (`packages/marketing-site/src/config/analytics.ts` L84–104)**: When `hostname` is absent or does not match `brandConfigs[brand].hostnamePatterns` (`realtutorialhub.com` / `skillupitacademy.com`), `resolveBrandAnalyticsConfig` silently returns `brandConfigs.realtutorialhub` (L103) instead of failing closed.
  4. **Browser Tracker `partialContext` Override (`packages/marketing-site/src/lib/analytics/tracker.ts` L67–91)**: `AnalyticsTracker.trackEvent` resolves identity and updates session using `baseContext.brandId` (from `this.options.config.brand.brandId`), but then spreads `...partialContext` over `...baseContext` (L71–72) without pinning `brandId: baseContext.brandId`, allowing a caller passing `partialContext.brandId` to emit an envelope whose `context.brandId` disagrees with the tracker's configured brand.
- **Proposed Allowed-File Manifest (4 files, disjoint from `TC18`/`TC17`/`TC20-B`)**:
  1. `packages/marketing-site/src/config/analytics.ts` — Add a strict server-side resolver `resolveVerifiedIngressBrandConfig(input: { hostname?: string; configuredBrandId?: AnalyticsBrandId })` that derives brand strictly from deployment-configured brand binding (`ANALYTICS_SERVER_BRAND_ID`) or verified `hostname` matching `hostnamePatterns`, rejecting unknown/missing hosts (`throw new Error("invalid_analytics_brand")`) and never accepting client header/body brand overrides unless explicitly matched to the verified host.
  2. `packages/marketing-site/src/lib/analytics/server/route.ts` — Derive brand from `resolveVerifiedIngressBrandConfig({ hostname })`; if `x-analytics-brand` or `body.context.brandId` is present and mismatches the verified host brand, reject with `400 invalid_analytics_brand` before calling `ingestAnalyticsEvent`.
  3. `services/analytics-collector-service/src/index.ts` — Apply the identical host/deployment brand verification and mismatch rejection in `POST /track`.
  4. `packages/marketing-site/src/lib/analytics/tracker.ts` — Pin `brandId: baseContext.brandId` after `...partialContext` in `AnalyticsTracker.trackEvent` (or reject mismatched `partialContext.brandId`).

### 2. Slice Priority 2: `TC18` — Recursive Nested-Document Validation & Preview/Storage Separation (Sol `D6`)
- **TC / FND Mapping**: `TC18` (`FND21`, `FND24`).
- **Source Inventory**:
  1. **Recursive Escape (`packages/types/src/tutorial-rich-document/schemas/container-blocks.schema.ts` L20)**: `TutorialBlockSchemaLazy` is currently `z.lazy(() => z.any())`, allowing arbitrary malformed/unknown child blocks inside all four container positions:
     - `two-column`: `content.left.blocks` and `content.right.blocks` (L30–35)
     - `three-column`: `content.columns[0..2].blocks` (L44–48)
     - `card-grid`: `content.cards[].blocks` (L56)
     - `timeline`: `content.items[].blocks` (L73)
  2. **Structural Limits & Cycle/Node Guards (`packages/types/src/tutorial-rich-document/constants.ts`, `schemas/blocks.schema.ts`, `schemas/document.schema.ts`, `validators/document-validator.ts`)**: Root array has `MAX_BLOCKS_PER_DOCUMENT = 500` (`document.schema.ts` L22). Per Sol `D6`, container children must bind recursively to canonical `TutorialBlockSchema` (preserving schema-v1 legacy and explicit versioned shapes while rejecting `C1` blocks missing required `version`), enforce `MAX_NESTING_DEPTH = 3` (root depth 0), detect in-memory reference cycles, enforce a `10,000` total-node traversal budget (distinct from the 500-root limit), and reject duplicate block IDs across the entire tree.
  3. **Authoring / Storage Example Injection (`apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/**` and `packages/db-tutorial/src/services/tutorial-document-builder.ts`)**: `buildTutorialDocument` (`tutorial-document-builder.ts` L29) wraps blocks without validating them, and storage preparation for `D1` (Definition) / `I1` (Introduction) blocks injects preview/sample educational content into missing authored fields during persistence preparation.
- **Proposed Allowed-File Manifest (Disjoint from `TC20-A2`, `TC17`, `TC20-B`)**:
  1. `packages/types/src/tutorial-rich-document/constants.ts`
  2. `packages/types/src/tutorial-rich-document/schemas/container-blocks.schema.ts`
  3. `packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts`
  4. `packages/types/src/tutorial-rich-document/schemas/document.schema.ts`
  5. `packages/types/src/tutorial-rich-document/validators/document-validator.ts`
  6. `packages/db-tutorial/src/services/tutorial-document-builder.ts`
  7. `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/**` (storage-preparation vs preview-sample helper files identified in the admin composer).

### 3. Slice Priority 3: `TC17` — Versioned Option-ID Answer Encoding & Scoring Compatibility (Sol `D5`)
- **TC / FND Mapping**: `TC17` (`FND14`, `FND20`).
- **Source Inventory**:
  1. **Question Contract (`apps/api-server/src/modules/question/question-contract.ts`)**: `parseAnswer` splits comma-separated strings; `normalizeQuestionOptions` generates positional fallback IDs when option IDs are absent.
  2. **Batch / Service Scorer (`apps/api-server/src/modules/scoring-engine/scoring.engine.ts` L43–75)**: `resolveAnswerForScoring` and `resolveCorrectAnswerForScoring` resolve option IDs/labels to `option.text ?? option.code ?? option.label ?? answerId`, join them with `,`, and pass them to `MultiSelectEvaluator.evaluate` (`apps/api-server/src/modules/answer-engine/evaluators/multi-select.evaluator.ts` L10–32), which calls `parseAnswer` (splitting on commas again). When a single correct option's text contains a comma (e.g., `"A, B"`), it splits into multiple tokens and corrupts partial-credit scoring.
  3. **Immediate / Exam Engine Scorer (`apps/api-server/src/modules/exam-engine/**` and `apps/api-server/src/modules/answer-engine/answer.engine.ts`)**: Parallel answer resolution and evaluation path.
- **Proposed Allowed-File Manifest (Disjoint from `TC20-A2`, `TC18`, `TC20-B`)**:
  1. `apps/api-server/src/modules/question/question-contract.ts`
  2. `apps/api-server/src/modules/answer-engine/evaluators/multi-select.evaluator.ts`
  3. `apps/api-server/src/modules/answer-engine/answer.engine.ts`
  4. `apps/api-server/src/modules/scoring-engine/scoring.engine.ts`
  5. `apps/api-server/src/modules/exam-engine/exam.service.ts` (if immediate submission encoding normalization resides there).

### 4. Slice Priority 4: `TC20-B` — Durable Event Delivery, Envelope-Type Verification & Claim/Lease (Sol `D7`)
- **TC / FND Mapping**: `TC20` (`FND23`, `FND24`, `FND25`).
- **Source Inventory**:
  1. **Consumer Handler (`packages/events/src/consumer.ts` L38–75)**:
     - Line 57: `const parsed = (options.schema ?? PlatformEventEnvelopeSchemas[type]).parse(JSON.parse(body))` — when `options.schema` is supplied, `parsed.type === type` is not enforced!
     - Line 58: `const idempotencyKey = \`\${options.keyPrefix ?? 'event'}:\${parsed.correlationId}\`` — uses `correlationId` (tracing ID) instead of verified `tenant + event.id + consumer/operation version` and payload fingerprint!
     - Lines 60–72: Non-atomic `get` then `set` **before** `await handler(parsed)`! If `handler(parsed)` throws or returns `5xx`, the event is already marked processed in `idempotencyStore`, causing retries to be silently ignored as `"Duplicate event ignored"` (`200`)!
  2. **Worker Producer/Registration Mismatches (`Tera_W1_W3_Critical_Handoff.md` L54, L56)**:
     - `apps/api-server/src/app/api/workers/award-project-badge/route.ts` registers `PROJECT_SUBMITTED` while `apps/realtutorialhub-admin/src/app/api/tutorial/projects/submissions/[id]/approve/route.ts` publishes custom literal `project.approved`.
     - `apps/api-server/src/app/api/workers/issue-certificate/route.ts` registers `CERTIFICATE_ISSUED` while custom schema uses `project.certificate_requested`.
     - Remediation notification worker supplies a payload schema rather than a full envelope.
- **Proposed Allowed-File Manifest (Disjoint from `TC20-A2`, `TC18`, `TC17`)**:
  1. `packages/events/src/types.ts`
  2. `packages/events/src/consumer.ts`
  3. `packages/events/src/idempotency.ts` (if present/imported)
  4. Worker route adapters: `apps/api-server/src/app/api/workers/award-project-badge/route.ts`, `apps/api-server/src/app/api/workers/issue-certificate/route.ts`, and the remediation notification worker route.

---

## F. Current Blockers & Required Sol Decisions

1. **`TC20-A` Independent Verification & Acceptance Gate**:
   - Argon's `tracker.ts` caller correction is frozen (`IMPLEMENTED_UNVERIFIED`). Gemini must apply the Sol-authorized explicit-brand positive fixture updates in `marketing-phase2.test.ts` and execute the full offline analytics verification suite before Sol issues `TC20-A` acceptance.
2. **Manifest Approvals Needed from Sol for Next Production Slices**:
   - Explicit Sol approval of the proposed allowed-file manifests in **§E.1 (`TC20-A2`)**, **§E.2 (`TC18`)**, **§E.3 (`TC17`)**, and **§E.4 (`TC20-B`)** before Argon begins editing those production files.
3. **Policy / Provenance Dependencies Retained from Sol Checkpoint**:
   - **TC03 / TC05 / TC13**: Explicit administrative profile management route/service boundary definition vs self-only ownership API (`ownership.service.ts`), and shared-store (`skillhubcore`) profile row provenance proof.
   - **TC06 / TC09**: Provenance-aware backfill/quarantine schema design before unblocking tenant progress persistence (`TC09`) or replacing blocked migrations (`0001_fnd03_add_tenant_ownership.sql`, `0029_fnd03_add_tenant_to_progress.sql`).
   - **TC15**: Persisted human Gate 1 approval table/schema and self-approval policy selection before backend transition enforcement.

