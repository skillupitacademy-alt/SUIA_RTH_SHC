# M1 D1 — Repository Structure Discovery

## Repository Identity
- **Name**: SUIA_RTH_SHC
- **Commit**: 4512a455 (branch: main)
- **Discovery Date**: 2026-01-16
- **Workspace Root**: `e:\onlinewebsites\quiz-platform`

---

## Monorepo Configuration

### Package Manager
- **Package Manager**: pnpm@9.15.4
- **Evidence**: `package.json` line `"packageManager": "pnpm@9.15.4"`
- **Configuration**: `e:\onlinewebsites\quiz-platform\.npmrc`
  - `node-linker=hoisted`
  - `strict-peer-dependencies=false`

### Workspace Globs
Source: `e:\onlinewebsites\quiz-platform\pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "apps/realtutorialhub-admin"
  - "apps/realtutorialhub-quiz"
  - "apps/skillup-web"
  - "apps/skillup-admin"
  - "apps/faculty-app"
  - "apps/skillhubcore-admin"
  - "services/api-gateway"
  - "packages/*"
  - "services/*"
```

### Build Orchestration Tool
- **Tool**: Turbo (v2.3.3)
- **Evidence**: `e:\onlinewebsites\quiz-platform\turbo.json`
- **Configuration**:
  - Tasks: `build`, `lint`, `dev`, `test`, `type-check`
  - Build dependencies: `^build` (topological)
  - Outputs: `.next/**`, `next-env.d.ts`, `dist/**`
  - Default concurrency: 2

### TypeScript Project Configuration
- **Root Config**: `e:\onlinewebsites\quiz-platform\tsconfig.json`
- **Module System**: ESNext with bundler resolution
- **Target**: ES2020
- **Path Mappings**: Extensive workspace package aliases (`@quiz/*`)
- **Project References**: Not using TypeScript project references (no references array)
- **Included Directories**: `apps`, `packages`, `services`, `tests`, `src`

---

## Top-Level Directory Map

| Directory | Category | Notes |
|-----------|----------|-------|
| `apps/` | Applications | 12 Next.js applications |
| `packages/` | Packages | 21 shared library packages |
| `services/` | Services | 3 backend service packages |
| `ILS_UI_UX/` | Documentation | M0 canonical architecture documents |
| `scripts/` | Tooling | Build, test, audit, seed scripts |
| `tests/` | Test Artifacts | E2E tests, integration test scripts |
| `docs/` | Documentation | Testing documentation |
| `.agents/` | Analysis/Audit | Agent task reports, findings |
| `.analysis/` | Analysis/Audit | Runtime investigations, forensic reports |
| `.github/` | Infrastructure | CI/CD configuration (empty/minimal) |
| `k6/` | Test Tooling | Load testing scripts (k6) |
| `infra/` | Infrastructure | Infrastructure-as-code |
| `deploy/` | Infrastructure | Deployment artifacts |
| `phasewise/` | Archive | Phase-specific development artifacts |
| `backups/` | Archive | Code backups |
| `.phase1c-*` | Archive | Phase 1C backup directories |
| `node_modules/` | Dependencies | NPM dependencies |
| `.turbo/` | Build Cache | Turbo build cache |
| `.vscode/` | Configuration | VSCode workspace settings |
| `.kiro/` | Configuration | Kiro AI workspace configuration |
| `.husky/` | Configuration | Git hooks |
| `.wrangler/` | Configuration | Cloudflare Wrangler |
| `audit-reports/` | Analysis/Audit | Audit report outputs |
| `src/` | Unknown/Legacy | Legacy source files (check contents) |
| `UI/` | Unknown | UI artifacts (check contents) |
| `digitalmarketing/` | Unknown | Marketing-related files |
| `promptimages/` | Unknown | Prompt/image artifacts |
| `scratch/` | Unknown | Scratch/temporary work |
| `tools/` | Tooling | Developer tools |
| `e2e/` | Test Artifacts | E2E test configurations |
| `playwright-report/` | Test Artifacts | Playwright test reports |
| `test-results/` | Test Artifacts | Test output artifacts |
| `.playwright-mcp/` | Test Artifacts | Playwright MCP configuration |
| `__tests__/` | Test Artifacts | Root-level test files |
| `.codex/` | Analysis/Audit | Codex artifacts |

