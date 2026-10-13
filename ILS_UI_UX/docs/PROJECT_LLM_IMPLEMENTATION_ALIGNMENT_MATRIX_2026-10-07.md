# Project LLM Implementation Alignment Matrix

Status: AUDIT COMPLETE
Audit date: 2026-10-07
Current branch audited: project-ai-gui
Current HEAD audited: 44d4928d
Requested window interpreted as: 2026-10-05 10:15 IST onward

Note: the request said "Monday 05th November 2026 10:15AM". Because the current date is 2026-10-07 and the active Project LLM timeline is October 2026, this audit treats the intended date as Monday, 2026-10-05 10:15 IST.

## User Scenario Being Audited

The intended Project LLM workflow is:

1. User selects a block family.
2. Project LLM shows existing versions already available for that block in Tutorial Composer / repository evidence.
3. User decides the next target version.
4. Project LLM generates compliance checklist and External AI prompt covering ILS runtime, RSSB, LSNB, Tutorial Composer membership, UBRC, runtime, testing, evidence, and brand independence.
5. User works with External AI to create and approve an HTML/CSS/JS/JSON GUI prototype.
6. After human GUI approval, External AI converts the approved prototype into project-compliant React/TypeScript/project files.
7. User uploads those candidate files into Project LLM.
8. Project LLM audits the candidate package against compliance requirements, tests it, plans integration, and embeds it only through approved workflow so Tutorial Composer can use the block with the user-selected version number.
9. Project LLM verifies the block is brand-independent and compatible with ILS, LSNB, RSSB, UBRC, Tutorial Composer, and runtime.
10. Human/HAA remains the final authority.

Project LLM should not decide the educational GUI mix-and-match layout. That remains a user plus External AI responsibility. Project LLM's job is repository evidence, compliance brief generation, candidate intake, audit, testing, controlled integration, evidence, and certification readiness.

## Executive Verdict

The repository is moving in the correct direction, but the current implementation is not yet a complete working Project LLM workflow.

What is strongly aligned:

- The Project LLM GUI now contains the intended surfaces: create block, registry/version discovery, compliance brief, External AI handoff, candidate upload, integration/certification, workflow details.
- A real TypeScript repository discovery package exists at `packages/project-llm-discovery`.
- A FastAPI backend exists at `services/project-ai` with candidate, creation, governance, evidence, snapshot, task, and agent routes.
- The backend has explicit safety concepts: manifest-bound approval, self-approval rejection, evidence IDs, certification gates, placement manifest, and repository snapshot dependency.
- Discovery package tests pass.

Main blockers:

- The admin Project LLM frontend is mostly hardcoded/local-state and is not connected to the FastAPI backend.
- Candidate upload UI is not a real file upload flow yet.
- Compliance brief UI uses static checklist text, not backend-generated repository-evidence-backed prompt generation.
- Backend candidate intake currently accepts JSON `CandidatePackage`, not browser ZIP/file upload.
- Backend stores candidates, workflows, and approvals in memory, so it is not durable.
- Backend certification tests currently fail: 55 failed, 269 passed, 6 skipped.
- The backend has an execution path that can write candidate files and make git commits after approval; this is powerful and must be kept behind strict human/HAA authorization and likely isolated worktree rules.
- The implementation introduces a 15-agent architecture; that is acceptable only if it remains a bounded implementation decomposition, not a replacement for the canonical Project LLM architecture.

## Commits Reviewed

The current branch contains Project LLM / Project AI commits from:

- `939466b5` on 2026-10-05 10:41 IST: Project LLM architecture documentation and LLM concept materials.
- M0/M1/M2/M3 implementation waves across 2026-10-05 and 2026-10-06.
- `01180e13` on 2026-10-07 00:46 IST: Project LLM GUI control-plane layout and block workflow surfaces.
- `6bf7c91a` on 2026-10-07 09:33 IST: seven-page human-centric autonomous engineering GUI.
- `44d4928d` on 2026-10-07 09:40 IST: dashboard recreation.

Related branches found locally:

- `main`: `9b272567`, Merge PR #23: M1 Repository Discovery - HAA Approved.
- `m1-repository-discovery`: `99d05957`, terminal sync and closure decision.
- `m2-project-ai-foundation`: `0d7b4684`, 15-agent DAG architecture final review.
- `project-ai-gui`: current branch, `44d4928d`.

## Verification Run

Commands run:

```text
pnpm --filter @quiz/project-llm-discovery test
pnpm --filter @quiz/project-llm-discovery type-check
python -m pytest services/project-ai/tests -q
```

Results:

