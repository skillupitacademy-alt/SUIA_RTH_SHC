# Project AI GUI Branch Audit Plan

**Branch:** `origin/project-ai-gui`  
**HEAD:** `44d4928d95b2b695761779f87789c1444f7e46dd`  
**Baseline:** `origin/m2-project-ai-canonical-wiring` (commit `2e49b2a9`)  
**Status:** GUI is **188 commits behind** canonical-wiring; contains complete 7-page frontend  
**Workspace:** `e:\onlinewebsites\quiz-platform`

---

## Context

The W0 baseline audit identified that `project-ai-gui` contains a complete 7-page Project LLM frontend implementation, but the branch diverged before the extensive Gate E-2, F, and G certification work that canonical-wiring received. Canonical-wiring added 188 commits including:

- Brand-related schema fields (`uploader_brand`, `requester_brand`)
- Complete RBAC authorization enforcement (Wave 1C/1D)
- PostgreSQL persistence integration (R3)
- Contract admin route protection
- Comprehensive security hardening

**Critical finding:** `git rev-list --left-right --count` shows canonical-wiring is 188 commits ahead and GUI is 0 commits ahead, meaning GUI branched early and never received the later backend updates.

This audit determines:
1. What unique GUI implementation exists
2. What API contracts the GUI expects vs. what canonical-wiring provides
3. Integration feasibility: rebase vs. cherry-pick vs. fresh implementation

---

## Investigation Plan

### Phase 1: Enumerate GUI Implementation

**Objective:** Catalog all 7 pages and their API dependencies.

- [ ] 1. List all project-llm page files in `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/`
      
      **Files:** Use git ls-tree to enumerate pages, components, context, and lib files.
      
      **Commands:**
      ```powershell
      git ls-tree -r --name-only origin/project-ai-gui -- 'apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/' | Out-File -FilePath .agents/tasks/gui-audit-pages.txt -Encoding utf8
      git ls-tree -r --name-only origin/project-ai-gui -- 'apps/skillhubcore-admin/src/components/project-llm/' | Out-File -FilePath .agents/tasks/gui-audit-components.txt -Encoding utf8 -Append
      git ls-tree -r --name-only origin/project-ai-gui -- 'apps/skillhubcore-admin/src/lib/project-llm/' | Out-File -FilePath .agents/tasks/gui-audit-lib.txt -Encoding utf8 -Append
      ```
      
      **Verify:** Confirm 7 pages identified: Dashboard, Registry, Explorer, Matrix, Mix-Match, Spec Review, and one more (candidate upload, workflow details, compliance brief, integration cert, or external handoff).

- [ ] 2. Read the Dashboard page implementation to understand the UI structure.
      
      **Files:** `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx`
      
      **Commands:**
      ```powershell
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx' > .agents/tasks/gui-dashboard-page.tsx
      ```
      
      **Verify:** Identify telemetry pills, workflow status display, snapshot metadata, and navigation structure.

- [ ] 3. Read the workflow coordinator to map API calls the GUI makes.
      
      **Files:** `apps/skillhubcore-admin/src/lib/project-llm/projectLlmWorkflowCoordinator.ts`
      
      **Commands:**
      ```powershell
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/src/lib/project-llm/projectLlmWorkflowCoordinator.ts' > .agents/tasks/gui-workflow-coordinator.ts
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/src/lib/project-llm/index.ts' > .agents/tasks/gui-lib-index.ts
      ```
      
      **Verify:** Extract fetch/axios calls, identify endpoints like `/api/workflows`, `/api/candidates`, `/api/snapshots`, `/api/evidence`.

- [ ] 4. Check if GUI branch has dedicated API client modules.
      
      **Files:** Look for `apps/skillhubcore-admin/src/lib/api/` or `apps/skillhubcore-admin/src/lib/project-llm/api-client.ts`
      
      **Commands:**
      ```powershell
      git ls-tree -r --name-only origin/project-ai-gui -- 'apps/skillhubcore-admin/src/lib/' | Select-String 'api|client|fetch'
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/src/lib/project-llm/projectLlmCreationBrief.ts' | Select-Object -First 150 > .agents/tasks/gui-creation-brief.ts
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/src/lib/project-llm/projectLlmRepositoryIntelligence.ts' | Select-Object -First 150 > .agents/tasks/gui-repo-intelligence.ts
      ```
      
      **Verify:** Determine if GUI uses inline fetch calls or a structured API client layer.

