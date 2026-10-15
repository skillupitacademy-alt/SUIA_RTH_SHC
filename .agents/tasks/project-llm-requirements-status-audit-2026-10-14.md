# Project LLM Requirements Status Audit

**Audited:** 2026-10-14  
**Repository revision:** `53ed8b0e` on `main`  
**Inputs:**
- `C:\Users\RealTutorialHub\.codex\attachments\96a450e1-398b-4934-a089-0e1b5dbb4183\pasted-text.txt`
- `C:\Users\RealTutorialHub\.codex\attachments\e8efe4c8-c65b-4323-be3e-09957d3b2650\pasted-text.txt`

## Reading Rule

The two inputs repeat requirements under inconsistent B/F/Q agent numbering. This
audit normalizes them into their unique, testable capabilities. Current source and
executable evidence are authoritative; a planning statement or a test that permits
`BLOCKED` is not treated as completion.

Status meanings: **complete** = implemented with focused tests; **partial** =
implemented but not wired, not independently proven, or only covers part of the
requirement; **pending** = not implemented as required.

## Backend Workflow

| Requirement | Status | Evidence | Remaining work |
| --- | --- | --- | --- |
| One canonical workflow state machine and human gates | **Partial** | [canonical_workflow.py](../../services/project-ai/app/orchestration/canonical_workflow.py) defines the 17-state lifecycle, including implementation and final approval gates. Legacy creation routes explicitly return deprecation guidance. | Make the UI and all external clients use this authority. Old evidence and local UI state still model their own workflow. |
| Repository intelligence, snapshot-bound target identity, and evidence | **Partial** | Repository-intelligence models/tests exist, and the contract binds source snapshot fields. See [test_repository_intelligence.py](../../services/project-ai/tests/unit/test_repository_intelligence.py). | Prove discovery against the current TypeScript registry in the real workflow; the admin UI still reads a static corpus. |
| Immutable, self-contained engineering contract | **Complete** | [engineering_contract.py](../../services/project-ai/app/contracts/engineering_contract.py) includes canonical paths, runtime/composer/theme/brand constraints, prohibited behaviors, and deterministic sealing. Focused tests exist in [test_engineering_contract.py](../../services/project-ai/tests/unit/test_engineering_contract.py) and [test_w2_contract_generation.py](../../services/project-ai/tests/integration/test_w2_contract_generation.py). | Include it in a real E2E run, rather than the old simulated golden run. |
| Candidate intake, hash, target matching, and manifest/classification | **Complete in backend** | [candidate.py](../../services/project-ai/app/api/routes/candidate.py) validates workflow state and target binding; comparator and candidate tests exist. | Expose the actual JSON API contract to the frontend and cover it in a browser/API integration test. |
| Canonical comparison and safe placement planning | **Complete in backend** | Comparator and placement-manifest units are present in [test_canonical_comparator.py](../../services/project-ai/tests/test_canonical_comparator.py) and [test_placement_manifest.py](../../services/project-ai/tests/unit/test_placement_manifest.py). | Add this path to the real golden E2E test. |
| Human implementation approval and approval-bound repository mutation | **Complete in backend** | [executor.py](../../services/project-ai/app/placement/executor.py) requires a fully bound `ImplementationApproval`; [repository_adapter.py](../../services/project-ai/app/placement/repository_adapter.py) validates repository writes. Integration and security suites cover this in [test_implementation_approval.py](../../services/project-ai/tests/integration/test_implementation_approval.py) and [test_w5_placement_authorization.py](../../services/project-ai/tests/security/test_w5_placement_authorization.py). | Wire the actual governance endpoint into the UI and execute a real worktree run in E2E. |
| Runtime, composer, renderer, theme, brand, and browser verification | **Partial** | Verification modules and focused tests exist under [app/verification](../../services/project-ai/app/verification). Browser certification has a real runner path but gracefully degrades when Playwright is unavailable. | Run a real started application plus Playwright and fail certification when required browser evidence is absent. The checked-in golden test records stub passes here. |
| Final gate and certification only after evidence | **Partial** | [workflows.py](../../services/project-ai/app/api/routes/workflows.py) exposes final approval and the state machine requires `CERTIFICATION_READY` before `CERTIFIED`. | Replace stale E2E simulation, assert all required evidence IDs and current commit SHA, and retain the produced evidence ledger. |
| No fabricated PASS / release evidence tied to current SHA | **Pending** | The latest [workflow-e2e-result.json](workflow-e2e-result.json) is from `2026-10-13`, names the old branch, reports `overall: BLOCKED`, and records 11 blocked stages. [test_m2_9_golden_e2e.py](../../services/project-ai/tests/e2e/test_m2_9_golden_e2e.py) intentionally stubs/simulates stages and accepts either `PASS` or `BLOCKED`. | Rewrite it to call current APIs and actual verification runners; require `overall == PASS`; bind result to `53ed8b0e` (or the release SHA). |