| Area | Result |
|---|---|
| TypeScript discovery package tests | PASS: 32 files, 245 tests |
| TypeScript discovery package type-check | PASS |
| Python Project AI service tests | FAIL: 55 failed, 269 passed, 6 skipped |

The Python failures mostly cluster around certification gate behavior and manifest validation precedence. Many tests expected specific gate failures such as renderer, registry, runtime, browser, brand, or theme failures, but the implementation often returns `Manifest validation failed` / `BLOCKED` before the specific gate result.

## Alignment Matrix

| Architecture Requirement | Current Evidence | Status | Assessment | Required Work |
|---|---|---:|---|---|
| User selects block family | `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/create/page.tsx`, `registry/page.tsx` | PARTIAL | GUI exists. Create page uses hardcoded family/version data; registry uses `BLOCK_CORPUS_REGISTRY`. | Replace hardcoded family data with discovered/canonical registry source. |
| Show existing versions for selected block | `registry/page.tsx`, `create/page.tsx`, `ProjectLlmContext.tsx` | PARTIAL | Existing versions are shown, but not consistently evidence-backed. Context defaults to `Introduction I7` and `I1-I6`. | Bind versions to discovery snapshot / corpus registry and clearly distinguish implemented, documented, planned, unknown. |
| User decides next target version | `ProjectLlmContext.tsx` computes next version by `existingVersions.length + 1` | PARTIAL | Simple generated target version exists. It may be wrong for families with gaps or nonnumeric IDs. | Let user choose target version; validate against existing/discovered versions and version rules. |
| Project LLM provides compliance prompt for External AI | `compliance-brief/page.tsx`, `external-ai-handoff/page.tsx` | PARTIAL | Good UI wording exists for ILS/LSNB/RSSB/Composer/runtime/testing/brand/theme/evidence. Mostly static text. | Generate prompt from repository snapshot, selected family/version, canonical checklist, and runtime evidence. |
| External AI creates HTML/CSS/JS/JSON prototype | UI mentions External AI handoff | PARTIAL | Handoff page exists. No actual prototype intake/preview/approval state persisted. | Add prototype upload/preview, record Gate 1 decision, preserve approved prototype manifest. |
| Human approves GUI before candidate code | Workflow concept exists in docs/UI | PARTIAL | Stepper implies approval, but no durable Gate 1 approval enforcement from frontend to backend. | Implement Gate 1 decision API and block candidate intake until approval exists. |
| External AI converts approved GUI to project files | Architecture supported conceptually | PLANNED | Project LLM should not do this itself. Current implementation does not need to generate the files. | Ensure prompts clearly instruct External AI output package format for React/TS/schema/composer/renderer/tests/docs. |
| Project LLM accepts candidate code upload | `candidate-upload/page.tsx`; `services/project-ai/app/api/routes/candidate.py` | PARTIAL | UI dropzone is visual only. Backend accepts JSON `CandidatePackage`, not actual browser file upload. | Add real upload using `input type=file`/drag-drop, archive extraction or client-side packaging, backend multipart endpoint, hash calculation by Project LLM. |
| Candidate file hashing/manifest | `services/project-ai/app/models/candidate.py`, `candidate.py` | PARTIAL | Candidate file model includes hash, but backend currently trusts uploaded hash values. | Compute hashes server-side and reject mismatches. Never trust External AI manifest as authority. |
| Candidate classification | `services/project-ai/app/api/routes/candidate.py` | PARTIAL | Classification exists but only broad families: Introduction, Tutorial, Assessment, Media, Summary, Custom. | Align with 18 canonical families and version taxonomy. |
| Candidate comparison to existing blocks | `CanonicalComparator`, `compare_candidate` | PARTIAL | Evidence-backed comparison exists, dependent on discovery snapshot. | Confirm all 18 families, version gaps, and known Tutorial Composer versions are included. |
| Candidate placement manifest | `generate_manifest`, `PlacementManifest` | PARTIAL | Manifest exists with hash and target path. Version is hardcoded as `1.0.0`. | Use user-selected version like `I7`/`I2`; validate block family/version against selected workflow. |
| Human implementation approval | `services/project-ai/app/api/routes/governance.py` | PARTIAL | Governance approval API exists with hash and self-approval prevention. | Connect approval records to placement execution. Current `execute_placement` checks a private `_approval_status` on manifest that is not updated by governance route. |
| Controlled integration into repo | `services/project-ai/app/placement/executor.py` | RISKY PARTIAL | Executor can write files, create branch, git add, git commit. Approval check exists but integration to governance is incomplete. | Add isolated worktree/sandbox, path allowlist, branch policy, no direct current-branch mutation, explicit HAA approval, dry-run diff preview. |
| Tutorial Composer visibility | `services/project-ai/app/certification/gates.py`, composer verification | PARTIAL | Composer gates exist conceptually. Tests currently fail in many composer/certification cases. | Fix gate tests and implement real registry/schema/renderer/composer update verification. |
| ILS runtime compliance | compliance UI, backend runtime verification | PARTIAL | Checklist exists; backend has runtime verification modules. | Connect uploaded candidate to actual ILS runtime contracts and evidence. |
| LSNB compliance | compliance UI only | PROPOSED | LSNB is in checklist but no clear dedicated backend gate found. | Add explicit LSNB/navigation/learning-structure gate with source evidence. |
| RSSB compliance | compliance UI only | PROPOSED | RSSB is in checklist but no clear dedicated backend gate found. | Add explicit RSSB rendering/style/structure gate with source evidence. |
| UBRC compliance | discovery package and certification gates | PARTIAL | UBRC verification exists. Python tests show gate behavior problems. | Fix manifest validation/gate precedence and assert `data-block-version` for candidate files. |
| Brand independence | `services/project-ai/app/verification/brand.py`, compliance UI | PARTIAL | Backend module exists; tests failing. | Fix tests and ensure scanner checks both code and CSS/Tailwind token usage. |
| Theme compatibility | `services/project-ai/app/verification/theme.py`, compliance UI | PARTIAL | Backend module exists; tests failing. | Fix tests; verify SkillUp and RTH themes against same block. |
| Evidence graph | `services/project-ai/app/evidence/*`, discovery evidence IDs | PARTIAL | Evidence logger/query/graph exists; discovery evidence IDs exist. | Make evidence durable and bind every gate result to actual candidate hashes and repository snapshot. |
| Certification readiness | `services/project-ai/app/certification/gates.py` | PARTIAL | Certification gates exist but failing tests. | Certification cannot be trusted until backend test suite passes. |
| Final certification by HAA | Governance concept exists | PARTIAL | Approval route exists but not full Gate 2 certification authority flow. | Add Gate 2 endpoint/state that can approve/reject `CERTIFICATION_READY` only. |
| Optional LLM advisory only | No provider integration found | ALIGNED | No LLM provider was added, which matches the agreed architecture. | Keep optional LLM deferred until deterministic workflow is stable. |
| A-M / 15-agent decomposition | `services/project-ai/app/orchestration/agent_registry.py` | CONDITIONAL | 15-agent model exists. Good as implementation decomposition, but should not redefine canonical architecture. | Map agents to canonical engines in docs/UI and prevent "agent swarm" from becoming authority. |
| Frontend-backend integration | `rg` found no fetch/axios calls in Project LLM frontend | MISSING | GUI is not connected to backend service. | Add API client/proxy, workflow IDs, backend-backed state, error states, loading states. |
| Persistence | Backend uses in-memory dictionaries | MISSING | Candidates, workflows, approvals disappear on restart. | Add persistence plan/database only after schema is approved; avoid premature migration if not ready. |