- [ ] 5. Catalog GUI-specific types and interfaces.
      
      **Files:** Check `apps/skillhubcore-admin/src/lib/project-llm/` and `apps/skillhubcore-admin/src/types/`
      
      **Commands:**
      ```powershell
      git ls-tree -r --name-only origin/project-ai-gui -- 'apps/skillhubcore-admin/src/types/' | Select-String 'project|llm|workflow|candidate'
      git ls-tree -r --name-only origin/project-ai-gui -- 'apps/skillhubcore-admin/src/lib/project-llm/' | Select-String 'type|interface'
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/src/context/ProjectLlmContext.tsx' 2>&1 | Select-Object -First 100 > .agents/tasks/gui-context.tsx
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/context/ProjectLlmContext.tsx' 2>&1 | Select-Object -First 100 >> .agents/tasks/gui-context.tsx
      ```
      
      **Verify:** Identify TypeScript interfaces for Workflow, Candidate, Approval, Evidence, Snapshot.

---

### Phase 2: Map Backend API Surface

**Objective:** Document what endpoints canonical-wiring actually provides.

- [ ] 6. List all API route files in canonical-wiring backend.
      
      **Files:** `services/project-ai/app/api/routes/`
      
      **Commands:**
      ```powershell
      git ls-tree -r --name-only origin/m2-project-ai-canonical-wiring -- 'services/project-ai/app/api/routes/' > .agents/tasks/canonical-api-routes.txt
      ```
      
      **Verify:** Confirm routes: workflows.py, candidate.py, creation.py, evidence.py, governance.py, health.py, snapshot.py, tasks.py, agents.py, contract.py.

- [ ] 7. Extract endpoint signatures from workflows.py.
      
      **Files:** `services/project-ai/app/api/routes/workflows.py`
      
      **Commands:**
      ```powershell
      git show origin/m2-project-ai-canonical-wiring:services/project-ai/app/api/routes/workflows.py | Select-String '@router\.|async def ' -Context 0,3 > .agents/tasks/canonical-workflows-endpoints.txt
      ```
      
      **Verify:** Document POST /workflows, GET /workflows/{id}, POST /workflows/{id}/transition, POST /workflows/{id}/approval, GET /workflows/{id}/state.

- [ ] 8. Extract endpoint signatures from candidate.py.
      
      **Files:** `services/project-ai/app/api/routes/candidate.py`
      
      **Commands:**
      ```powershell
      git show origin/m2-project-ai-canonical-wiring:services/project-ai/app/api/routes/candidate.py | Select-String '@router\.|async def ' -Context 0,3 > .agents/tasks/canonical-candidate-endpoints.txt
      ```
      
      **Verify:** Document POST /candidates, GET /candidates/{id}, POST /candidates/{id}/approve, GET /candidates/{id}/manifest.

- [ ] 9. Extract endpoint signatures from snapshot.py, evidence.py, governance.py.
      
      **Files:** Multiple route files
      
      **Commands:**
      ```powershell
      git show origin/m2-project-ai-canonical-wiring:services/project-ai/app/api/routes/snapshot.py | Select-String '@router\.|async def ' -Context 0,3 > .agents/tasks/canonical-other-endpoints.txt
      git show origin/m2-project-ai-canonical-wiring:services/project-ai/app/api/routes/evidence.py | Select-String '@router\.|async def ' -Context 0,3 >> .agents/tasks/canonical-other-endpoints.txt
      git show origin/m2-project-ai-canonical-wiring:services/project-ai/app/api/routes/governance.py | Select-String '@router\.|async def ' -Context 0,3 >> .agents/tasks/canonical-other-endpoints.txt
      ```
      
      **Verify:** Identify snapshot creation, evidence binding, governance state queries.

- [ ] 10. Read API schema definitions to understand request/response shapes.
      
      **Files:** `services/project-ai/app/api/schemas/`
      
      **Commands:**
      ```powershell
      git ls-tree -r --name-only origin/m2-project-ai-canonical-wiring -- 'services/project-ai/app/api/schemas/' > .agents/tasks/canonical-schemas.txt
      git show origin/m2-project-ai-canonical-wiring:services/project-ai/app/api/schemas/workflow.py | Select-Object -First 200 > .agents/tasks/canonical-workflow-schema.py
      git show origin/m2-project-ai-canonical-wiring:services/project-ai/app/api/schemas/models.py | Select-Object -First 200 > .agents/tasks/canonical-models-schema.py
      ```
      
      **Verify:** Identify required fields: workflow_id, state, brand (if tenant-scoped), requester_identity, uploader_identity.