## Rich Tutorial Runtime

| Requirement | Status | Evidence | Remaining work |
| --- | --- | --- | --- |
| I1, C1, and D1 reference implementations preserve runtime/theme integration | **Complete for the three reference versions** | [TutorialBlockRenderer.tsx](../../packages/ui/src/tutorial/TutorialBlockRenderer.tsx) explicitly routes `I1` and `C1`; the dedicated I1/C1/D1 components and renderer-routing tests are present. | Keep their DOM identity and runtime contracts covered when adding versions. |
| Create and render I2 (and future family/version expansion) through the canonical registry | **Pending** | The renderer deliberately rejects Introduction versions other than `I1`; [TutorialRendererRouting.test.tsx](../../packages/ui/src/tutorial/__tests__/TutorialRendererRouting.test.tsx) asserts this. `I2` occurs only in types, fixtures, or an explicit unsupported-version test, not an I2 implementation. | Add schema, registry entry, component, Composer data, tests, and real verification for I2 before presenting it as supported. |
| ILS, LSNB, RSSB, UBRC, theme, and brand boundaries for new blocks | **Partial** | The contract declares these constraints and reference versions use runtime/theme inputs. | No current real I2 implementation exists to certify against the required boundaries. |

## Admin Frontend

| Requirement | Status | Evidence | Remaining work |
| --- | --- | --- | --- |
| F01: frontend talks to the real Project LLM API | **Pending** | [projectLlmClient.ts](../../apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts) defaults to `/api/project-llm`, uploads multipart `workflowId`/files, and calls endpoints absent from FastAPI. The server mounts candidate routes at `/candidates` and accepts a JSON `CandidatePackage`; placement approval is `/governance/workflows/{id}/approve-placement`. | Define one OpenAPI/client contract, configure the proxy/base URL, and add contract tests for every call. |
| F02: create workflow from discovered repository data | **Pending** | [create/page.tsx](../../apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/create/page.tsx) uses client-side family/version data and [ProjectLlmContext.tsx](../../apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/context/ProjectLlmContext.tsx) persists presentation state in local storage. | Call workflow/discovery APIs; use the server workflow ID and state as the source of truth. |
| F03: external-AI handoff from an immutable contract | **Partial** | The handoff page exists and requests a contract. | Make its base URL/auth/error handling match FastAPI and prove the returned sealed contract belongs to the selected workflow. |
| F04/F05: candidate upload, placement approval, and certification display | **Pending** | The client API shapes do not match the server. [workflow-details/page.tsx](../../apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/workflow-details/page.tsx) contains static timeline, agent, evidence, and log data. | Replace all illustrative data with backend responses and show blocked/failed verification honestly. |
| F06: workflow/progress/evidence views | **Pending** | Several Project LLM pages use static corpus/log/evidence information; they are not evidence-led views. | Render server history, artifacts, approval, and certification evidence with loading, error, and empty states. |

## Test And Release Position

- Focused backend units and earlier targeted integration/security runs have passed, including the contract and approval work referenced above.
- This audit did **not** claim a new full-suite pass. The last known full main integration attempt exceeded its time limit, and the broader non-integration run previously exposed stale root-level tests/fixtures outside the focused Project LLM suites.
- The canonical golden E2E is executable but is **not** a release test: it is explicitly designed to mark missing work `BLOCKED`, uses stubs/simulated approval, and accepts `BLOCKED` as success.
- Therefore the project is **not ready to declare all attached tasks complete or release-ready**. Backend foundations are advanced; the release blockers are truthful E2E evidence and full frontend-to-backend wiring.

## Ordered Remaining Work

1. Replace the stale golden E2E with an API-driven workflow that performs intake, comparison, approval, placement in an isolated worktree, verification, and final approval; require `PASS` and the release SHA.
2. Publish a shared API schema/client and make the admin client match FastAPI routes and JSON models exactly.
3. Convert every Project LLM admin screen from static/local data to server workflow, history, artifacts, approvals, and evidence.
4. Implement I2 end to end before it can be selected as a supported target.
5. Run the full relevant suite plus a real browser run, attach immutable evidence, then perform the independent audit/release decision.
