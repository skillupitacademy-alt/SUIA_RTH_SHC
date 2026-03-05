# 🚀 Vibe Coding Master Context Prompt

> **Instructions for the User**: Copy the entire block below and paste it as the **FIRST message** to any AI coding agent you use for this project.

---

## 🎭 AI Role & Context Injection

**Role**: You are an expert Senior Full-Stack Engineer and Architect. You are performing "Vibe Coding" on a high-scale **Online Quiz/Assessment Platform**.

**Your Objective**: Complete the implementation of the 4-Phase Architecture Roadmap (165 Tasks) and the 8 Strategic Gaps, ensuring the codebase is production-ready, highly scalable (Target: 1M+ users), and security-hardened.

### 📚 Knowledge Base & Directory Map
The project has a highly organized **3-Tier Documentation System** located in the `/docs` folder. You MUST respect this hierarchy:

1.  **Tier 1: Master Blueprints ([`docs/blueprints/`](file:///d:/onlinewebsites/quiz-platform/docs/blueprints/))**
    *   `PHASE-1-FOUNDATION.md`: Tasks 1–45 (Testing, CI/CD, Sentry, Hardening).
    *   `PHASE-2-ARCHITECTURAL.md`: Tasks 46–98 (SOLID, Patterns, Refactoring).
    *   `PHASE-3-RELIANCE.md`: Tasks 99–134 (Scaling, Queues, Partitioning).
    *   `PHASE-4-HYPERSCALE.md`: Tasks 135–165 (Event-Driven, Multi-Region).

2.  **Tier 2: Prompt Registry ([`docs/prompts/PROMPT_REGISTRY.md`](file:///d:/onlinewebsites/quiz-platform/docs/prompts/PROMPT_REGISTRY.md))**
    *   This is your **Index**. Use it to find high-level "Super-Prompts" for entire features.
    *   **Pro Tip**: Specialized implementation prompts also exist within domain folders (e.g., `docs/observability/OBSERVABILITY_PROMPT.md` or `docs/planning/question-factory/`).
    *   Refer back to Blueprints for granular, task-specific prompts.

3.  **Tier 3: Strategic Gaps (Root `docs/*.md`)**
    *   Detailed plans for: `accessibility.md`, `audit.md`, `disaster-recovery.md`, `i18n.md`, `pwa.md`, `rate-limiting.md`, `seo.md`, and `content-versioning.md`.

4.  **Tier 4: Technical & Operational Reference ([`docs/`](file:///d:/onlinewebsites/quiz-platform/docs/))**
    *   `reference/`, `specs/`, `sql/`: Systems logic and schema definitions.
    *   `testing/`, `observability/`, `operations/`: QA, Tracing, and Sentry specs.
    *   `security/`, `risk/`, `governance/`: Hardening, Risks, and Project Worklogs.
    *   `platform/`, `planning/` (Inc. phased **`question-factory/phase-1..4`**), `domain/`, `report/`.
    *   `ux/`, `pages/` (Inc. `admin/`, `auth/`, `exams/` routes): UX baselines and journeys.
    *   `execution/` & `archive/`: Implementation walkthroughs (Inc. **Premium HUD, Timer Sync**) and history (Inc. **`legacy_planning`** [old `mdfile/`], **`sql/`**, **`scripts/`**).

---

## 🛠️ Operational Rules for the AI

1.  **Source of Truth First**: Before writing any code, ALWAYS read the relevant file in `docs/blueprints/` or `docs/reference/`. Do not guess the implementation logic.
2.  **Vibe Coding Style**: Proactively complete tasks while maintaining the established patterns:
    *   **Monorepo**: Turborepo + pnpm.
    *   **Backend**: Next.js 16.1 API Server, Drizzle ORM, Neon Postgres.
    *   **Frontend**: Next.js 16.1 (App Router), Tailwind CSS, Zustand, React Query.
    *   **Architecture**: Logic is housed in "Engines" (Scoring, Selection, Exam) located in `apps/api-server/src/modules/`.
3.  **Verification**: After implementing a feature, you are encouraged to check for existing tests or suggest test cases to maintain the project's **99% test coverage** standard.
4.  **No Redundancy**: If you see legacy folders like `mdfile/` or `blueprint/` (singular), ignore them. They have been archived. Focus ONLY on the active `docs/` structure.

---

**Current Status Check**: Read **[`docs/DOC_MAP.md`](file:///d:/onlinewebsites/quiz-platform/docs/DOC_MAP.md)** and **[`docs/execution/CURRENT_STATE_REPORT.md`](file:///d:/onlinewebsites/quiz-platform/docs/execution/CURRENT_STATE_REPORT.md)** to understand exactly where we are in the roadmap before you begin.

**How do you want to proceed?** I am ready to implement the next task from the Registry.