---

### Phase 3: Contract Mismatch Analysis

**Objective:** Identify missing endpoints, payload differences, and authentication changes.

- [ ] 11. Compare GUI API calls vs. canonical-wiring endpoints.
      
      **Files:** Output from steps 3-4 vs. steps 6-9
      
      **Commands:**
      ```powershell
      # Manual comparison step - create a markdown table
      # GUI expects: [endpoint list from workflow coordinator]
      # Canonical provides: [endpoint list from route files]
      # Missing in canonical: [list]
      # Missing in GUI: [list]
      # Schema changes: [list of field additions/removals]
      
      echo "# API Contract Comparison" > .agents/tasks/gui-api-contract-gap-analysis.md
      echo "" >> .agents/tasks/gui-api-contract-gap-analysis.md
      echo "## GUI Expected Endpoints" >> .agents/tasks/gui-api-contract-gap-analysis.md
      echo "(From projectLlmWorkflowCoordinator.ts and lib files)" >> .agents/tasks/gui-api-contract-gap-analysis.md
      echo "" >> .agents/tasks/gui-api-contract-gap-analysis.md
      echo "## Canonical Provided Endpoints" >> .agents/tasks/gui-api-contract-gap-analysis.md
      echo "(From services/project-ai/app/api/routes/)" >> .agents/tasks/gui-api-contract-gap-analysis.md
      echo "" >> .agents/tasks/gui-api-contract-gap-analysis.md
      echo "## Gap Analysis" >> .agents/tasks/gui-api-contract-gap-analysis.md
      echo "### Endpoints GUI calls that canonical doesn't provide:" >> .agents/tasks/gui-api-contract-gap-analysis.md
      echo "### Endpoints canonical provides that GUI doesn't use:" >> .agents/tasks/gui-api-contract-gap-analysis.md
      echo "### Schema field mismatches:" >> .agents/tasks/gui-api-contract-gap-analysis.md
      ```
      
      **Verify:** Produce a table showing: Endpoint | GUI expects | Canonical provides | Status (✅ Match / ⚠️ Schema diff / ❌ Missing).

- [ ] 12. Check authentication/authorization differences.
      
      **Files:** Route decorators and auth dependencies
      
      **Commands:**
      ```powershell
      # Check which routes require contract_admin in canonical-wiring
      git show origin/m2-project-ai-canonical-wiring:services/project-ai/app/api/routes/workflows.py | Select-String 'require_contract_admin|get_current_user' -Context 1,0 > .agents/tasks/canonical-auth-requirements.txt
      git show origin/m2-project-ai-canonical-wiring:services/project-ai/app/api/routes/candidate.py | Select-String 'require_contract_admin|get_current_user' -Context 1,0 >> .agents/tasks/canonical-auth-requirements.txt
      
      # Check what auth the GUI sends
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/src/lib/auth-helpers.ts' 2>&1 | Select-Object -First 100 > .agents/tasks/gui-auth-helpers.ts
      ```
      
      **Verify:** Identify which endpoints require `contract_admin` role vs. any authenticated user. Check if GUI has SHC-admin authentication context (JWT with tenant + role).

- [ ] 13. Identify brand/tenant field additions in canonical-wiring that GUI doesn't know about.
      
      **Files:** ORM models in canonical-wiring
      
      **Commands:**
      ```powershell
      git show origin/m2-project-ai-canonical-wiring:services/project-ai/app/persistence/models.py | Select-String 'uploader_brand|requester_brand|brand' -Context 2,2 > .agents/tasks/canonical-brand-fields.txt
      
      # Check if GUI branch has these fields
      git show origin/project-ai-gui:services/project-ai/app/persistence/models.py 2>&1 | Select-String 'uploader_brand|requester_brand|brand' -Context 2,2 > .agents/tasks/gui-brand-fields.txt
      ```
      
      **Verify:** Confirm GUI branch does NOT have `uploader_brand` in CandidateModel or `requester_brand` in WorkflowModel (as noted in W0 audit for canonical-wiring schema fix).

---