## Correct Interpretation of User Scenario

The user's scenario is aligned with the canonical architecture, with one important wording correction:

Project LLM should not be responsible for inventing the final visual mix-and-match layout. That is the responsibility of the user and External AI during the prototype stage. Project LLM must provide:

- the repository evidence;
- the existing version list;
- the next-version guidance;
- the compliance checklist;
- the External AI prompt;
- candidate package intake;
- compliance audit;
- integration plan;
- tests and verification;
- evidence;
- certification readiness.

Project LLM must ensure the candidate is:

- compliant with Tutorial Composer membership;
- compliant with TutorialDocument/schema expectations;
- compliant with UBRC;
- compatible with ILS runtime;
- compatible with LSNB navigation/learning structure;
- compatible with RSSB rendering/style structure;
- brand-independent;
- theme-compatible for SkillUp and RTH;
- versioned correctly with the user-selected target version;
- visible and usable in Tutorial Composer only after controlled integration.

## Major Risks Found

| Risk | Severity | Evidence | Required Correction |
|---|---:|---|---|
| Frontend claims validation success without backend validation | HIGH | `candidate-upload/page.tsx` hardcoded passed checks | Replace with live backend gate results. |
| Backend certification tests failing | HIGH | `python -m pytest services/project-ai/tests -q`: 55 failed | Fix before trusting certification readiness. |
| Candidate upload is not real browser file upload | HIGH | No `FormData`, `fetch`, or file input integration in Project LLM frontend | Implement upload endpoint and frontend client. |
| Governance approval not connected to execution | HIGH | `execute_placement` reads `_approval_status` on manifest, governance stores approvals separately | Link approval by manifest ID/hash and candidate ID. |
| Placement executor can mutate repo and commit | HIGH | `PlacementExecutor` writes files and runs git operations | Add sandbox/worktree, dry-run, explicit HAA approval, path allowlist. |
| Versioning mismatch | HIGH | `PlacementManifest.blockVersion` hardcoded `1.0.0`; UI target version has `I7` | Use canonical block version ID selected by user. |
| Static/hardcoded GUI state | MEDIUM | `ProjectLlmContext` default state has candidate/validation completed true | Use backend state; default should start clean. |
| Mojibake/encoding issues in UI text | MEDIUM | Several UI strings show `â€¢`, `â†’` | Fix encoding or replace with ASCII-safe UI text. |
| 15-agent wording may imply autonomy | MEDIUM | UI and backend use "autonomous" language | Reword as bounded workflow agents under human governance. |
| In-memory backend state | MEDIUM | `workflows = {}`, `_candidates_store`, `_approvals` | Add durable storage once schema is approved. |