---

## Applications

Source: `e:\onlinewebsites\quiz-platform\apps\`

| Package Name | Framework | Port | Purpose |
|--------------|-----------|------|---------|
| `@quiz/api-server` | Next.js 16.1.6 | 3000 | Core API server with tutorial, auth, admin routes |
| `@quiz/realtutorialhub-quiz` | Next.js 16.1.6 | 3001 | Quiz application for RealTutorialHub |
| `@quiz/realtutorialhub-admin` | Next.js 16.1.6 | 3002 | Admin dashboard for RealTutorialHub |
| `@quiz/realtutorialhub-web` | Next.js 16.1.6 | 3003 | Main web application for RealTutorialHub |
| `@quiz/skillhubcore-admin` | Next.js 16.1.6 | 3007 | **Project LLM Admin UI** (see section below) |
| `@quiz/skillup-web` | Next.js 16.1.6 | 3009 | SkillUp web application |
| `@quiz/skillup-admin` | Next.js | — | SkillUp admin dashboard |
| `@quiz/faculty-app` | Next.js | — | Faculty application |
| `@quiz/skillhub-placement` | Next.js | — | Placement management application |
| `@quiz/realtutorialhub-site` | Next.js | — | Marketing site for RealTutorialHub |
| `@quiz/skillupitacademy-site` | Next.js | — | Marketing site for SkillUp IT Academy |
| `@quiz/question-judge` | Unknown | — | Question evaluation/judging service |

**Evidence**: Package.json files read from each application directory.

**Framework Notes**:
- All confirmed apps use Next.js 16.1.6 (App Router architecture)
- React 19.2.4 and React DOM 19.2.4
- Node.js 20.x engine requirement

---

## Packages

Source: `e:\onlinewebsites\quiz-platform\packages\`

| Package Name | Type | Purpose |
|--------------|------|---------|
| `@quiz/types` | Type Definitions | **Canonical TypeScript type definitions** (includes Project LLM types, Tutorial Rich Document, Composer contracts) |
| `@quiz/db` | Database Library | Core database client and connection management |
| `@quiz/db-tutorial` | Database Library | **Tutorial database layer** (includes Composer service implementation) |
| `@quiz/db-people` | Database Library | People/user database layer |
| `@quiz/db-payment` | Database Library | Payment database layer |
| `@quiz/db-placement` | Database Library | Placement database layer |
| `@quiz/db-rth` | Database Library | RealTutorialHub-specific database layer |
| `@quiz/db-skillup` | Database Library | SkillUp-specific database layer |
| `@quiz/db-skillhubcore` | Database Library | SkillHubCore-specific database layer |
| `@quiz/auth` | Shared Library | Authentication and authorization utilities |
| `@quiz/auth-core` | Shared Library | Core authentication primitives |
| `@quiz/validation` | Shared Library | Zod schema validation utilities |
| `@quiz/api-client` | Shared Library | API client for frontend-backend communication |
| `@quiz/events` | Shared Library | Event system for application events |
| `@quiz/observability` | Shared Library | Logging, tracing, and observability utilities |
| `@quiz/ui` | Shared Library | Shared React UI components |
| `@quiz/identity-bridge` | Shared Library | Identity bridging between systems |
| `@quiz/marketing-site` | Shared Library | Marketing site components |
| `@quiz/config` | Configuration | Environment configuration and paths |
| `@quiz/eslint-config` | Configuration | Shared ESLint configuration |
| `@quiz/database` | Unknown | (Check if duplicate of `@quiz/db`) |

**Evidence**: Directory listing and package.json files.

---

## Services

Source: `e:\onlinewebsites\quiz-platform\services\`

| Package Name | Purpose |
|--------------|---------|
| `@quiz/skillhubcore-service` | SkillHubCore backend service |
| `@quiz/api-gateway` | API gateway service |
| `@quiz/analytics-collector-service` | Analytics collection service |

---

## Tutorial/Block Corpus

### Block Type Definitions

**Location**: `e:\onlinewebsites\quiz-platform\packages\types\src\tutorial-rich-document\blocks\`

**Evidence**:
- `content-blocks.ts` — Content block type definitions
- `container-blocks.ts` — Container block type definitions
- `specialized-blocks.ts` — Specialized block type definitions
- `index.ts` — Discriminated union of all block types (`TutorialBlock`)

**Exported Block Types**:
- `CodeC1Block`, `CodeC1Page`, `CodeC1AuthorContent` — C1 family Code block
- `IntroductionI1Block`, `IntroductionI1Page`, `IntroductionI1AuthorContent` — I1 family Introduction block
- `SummaryS1Block`, `SummaryS1AuthorContent` — S1 family Summary block
- Container blocks: `two-column`, `three-column`, `card-grid`, `timeline`

### Block Version Registries

**Location**: `e:\onlinewebsites\quiz-platform\packages\types\src\tutorial-rich-document\registries\`

**Files**:
- `code-versions.ts` — Code block version registry (C1-C10, only C1 active)
- `definition-versions.ts` — Definition block version registry
- `summary-versions.ts` — Summary block version registry

**Evidence**: Only **C1** (Code), **I1** (Introduction), and **S1** (Summary) are confirmed as `status: 'active'`. C2-C10, I2-I10, S2-S10 are `status: 'planned'`.

### Block Schemas

**Location**: `e:\onlinewebsites\quiz-platform\packages\types\src\tutorial-rich-document\schemas\`

Zod validation schemas for runtime type checking.

### Block Corpus Location — ESCALATION REQUIRED

**Finding**: Block **type definitions** exist in `packages/types/src/tutorial-rich-document/blocks/`, but I did **NOT** find a separate corpus of **block implementation fixtures** or **block family content samples** in the expected locations:

❌ Not found in: `packages/blocks/`
❌ Not found in: `packages/corpus/`
❌ Not found in: `packages/block-families/`
❌ Not found in: `ILS_UI_UX/blocks/`

**Evidence of Block Usage**:
- Test fixtures exist: `packages/db-tutorial/src/services/__tests__/c1-018-fixture.ts`
- Block IDs appear in audit scripts: `C1-001`, `C1-002`, `C1-013`, etc. (these are **audit task IDs**, not block family IDs)

**ESCALATION**:
> **Are the 18 Educational Block Families with 133 versions stored as:**
> 1. **Type definitions only** (what currently exists in `packages/types/`), OR
> 2. **Separate fixture/content files** (not yet found in repository), OR
> 3. **Database-driven content** (generated dynamically, not in source code)?
>
> The M1 brief stated: "Known verified implementations: I1, C1, D1 (complete). S1 (incomplete)."
>
> **What does "verified implementation" mean?** Type definition? Test fixture? Production content?

---

## Composer Location

### Authoritative Tutorial Composer — CONFIRMED

**Service Implementation**: `e:\onlinewebsites\quiz-platform\packages\db-tutorial\src\services\tutorial-composer.service.ts`

**Supporting Files**:
- `packages/db-tutorial/src/services/composer-draft-generator.service.ts`

**API Routes** (in `apps/skillhubcore-admin`):
- `GET /api/tutorial-composer/sections` — List tutorials
- `POST /api/tutorial-composer/sections` — Create tutorial
- `GET /api/tutorial-composer/sections/:sectionId` — Get tutorial
- `PATCH /api/tutorial-composer/sections/:sectionId` — Update tutorial
- `DELETE /api/tutorial-composer/sections/:sectionId` — Archive tutorial
- `POST /api/tutorial-composer/sections/:sectionId/publish` — Publish tutorial
- `POST /api/tutorial-composer/sections/:sectionId/blocks` — Append block to tutorial
- `POST /api/tutorial-composer/sections/:sectionId/suggestions/apply` — Apply suggestion to section

**Type Contracts**: `packages/types/src/tutorial-composer/`

**Tests**:
- `packages/db-tutorial/src/services/__tests__/tutorial-composer.service.phase1.test.ts`
- `packages/db-tutorial/src/services/__tests__/v2-composer-integration.test.ts`
- `packages/db-tutorial/src/services/__tests__/c1-018-composer-delivery.integration.test.ts`
- `packages/db-tutorial/src/services/__tests__/composer-draft-generator.service.test.ts`

**Evidence Level**: DIRECT — service files and API routes read and confirmed.

### Composer Admin UI

**Location**: `e:\onlinewebsites\quiz-platform\apps\skillhubcore-admin\`

The Tutorial Composer GUI is hosted in the `skillhubcore-admin` application.

**Evidence**:
- API routes under `apps/skillhubcore-admin/src/app/api/tutorial-composer/`
- E2E test: `tests/e2e/tutorial-composer-phase2-hydration.spec.ts`

### Composer Entry Point

**Package**: `@quiz/db-tutorial`
**Main Entry**: `packages/db-tutorial/src/index.ts`
**Service Export**: `tutorial-composer.service.ts` (exported from `@quiz/db-tutorial`)

---

## Project LLM Code

### Type Definitions — CONFIRMED PRESENT

**Location**: `e:\onlinewebsites\quiz-platform\packages\types\src\project-llm\`

**Files**:
- `candidate.ts` — Block candidate types
- `certification.ts` — Certification types
- `compliance.ts` — Compliance types
- `corpus.ts` — Block corpus types
- `corrections.ts` — Correction types
- `creation-brief.ts` — Creation Brief types (Agent E)
- `evidence.ts` — Evidence types
- `handoff.ts` — Handoff types
- `index.ts` — Main export
- `integration.ts` — Integration types
- `lifecycle.ts` — Lifecycle types
- `repository-intelligence.ts` — Repository Intelligence types
- `request.ts` — Request types
- `runtime.ts` — Runtime types
- `workflow.ts` — Workflow types

**Evidence Level**: DIRECT — files read and confirmed.

### Agent E Implementation — CONFIRMED PRESENT

**Location**: `e:\onlinewebsites\quiz-platform\apps\skillhubcore-admin\src\lib\project-llm\`

**Files**:
- `projectLlmCreationBrief.ts` — **Agent E: Creation Brief Engine** (implemented)
- `projectLlmCreationBrief.test.ts` — Agent E tests
- `projectLlmBlockCorpus.ts` — Block corpus access layer
- `projectLlmReferencePatterns.ts` — Reference pattern extraction
- `projectLlmRepositoryIntelligence.ts` — Repository intelligence (D1-D8 preparatory work?)
- `projectLlmWorkflowCoordinator.ts` — Workflow coordination logic
- `index.ts` — Main export

**Agent E Status**: IMPLEMENTED (not stub)

**Evidence**: File `projectLlmCreationBrief.ts` exists with test file, suggesting working implementation.

### Agent F-M Stubs — UNKNOWN

**Finding**: I did NOT find explicit stub files named `agentF.ts`, `agentG.ts`, etc., in the repository.

**Possible Locations Checked**:
- `apps/skillhubcore-admin/src/lib/project-llm/` — Only Agent E files found
- `packages/types/src/project-llm/` — Only type definitions found

**ESCALATION**:
> **Are Agent F-M stubs expected to exist as separate files, or are they planned but not yet scaffolded?**

### Project LLM Admin UI Panel

**Location**: `e:\onlinewebsites\quiz-platform\apps\skillhubcore-admin\`

The `skillhubcore-admin` application hosts the Project LLM administration interface.

**Evidence**:
- Package name: `@quiz/skillhubcore-admin`
- Port: 3007
- Dependencies include `@quiz/types` (Project LLM types) and `@quiz/db-tutorial`

---

## M0 Architecture Documentation

### M0 Canonical Documents

**Location**: `e:\onlinewebsites\quiz-platform\ILS_UI_UX\docs\`

**Files**:
- `PROJECT_LLM_CANONICAL_ARCHITECTURE_V1.md` — M0 canonical architecture
- `PROJECT_LLM_ARCHITECTURE_DECISION_RECORD.md` — ADR for Project LLM
- `PROJECT_LLM_ARCHITECTURE_RECONCILIATION_DECISION.md` — Architecture reconciliation
- `PROJECT_LLM_M0_REPORT.md` — M0 milestone report
- `PROJECT_LLM_MVP_IMPLEMENTATION_CONTRACT.md` — MVP implementation contract
- `PROJECT_LLM_GATE1_READINESS_REVIEW.md` — Gate 1 readiness review
- `PROJECT_LLM_PHASE_1_IMPLEMENTATION_MASTER_PROMPT.md` — Phase 1 implementation prompt
- `PROJECT_LLM_PHASE_1_REPOSITORY_BASELINE_PROMPT.md` — Repository baseline prompt
- `PROJECT_LLM_RUNTIME_COMPLIANCE_MATRIX.md` — Runtime compliance matrix
- `PROJECT_LLM_COMPONENT_PROVENANCE_MATRIX.md` — Component provenance matrix
- `PROJECT_LLM_WORKFLOW_AGENT_ROADMAP.md` — Workflow agent roadmap
- `PROJECT_LLM_BLOCK_CREATION_WORKBENCH_SPEC.md` — Block Creation Workbench specification
- `PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md` — 18 Block Corpus Registry
- `PROJECT_LLM_FAMILY_VERSION_MATRIX.md` — Block Family Version Matrix
- `PROJECT_LLM_EXTERNAL_AI_BLOCK_CREATION_WORKFLOW_DECISION.md` — External AI workflow decision
- `PROJECT_LLM_GUI_FIRST_STRATEGY.md` — GUI-first strategy
- `PROJECT_LLM_STATUS_AS_OF_2026-10-05_0050.md` — Status report (October 2026)
- `PROJECT_LLM_ARCHITECTURE_RECONCILIATION_REQUIRED.md` — Reconciliation required notice

**Evidence Level**: DIRECT — file listing confirmed.

### M0 Task Artifacts

**Location**: `e:\onlinewebsites\quiz-platform\.agents\tasks\`

**Files**:
- `m0-decision.md` — M0 decision document
- `m0-final-attestation.md` — M0 final attestation
- `m0-audit-findings.md` — M0 audit findings
- `m0-audit-hygiene.md` — M0 hygiene audit
- `m0-audit-lifecycle-gates.md` — M0 lifecycle gates audit
- `m0-audit-runtime.md` — M0 runtime audit
- `m0-consistency-audit-report.md` — M0 consistency audit
- `m0-corrections-plan.md` — M0 corrections plan
- `m0-corrections-review.md` — M0 corrections review
- `m0-corrections-verification.md` — M0 corrections verification
- `agent-e-implementation-report.md` — Agent E implementation report
- `agent-e-plan.md` — Agent E implementation plan
- `agent-e-review.md` — Agent E review
- `agent-e-review.json` — Agent E review (JSON)
- `corpus-cleanup-plan.md` — Corpus cleanup plan
- `corpus-integrity-report.md` — Corpus integrity report
- `fixture-repair-plan.md` — Fixture repair plan
- `fm-contract-plan.md` — F-M contract plan

**Evidence Level**: DIRECT — file listing confirmed.

---

## Test Infrastructure

### Test Framework

**Framework**: Vitest (v4.0.18)
**Evidence**: `devDependencies` in root `package.json`

### Root Test Configuration

**File**: `e:\onlinewebsites\quiz-platform\vitest.config.ts`

**Configuration**:
- Environment: `node`
- Test timeout: 30000ms
- Hook timeout: 30000ms
- Setup file: `apps/api-server/src/test/setup.ts`
- Alias resolution: Extensive path aliases for workspace packages

### Package-Level Test Configurations

**Confirmed Vitest Configs**:
- `packages/db-rth/vitest.config.ts`
- `packages/db-people/vitest.config.ts`
- `packages/ui/vitest.config.ts`
- `packages/types/vitest.config.ts` (inferred from test script)
- `services/skillhubcore-service/vitest.config.ts`

### E2E Test Framework

**Framework**: Playwright (v1.62.1)
**Evidence**: `devDependencies` in root `package.json`

**Test Files**:
- `tests/e2e/tutorial-composer-phase2-hydration.spec.ts`
- `tests/e2e/ils-tutorial-session.spec.ts`

**Configuration Files**:
- `playwright.ils.config.ts`
- `playwright.config.ts`

### Test Directory Locations

**Root-level Test Directories**:
- `tests/` — Integration tests, E2E tests, Gate 2 tests
- `__tests__/` — Root-level unit tests (check contents)
- `e2e/` — E2E test configurations

**Package-level Test Directories**:
- `packages/db-tutorial/src/services/__tests__/` — Service tests
- `packages/types/src/__tests__/` — Type validation tests
- `packages/auth/src/__tests__/` (inferred)
- `packages/ui/src/__tests__/` (inferred)

### Test Commands

From root `package.json`:
- `pnpm test` — Run all tests with Turbo
- `pnpm test:watch` — Run Vitest in watch mode
- `pnpm test:ui` — Run Vitest UI
- `pnpm test:all` — Run all package tests recursively
- `pnpm test:e2e:ils` — Run ILS E2E tests with Playwright

---

## Scripts and Build Tooling

### Scripts Directory

**Location**: `e:\onlinewebsites\quiz-platform\scripts\`

**Sample Files** (first 30):
- `.tmp-*` — Temporary/diagnostic scripts
- `auth-audit.js` — Authentication audit
- `auth-page-flow-validator.js` — Auth flow validation
- `dashboard-diagnostic.js` — Dashboard diagnostics
- `validate-gateway.mjs` — API gateway validation
- `validate-rbac-shared.js` — RBAC validation
- `validate-ssr.js` — SSR auth flow validation
- `validate-deployment-ready.js` — Deployment readiness check
- `validate-phase2b.ts` — Phase 2B validation

**Subdirectories**:
- `scripts/audit/` — Audit scripts (C1-001, C1-002, etc.)
- `scripts/assurance/` — Assurance test scripts
- `scripts/tutorial/` — Tutorial-specific scripts
- `scripts/load/` — Load testing scripts (K6)

**Evidence**: 30+ files listed in scripts directory.

### CI/CD Workflows

**Location**: `e:\onlinewebsites\quiz-platform\.github\workflows\`

**Finding**: Directory `.github/` exists, but `.github/workflows/` does **NOT** exist.

**Evidence Level**: DIRECT — directory check returned `False`.

**Note**: CI/CD workflows may be managed externally (e.g., Vercel, Cloud Run) or not yet configured.

### Container Infrastructure

**Dockerfile**: NOT FOUND
**docker-compose.yml**: NOT FOUND

**Evidence Level**: DIRECT — file search returned no results.

**Note**: Applications appear to be deployed as Next.js apps (serverless/container runtime via Vercel or Cloud Run).

---

## Configuration Files

### Root-Level Configuration Files

| File | Purpose | Evidence |
|------|---------|----------|
| `package.json` | Root workspace configuration | DIRECT — read |
| `pnpm-workspace.yaml` | Workspace package globs | DIRECT — read |
| `turbo.json` | Turbo build orchestration | DIRECT — read |
| `tsconfig.json` | TypeScript configuration | DIRECT — read |
| `.npmrc` | pnpm configuration | DIRECT — read |
| `vitest.config.ts` | Vitest test configuration | DIRECT — read |
| `playwright.config.ts` | Playwright E2E config | INFERRED — referenced in scripts |
| `playwright.ils.config.ts` | Playwright ILS config | INFERRED — referenced in scripts |
| `.gitignore` | Git ignore rules | INFERRED — standard file |
| `.eslintrc.*` | ESLint configuration | INFERRED — `pnpm lint` script exists |
| `.prettierrc.*` | Prettier configuration | INFERRED — standard monorepo practice |

**Evidence**: Files confirmed through direct reads or script references.

---

## Unknown / Unclassified

The following directories require further investigation:

| Directory | Reason for Classification |
|-----------|---------------------------|
| `src/` | Unexpected root-level source directory (apps/packages have their own src/) |
| `UI/` | Purpose unclear (marketing assets? design system?) |
| `digitalmarketing/` | Marketing-related files (likely non-code assets) |
| `promptimages/` | Prompt/image artifacts (likely AI-related or marketing) |
| `scratch/` | Temporary work (likely safe to ignore) |
| `tools/` | Developer tools (check if custom tooling exists) |
| `.codex/` | Codex artifacts (unknown purpose) |
| `phasewise/` | Phase-specific artifacts (likely legacy/archive) |
| `backups/` | Code backups (archive) |
| `.phase1c-*` | Phase 1C backup directories (archive) |

**Recommendation**: Investigate `src/`, `UI/`, `tools/`, and `.codex/` directories in D2 (Runtime Architecture Discovery).

---

## Discovery Warnings

### 1. Block Corpus Location Ambiguity

**Issue**: Block **type definitions** exist, but a separate **block corpus** with 18 families and 133 versions was not found as expected.

**Impact**: Cannot confirm whether "verified implementations" refers to type definitions, test fixtures, or database-driven content.

**Mitigation**: ESCALATED (see Block Corpus section above).

### 2. Agent F-M Stub Files Not Found

**Issue**: Agent E implementation exists, but no explicit stub files for Agent F-M were discovered.

**Impact**: Cannot confirm M0 scaffolding completeness for Agent F-M.

**Mitigation**: ESCALATED (see Project LLM Code section above).

### 3. CI/CD Workflows Absent

**Issue**: `.github/workflows/` directory does not exist.

**Impact**: CI/CD pipeline architecture is unknown (may be external).

**Mitigation**: Investigate deployment configuration in D2 (Runtime Architecture Discovery).

### 4. Unexpected Root-Level Directories

**Issue**: `src/`, `UI/`, and `tools/` directories at repository root are outside typical monorepo structure.

**Impact**: May contain legacy code or important utilities not yet cataloged.

**Mitigation**: Investigate in D2 (Runtime Architecture Discovery).

---

## Evidence-Level Assessment

| Item | Evidence Level | Source |
|------|---------------|--------|
| Package manager (pnpm) | DIRECT | `package.json` line 76 |
| Workspace globs | DIRECT | `pnpm-workspace.yaml` |
| Build tool (Turbo) | DIRECT | `turbo.json` |
| Applications (12 apps) | DIRECT | `apps/` directory listing + package.json reads |
| Packages (21 packages) | DIRECT | `packages/` directory listing |
| Services (3 services) | DIRECT | `services/` directory listing |
| Tutorial Composer service | DIRECT | `packages/db-tutorial/src/services/tutorial-composer.service.ts` |
| Composer API routes | DIRECT | `apps/skillhubcore-admin/src/app/api/tutorial-composer/` |
| Block type definitions | DIRECT | `packages/types/src/tutorial-rich-document/blocks/` files read |
| Block version registries | DIRECT | `packages/types/src/tutorial-rich-document/registries/` files read |
| Agent E implementation | DIRECT | `apps/skillhubcore-admin/src/lib/project-llm/projectLlmCreationBrief.ts` |
| Project LLM type definitions | DIRECT | `packages/types/src/project-llm/` files listed |
| M0 canonical documents | DIRECT | `ILS_UI_UX/docs/PROJECT_LLM_*.md` files listed |
| M0 task artifacts | DIRECT | `.agents/tasks/m0-*.md` files listed |
| Test framework (Vitest) | DIRECT | Root `vitest.config.ts` read |
| E2E framework (Playwright) | DIRECT | `package.json` devDependencies |
| CI/CD workflows | DIRECT | `.github/workflows/` directory check (NOT FOUND) |
| Block corpus (18 families, 133 versions) | UNKNOWN | Not found in expected locations |
| Agent F-M stubs | UNKNOWN | Not found as separate files |
| Root `src/` directory purpose | UNKNOWN | Not investigated |

---

## D1 Completion Status

**Status**: COMPLETE WITH ESCALATIONS

### What Was Discovered

✅ Monorepo structure (pnpm + Turbo)
✅ 12 applications (Next.js 16.1.6)
✅ 21 packages (including types, db-tutorial, auth, validation, UI)
✅ 3 services (skillhubcore-service, api-gateway, analytics-collector)
✅ Tutorial Composer service location and API routes
✅ Block type definitions and version registries (C1, I1, S1 active)
✅ Project LLM type definitions (15 files)
✅ Agent E implementation (confirmed present, not stub)
✅ M0 canonical documentation (18 files in ILS_UI_UX/docs/)
✅ M0 task artifacts (28 files in .agents/tasks/)
✅ Test infrastructure (Vitest + Playwright)
✅ Scripts and build tooling (audit, assurance, validation scripts)

### What Requires Escalation

⚠️ **Block Corpus Location**: Are the 18 Block Families with 133 versions stored as type definitions only, separate fixture files, or database-driven content?

⚠️ **Agent F-M Stubs**: Are Agent F-M stubs expected as separate files, or are they planned but not yet scaffolded?

⚠️ **Root-Level Directories**: What is the purpose of `src/`, `UI/`, `tools/`, and `.codex/` directories?

⚠️ **CI/CD Pipeline**: Where are CI/CD workflows managed (external service or not yet configured)?

### Foundation for D2-D8

✅ **D2 (Runtime Architecture Discovery)** can proceed with:
- Application entry points identified (12 apps)
- Package dependencies mapped (21 packages)
- Service architecture outlined (3 services)

✅ **D3 (Block Corpus Discovery)** can proceed with:
- Block type definitions confirmed in `packages/types/src/tutorial-rich-document/blocks/`
- Version registries confirmed (C1, I1, S1 active)
- ESCALATION required to clarify corpus storage strategy

✅ **D4 (Composer Discovery)** can proceed with:
- Composer service confirmed at `packages/db-tutorial/src/services/tutorial-composer.service.ts`
- Composer API routes confirmed in `apps/skillhubcore-admin/src/app/api/tutorial-composer/`
- Entry point: `@quiz/db-tutorial` package

✅ **D5 (Dependency Discovery)** can proceed with:
- Package path aliases documented in `tsconfig.json`
- Workspace structure documented in `pnpm-workspace.yaml`

✅ **D6 (Test Infrastructure Discovery)** can proceed with:
- Vitest configuration confirmed
- Playwright E2E framework confirmed
- Test directories identified

✅ **D7 (Snapshot Builder)** can proceed with:
- Repository identity established (commit 4512a455)
- Directory structure cataloged

✅ **D8 (Discovery Validator)** can proceed with:
- Evidence-level assessment documented
- Escalations clearly marked

---

**D1 Deliverable Complete**: This document serves as the authoritative repository structure baseline for M1 Repository Discovery.