### Phase 4: Shared Package Integration

**Objective:** Check if GUI and canonical-wiring share types or if they diverged.

- [ ] 14. Check for shared TypeScript types in packages/.
      
      **Files:** `packages/types/`, `packages/project-ai-types/` (if exists), `packages/api-client/`
      
      **Commands:**
      ```powershell
      git ls-tree -r --name-only origin/project-ai-gui -- 'packages/' | Select-String 'project-ai|project-llm|types' > .agents/tasks/gui-packages.txt
      git ls-tree -r --name-only origin/m2-project-ai-canonical-wiring -- 'packages/' | Select-String 'project-ai|project-llm|types' > .agents/tasks/canonical-packages.txt
      
      # Compare if same packages exist
      Compare-Object -ReferenceObject (Get-Content .agents/tasks/gui-packages.txt) -DifferenceObject (Get-Content .agents/tasks/canonical-packages.txt) > .agents/tasks/package-diff.txt
      ```
      
      **Verify:** Determine if both branches use `@quiz/types/project-llm` or if types are duplicated in frontend and backend.

- [ ] 15. Check for type duplication between frontend and backend.
      
      **Files:** Compare TypeScript interfaces vs. Pydantic schemas
      
      **Commands:**
      ```powershell
      # Look for TypeScript type definitions in GUI frontend
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/src/lib/project-llm/index.ts' 2>&1 > .agents/tasks/gui-frontend-types.ts
      
      # Look for Pydantic schemas in GUI backend (if it has project-ai service changes)
      git diff --name-status origin/m2-project-ai-canonical-wiring...origin/project-ai-gui -- 'services/project-ai/app/api/schemas/' > .agents/tasks/gui-backend-schema-changes.txt
      ```
      
      **Verify:** Identify if WorkflowState, CandidatePackage, ApprovalRequest types are duplicated across frontend/backend or shared via packages.

- [ ] 16. Check package.json dependencies for conflicting versions.
      
      **Files:** `apps/skillhubcore-admin/package.json`, root `package.json`
      
      **Commands:**
      ```powershell
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/package.json' > .agents/tasks/gui-skillhubcore-package.json
      git show 'origin/m2-project-ai-canonical-wiring:apps/skillhubcore-admin/package.json' > .agents/tasks/canonical-skillhubcore-package.json
      
      # Compare dependency versions
      git diff --no-index .agents/tasks/gui-skillhubcore-package.json .agents/tasks/canonical-skillhubcore-package.json > .agents/tasks/skillhubcore-package-diff.txt
      ```
      
      **Verify:** Check for Next.js, React, Radix UI, lucide-react version differences that could cause build conflicts.

---

### Phase 5: Test Coverage Assessment

**Objective:** Understand what tests GUI branch has vs. canonical-wiring.

- [ ] 17. Enumerate frontend tests in GUI branch.
      
      **Files:** `apps/skillhubcore-admin/__tests__/`, `apps/skillhubcore-admin/src/**/*.test.ts`
      
      **Commands:**
      ```powershell
      git ls-tree -r --name-only origin/project-ai-gui -- 'apps/skillhubcore-admin/' | Select-String 'test\.ts$|test\.tsx$|spec\.ts$|spec\.tsx$' > .agents/tasks/gui-frontend-tests.txt
      
      # Count tests related to project-llm
      git ls-tree -r --name-only origin/project-ai-gui -- 'apps/skillhubcore-admin/' | Select-String 'test\.ts$|test\.tsx$' | Select-String 'project|llm|workflow' > .agents/tasks/gui-project-llm-tests.txt
      ```
      
      **Verify:** Identify if GUI has unit tests for workflow coordinator, creation brief, repository intelligence modules.

- [ ] 18. Check for integration or E2E tests for GUI pages.
      
      **Files:** `tests/e2e/`, `apps/skillhubcore-admin/playwright/` (if exists)
      
      **Commands:**
      ```powershell
      git ls-tree -r --name-only origin/project-ai-gui -- 'tests/e2e/' | Select-String 'project|llm|gui' > .agents/tasks/gui-e2e-tests.txt
      git ls-tree -r --name-only origin/project-ai-gui -- 'apps/skillhubcore-admin/' | Select-String 'playwright|e2e' > .agents/tasks/gui-playwright-tests.txt
      ```
      
      **Verify:** Determine if GUI has Playwright tests for page rendering, workflow creation, candidate upload flows.