## What Needs To Be Done Next

### P0 - Fix Alignment Before More Features

1. Connect Project LLM frontend to `services/project-ai` through a defined API client or Next.js proxy route.
2. Replace all hardcoded dashboard/candidate/compliance success data with backend-backed workflow state.
3. Make block family/version selection evidence-backed from the discovery snapshot or canonical registry.
4. Change default frontend workflow to a clean initial state, not pre-completed `Introduction I7`.
5. Fix encoding artifacts in Project LLM UI text.
6. Fix Python backend certification tests until `services/project-ai` test suite passes.
7. Make Gate 1 GUI approval a durable backend decision before candidate upload is accepted.
8. Make Gate 2 / HAA certification a separate durable final decision after `CERTIFICATION_READY`.

### P1 - Candidate Intake And Audit

1. Implement real file upload: ZIP and individual TS/TSX/JSON/CSS/MD files.
2. Compute server-side hashes.
3. Extract and inspect package safely.
4. Enforce allowed file extensions and allowed target paths.
5. Reject path traversal, symlinks, binary executables, external network calls, secrets, hardcoded brands, direct DB/auth mutations, and unauthorized runtime changes.
6. Generate a Project LLM-owned manifest, not an External AI-owned manifest.
7. Bind candidate package to user-selected family and version.

### P2 - Compliance Gates

1. Implement explicit gates for UBRC, Composer, TutorialDocument/schema, ILS runtime, LSNB, RSSB, brand independence, theme compatibility, unit tests, browser/runtime, and evidence binding.
2. Ensure each gate returns specific failures, not only generic manifest validation failure.
3. Make every PASS/FAIL/BLOCKED result evidence-backed.
4. Ensure UNKNOWN never becomes PASS.

### P3 - Controlled Integration

1. Add dry-run integration plan.
2. Show exact files to add/modify.
3. Require human implementation approval.
4. Apply changes in isolated worktree or branch only.
5. Refresh repository discovery after integration.
6. Verify Tutorial Composer can display the new version.
7. Verify SkillUp and RTH render the same shared block through their themes.

### P4 - Durable Workflow

1. Replace in-memory workflow/candidate/approval storage with approved persistence.
2. Add audit trail for every state transition.
3. Add run IDs, repository snapshot IDs, candidate hashes, manifest hashes, approval IDs, and evidence IDs.
4. Add frontend status pages that show exact backend state.

## Recommended Next Engineering Order

1. P0.1: Frontend/backend API bridge.
2. P0.2: Fix Python certification test failures.
3. P0.3: Replace static Project LLM GUI state with backend workflow state.
4. P1.1: Real candidate upload and server-side hashing.
5. P1.2: Gate 1 approval enforcement.
6. P2.1: Specific compliance gate results.
7. P3.1: Dry-run integration plan.
8. P3.2: Isolated approved integration.
9. P4.1: Durable persistence.

## Bottom Line

The direction is right, but the current implementation is a mixed state:

- Project LLM architecture: aligned.
- Repository discovery: implemented and passing tests.
- Backend Project AI service: implemented but not passing all tests.
- Frontend Project LLM GUI: visually aligned but mostly static.
- End-to-end user scenario: not yet complete.

The next milestone should not be more screens or more agents. It should be:

```text
Selected block/version
    -> evidence-backed compliance brief
    -> Gate 1 approval
    -> real candidate upload
    -> server-side audit
    -> specific compliance gate results
    -> dry-run integration plan
```

Only after that should Project LLM be allowed to embed the candidate into the project for Tutorial Composer use.