- [ ] 19. Compare backend test coverage: GUI branch vs. canonical-wiring.
      
      **Files:** `services/project-ai/tests/`
      
      **Commands:**
      ```powershell
      # Count test files in GUI branch
      git ls-tree -r --name-only origin/project-ai-gui -- 'services/project-ai/tests/' | Measure-Object -Line > .agents/tasks/gui-backend-test-count.txt
      
      # Count test files in canonical-wiring
      git ls-tree -r --name-only origin/m2-project-ai-canonical-wiring -- 'services/project-ai/tests/' | Measure-Object -Line > .agents/tasks/canonical-backend-test-count.txt
      
      # Find tests unique to canonical-wiring (RBAC, authorization, placement tests)
      git diff --name-status origin/project-ai-gui...origin/m2-project-ai-canonical-wiring -- 'services/project-ai/tests/' > .agents/tasks/backend-test-additions.txt
      ```
      
      **Verify:** Canonical-wiring has ~30 test files including comprehensive RBAC, authorization, Gate C/E/F tests. GUI branch likely has fewer (pre-Gate work).

---

### Phase 6: Build Feasibility Check

**Objective:** Determine if GUI branch can build cleanly (no TypeScript errors, no import breaks).

- [ ] 20. Check TypeScript compilation config.
      
      **Files:** `apps/skillhubcore-admin/tsconfig.json`, root `tsconfig.json`
      
      **Commands:**
      ```powershell
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/tsconfig.json' > .agents/tasks/gui-tsconfig.json
      git show 'origin/m2-project-ai-canonical-wiring:apps/skillhubcore-admin/tsconfig.json' > .agents/tasks/canonical-tsconfig.json
      
      git diff --no-index .agents/tasks/gui-tsconfig.json .agents/tasks/canonical-tsconfig.json > .agents/tasks/tsconfig-diff.txt
      ```
      
      **Verify:** Check for path aliases, strict mode differences, module resolution changes.

- [ ] 21. Identify import statements in GUI pages to detect missing modules.
      
      **Files:** All GUI page .tsx files
      
      **Commands:**
      ```powershell
      # Extract imports from Dashboard page
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx' | Select-String "^import " | Select-Object -First 50 > .agents/tasks/gui-dashboard-imports.txt
      
      # Check if lucide-react icons are used (canonical uses lucide-react 0.563.0)
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx' | Select-String 'lucide-react' > .agents/tasks/gui-icon-imports.txt
      ```
      
      **Verify:** Confirm imports resolve to existing packages: `@quiz/types`, `lucide-react`, `next/link`, Radix UI components.

- [ ] 22. Check if GUI branch modifies Next.js config that could conflict.
      
      **Files:** `apps/skillhubcore-admin/next.config.js` or `next.config.mjs`
      
      **Commands:**
      ```powershell
      git diff origin/m2-project-ai-canonical-wiring...origin/project-ai-gui -- 'apps/skillhubcore-admin/next.config.*' > .agents/tasks/next-config-diff.txt
      ```
      
      **Verify:** Identify webpack customizations, API rewrites, environment variable references that could break build.

- [ ] 23. Simulate a type-check (DO NOT BUILD, READ-ONLY AUDIT).
      
      **Files:** N/A (command simulation only)
      
      **Commands:**
      ```powershell
      # DO NOT RUN - this is the command a coder would use later:
      # git checkout origin/project-ai-gui
      # pnpm --filter @quiz/skillhubcore-admin type-check
      
      # Instead, document the command and expected issues:
      echo "Type-check command: pnpm --filter @quiz/skillhubcore-admin type-check" > .agents/tasks/gui-build-simulation.md
      echo "" >> .agents/tasks/gui-build-simulation.md
      echo "Expected issues based on branch analysis:" >> .agents/tasks/gui-build-simulation.md
      echo "- Missing @quiz/types/project-llm exports (if not shared)" >> .agents/tasks/gui-build-simulation.md
      echo "- Potential uploader_brand field missing in CandidatePackage type" >> .agents/tasks/gui-build-simulation.md
      echo "- API schema mismatches if types hardcoded" >> .agents/tasks/gui-build-simulation.md
      ```
      
      **Verify:** Produce a risk assessment: HIGH (many type errors expected), MEDIUM (minor fixes needed), LOW (likely builds cleanly).

---

### Phase 7: Integration Strategy Assessment

**Objective:** Recommend rebase vs. cherry-pick vs. fresh implementation.

- [ ] 24. Quantify the rebase complexity.
      
      **Files:** N/A (git analysis)
      
      **Commands:**
      ```powershell
      # Count divergent commits
      echo "Canonical-wiring commits ahead of GUI: 188" > .agents/tasks/gui-integration-strategy.md
      echo "GUI commits ahead of canonical-wiring: 0" >> .agents/tasks/gui-integration-strategy.md
      echo "" >> .agents/tasks/gui-integration-strategy.md
      
      # Identify conflicting files
      git diff --name-status origin/project-ai-gui...origin/m2-project-ai-canonical-wiring | Select-String '^M' | Measure-Object -Line >> .agents/tasks/gui-integration-strategy.md
      
      # Files modified by both branches (potential conflicts)
      git diff --name-only origin/main...origin/project-ai-gui > .agents/tasks/gui-changed-files.txt
      git diff --name-only origin/main...origin/m2-project-ai-canonical-wiring > .agents/tasks/canonical-changed-files.txt
      
      # Find intersection
      Compare-Object -ReferenceObject (Get-Content .agents/tasks/gui-changed-files.txt) -DifferenceObject (Get-Content .agents/tasks/canonical-changed-files.txt) -IncludeEqual -ExcludeDifferent | Select-Object -ExpandProperty InputObject > .agents/tasks/gui-conflict-candidates.txt
      ```
      
      **Verify:** Estimate rebase conflicts: if > 50 files overlap, rebase is HIGH RISK. If < 10 files, rebase is FEASIBLE.

- [ ] 25. Assess cherry-pick viability: identify self-contained GUI commits.
      
      **Files:** N/A (git log analysis)
      
      **Commands:**
      ```powershell
      # Get GUI-only commits (those not in canonical-wiring)
      git log --oneline --no-merges origin/main..origin/project-ai-gui | Select-Object -First 68 > .agents/tasks/gui-unique-commits.txt
      
      # Filter for GUI-specific commits (frontend changes only)
      git log --oneline --no-merges origin/main..origin/project-ai-gui -- 'apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/' 'apps/skillhubcore-admin/src/components/project-llm/' 'apps/skillhubcore-admin/src/lib/project-llm/' > .agents/tasks/gui-frontend-only-commits.txt
      ```
      
      **Verify:** Identify commits that ONLY touch frontend files (no backend changes). These are cherry-pick candidates.

- [ ] 26. Estimate fresh implementation effort.
      
      **Files:** GUI page .tsx files
      
      **Commands:**
      ```powershell
      # Count lines of code in GUI pages
      git show 'origin/project-ai-gui:apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx' | Measure-Object -Line > .agents/tasks/gui-dashboard-loc.txt
      
      # Sum total LOC for all 7 pages (rough estimate)
      $pages = @(
        'apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx',
        'apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/registry/page.tsx',
        'apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/explorer/page.tsx',
        'apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/matrix/page.tsx',
        'apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/mix-match/page.tsx',
        'apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/specification-review/page.tsx',
        'apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/candidate-upload/page.tsx'
      )
      
      $totalLines = 0
      foreach ($page in $pages) {
        $lines = (git show "origin/project-ai-gui:$page" 2>$null | Measure-Object -Line).Lines
        if ($lines) { $totalLines += $lines }
      }
      
      echo "Total LOC in 7 GUI pages: $totalLines" > .agents/tasks/gui-total-loc.txt
      echo "" >> .agents/tasks/gui-total-loc.txt
      echo "Fresh implementation effort:" >> .agents/tasks/gui-total-loc.txt
      echo "- If < 2000 LOC: LOW effort (1-2 days)" >> .agents/tasks/gui-total-loc.txt
      echo "- If 2000-5000 LOC: MEDIUM effort (3-5 days)" >> .agents/tasks/gui-total-loc.txt
      echo "- If > 5000 LOC: HIGH effort (1-2 weeks)" >> .agents/tasks/gui-total-loc.txt
      ```
      
      **Verify:** Produce effort estimate comparing rebase time vs. fresh implementation time.

---

## Verification

After completing all 26 steps, produce a final summary report: `e:\onlinewebsites\quiz-platform\.agents\tasks\gui-audit-summary.md` containing:

1. **7-Page GUI Inventory:** List of pages with brief description
2. **API Contract Matrix:** Table showing endpoint alignment
3. **Gap Analysis:** Missing endpoints, schema mismatches, auth changes
4. **Type System Assessment:** Shared vs. duplicated types
5. **Test Coverage:** Frontend tests, backend tests, E2E tests
6. **Build Feasibility:** Risk level (HIGH/MEDIUM/LOW) for clean build
7. **Integration Recommendation:** 
   - **Option A:** Rebase GUI onto canonical-wiring (risk level, conflict estimate)
   - **Option B:** Cherry-pick frontend-only commits (list of commits, feasibility)
   - **Option C:** Fresh implementation using GUI as reference (effort estimate, pros/cons)
8. **Recommended Action:** Final verdict with rationale

**Success criteria:**
- All 26 investigation steps completed with evidence files in `.agents/tasks/`
- Summary report clearly states whether to rebase, cherry-pick, or reimplement
- No modifications made to any branch (READ-ONLY audit verified)

---

## Output Artifacts

All investigation outputs saved to `e:\onlinewebsites\quiz-platform\.agents\tasks\`:

- `gui-audit-pages.txt` - Enumeration of all GUI pages
- `gui-dashboard-page.tsx` - Dashboard implementation
- `gui-workflow-coordinator.ts` - Workflow orchestration logic
- `gui-lib-index.ts` - GUI library exports
- `gui-creation-brief.ts`, `gui-repo-intelligence.ts` - Supporting modules
- `gui-context.tsx` - React context provider
- `canonical-api-routes.txt` - Backend route inventory
- `canonical-workflows-endpoints.txt` - Workflow API signatures
- `canonical-candidate-endpoints.txt` - Candidate API signatures
- `canonical-other-endpoints.txt` - Snapshot, evidence, governance endpoints
- `canonical-schemas.txt` - Schema file list
- `canonical-workflow-schema.py`, `canonical-models-schema.py` - Pydantic schemas
- `gui-api-contract-gap-analysis.md` - **KEY OUTPUT:** Endpoint comparison matrix
- `canonical-auth-requirements.txt` - RBAC/auth enforcement rules
- `gui-auth-helpers.ts` - GUI authentication utilities
- `canonical-brand-fields.txt`, `gui-brand-fields.txt` - Tenant field analysis
- `gui-packages.txt`, `canonical-packages.txt`, `package-diff.txt` - Shared package comparison
- `gui-frontend-types.ts`, `gui-backend-schema-changes.txt` - Type duplication check
- `gui-skillhubcore-package.json`, `canonical-skillhubcore-package.json`, `skillhubcore-package-diff.txt` - Dependency comparison
- `gui-frontend-tests.txt`, `gui-project-llm-tests.txt` - Frontend test inventory
- `gui-e2e-tests.txt`, `gui-playwright-tests.txt` - E2E test check
- `gui-backend-test-count.txt`, `canonical-backend-test-count.txt`, `backend-test-additions.txt` - Backend test comparison
- `gui-tsconfig.json`, `canonical-tsconfig.json`, `tsconfig-diff.txt` - TypeScript config
- `gui-dashboard-imports.txt`, `gui-icon-imports.txt` - Import analysis
- `next-config-diff.txt` - Next.js config changes
- `gui-build-simulation.md` - Build feasibility assessment
- `gui-integration-strategy.md` - **KEY OUTPUT:** Integration recommendation
- `gui-unique-commits.txt`, `gui-frontend-only-commits.txt` - Cherry-pick candidates
- `gui-changed-files.txt`, `canonical-changed-files.txt`, `gui-conflict-candidates.txt` - Rebase conflict analysis
- `gui-dashboard-loc.txt`, `gui-total-loc.txt` - Fresh implementation effort estimate
- `gui-audit-summary.md` - **FINAL DELIVERABLE:** Executive summary with recommendation

---

## Notes

- This is a **READ-ONLY** audit. No checkouts, no builds, no commits, no pushes.
- All git operations use `git show origin/<branch>:<path>` to read historical files without touching working tree.
- Focus on producing actionable intelligence for the integration decision.
- The W0 audit already confirmed GUI is 68 commits ahead of main but 188 commits behind canonical-wiring.
- Canonical-wiring is the merge target; GUI must integrate with it, not the other way around.
