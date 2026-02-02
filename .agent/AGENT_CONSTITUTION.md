# 📜 AGENT_CONSTITUTION.md (v2.0)
# Repository AI Governance & Execution Constitution

**Scope**: All Antigravity Agents  
**Applies To**: Every model, every execution, every task  
**Priority**: ABSOLUTE  
**Change Policy**: User-only approval  

---

## 1️⃣ PURPOSE & HIERARCHY
This document defines **binding laws** for how AI agents operating in this repository must interpret documentation, organize files, and execute tasks.

### Source-of-Truth Hierarchy
1. **`@docs/**`** → **Absolute Source of Truth**
2. **Executable artifacts** (SQL, migrations) → **Immutable Truth**
3. **`agent/**`** → **Behavioral control only**
4. **Model reasoning** → **Lowest priority**

> **Conflict Rule**: If a conflict exists, higher authority ALWAYS wins. Agent MUST STOP and ASK the user.

---

## 2️⃣ PERMISSION MATRIX (READ vs WRITE)

| Path | Read | Write | Notes |
| :--- | :--- | :--- | :--- |
| **`@docs/**`** | ✅ | ❌ | Read-only unless user says **"update docs"**. |
| **`apps/**`** | ✅ | ⚠️ | Write ONLY within requested scope. |
| **`packages/**`** | ✅ | ⚠️ | Write ONLY for named modules. |
| **`agent/**`** | ✅ | ✅ | Behavior & orchestration only. |
| **SQL / Migrations** | ✅ | ❌ | Immutable unless user says **"modify migration SQL"**. |

---

## 3️⃣ DOCUMENTATION ARCHITECTURE (THE LAW)

### 📂 Folder Intent Map
The `docs/` directory is the **single source of truth**.

| Folder | Intent | Key Files |
| :--- | :--- | :--- |
| **THE LAW** | `docs/architecture/` | `PROJECT_MANIFESTO` (Start Here), `SYSTEM_ARCHITECTURE` |
| **THE LOGIC** | `docs/specs/` | `CORE_PLATFORM_SPEC`, `ADMIN_PLATFORM_SPEC`, `INFRASTRUCTURE_SPEC` |
| **THE UI** | `docs/pages/` | `CORE_APP_JOURNEY`, `AUTH_JOURNEY`, `ADMIN_JOURNEY`, `EXAM_JOURNEY` |
| **THE STATUS** | `docs/execution/` | `CURRENT_STATE_REPORT` (Read me!), `TASK_HISTORY`, `CURRENT_TASK_LOG` |
| **THE RULES** | `docs/ux/` | `UX_BASELINE` |
| **THE INSIGHTS** | `docs/report/` | `SYSTEM_REPORTING_SPEC`, `BEHAVIORAL_RADAR_REPORT`, `NATURE_OF_KNOWLEDGE_REPORT` |
| **THE PAST** | `docs/archive/` | `EXECUTION_LOGS_ARCHIVE.md`, `WALKTHROUGH_ARCHIVE.md`, `AUDIT_REPORT_JAN24.md` |


### 🧭 Reference Guide
- **Onboarding**: `docs/architecture/PROJECT_MANIFESTO.md`
- **Current Status**: `docs/execution/CURRENT_STATE_REPORT.md`
- **Database Logic**: `docs/architecture/SYSTEM_ARCHITECTURE.md`
- **Frontend Logic**: Check `docs/pages/` Journey files.
- **Debugging**: Check `docs/archive/` logs.

### 🚨 Detailed Placement Laws
1. **Specs vs Tasks**:
    - **Specs** (`@docs/specs/`) define *what* the system is.
    - **Tasks/Walkthroughs** (`@docs/execution/` or `@docs/archive/`) define *what we did*.
2. **No Fragmented Logs**: NEVER create `task-log-xyz.md` at root. Append to `TASK_HISTORY` or Specs.
3. **Docs vs Agent**: Architecture docs (`.md`) MUST live in `@docs/`, NEVER in `.agent/`.

---

## 4️⃣ EXECUTION & SAFETY RULES

### 🛑 STOP Conditions
The agent MUST STOP and ASK if:
- A request contradicts `@docs/**`.
- A file location is ambiguous.
- A user implies a "Non-Goal" (e.g., self-healing migrations, automatic schema refactoring).

### 🐛 Engineering Standards (SDE-3)
- **Scalability**: Logic must support millions of users (stateless, pagination).
- **Frontend**: "Visual WOW Factor" is mandatory. ShadCn UI Components Mobile-first (Tailwind). Administrative complex workflows (Seeders/Factories) MUST use **Full-Screen Executive Consoles** (`inset-0`) with typography scale optimized for readability (`text-xl`/`text-lg`). **Governance**: Enforce strict **Zero-Scroll Policy** (overflow-hidden on parent); utilize header-integrated orchestration for status tracking to maximize primary workspace density.
- **BFF Pattern**: Minimize payloads. Aggregate APIs.
- **Security**: Zero Trust. RBAC. Automatic Sanitization.
- **Import Standard**: Every internal module import MUST use the defined **Absolute Path Alias** (`@/`). Relative imports (`../`, `./`) are strictly prohibited for component and hook registers to prevent file-location fragility.
- **Database**: efficient indexing. No `SELECT *` on hot paths.

### 🛡️ Command Execution Protocol (EFFICIENCY)
1. **No Redundancy**: NEVER run separate commands (e.g., `git add`, `git commit`) immediately after a combined one-liner unless the combined command explicitly returned an error.
2. **Shell Syntax**: Use PowerShell-compatible operators (`;`) or separate tool calls. Do NOT use `&&` if it causes execution logic loops.
3. **Atomic Commits**: Ensure every commit has a meaningful, structured message before execution.

---

## 5️⃣ DOCUMENT CHANGE POLICY
Any modification to `@docs/**` files MUST:
1. **Preserve Intent**: Do not remove historical meaning.
2. **Append-Only**: Prefer appending new info over rewriting old info (traceability).
3. **Traceability**: Add change logs if significant.

---

## 6️⃣ THE CYCLE OF TRUTH (GOVERNANCE LOOP)

### 1. Constitution governs → Manifesto
*   `.agent/AGENT_CONSTITUTION.md`
*   `docs/architecture/PROJECT_MANIFESTO.md`

### 2. Manifesto guides → Execution
*   `docs/architecture/SYSTEM_ARCHITECTURE.md`
*   `docs/specs/CORE_PLATFORM_SPEC.md`
*   `docs/specs/ADMIN_PLATFORM_SPEC.md`
*   `docs/specs/INFRASTRUCTURE_SPEC.md`
*   `docs/pages/CORE_APP_JOURNEY.md`
*   `docs/pages/AUTH_JOURNEY.md`
*   `docs/pages/ADMIN_JOURNEY.md`
*   `docs/pages/EXAM_JOURNEY.md`
*   `docs/ux/UX_BASELINE.md`

### 3. Execution is logged in → Brain Log
*   `docs/execution/CURRENT_TASK_LOG.md`
*   `docs/execution/TASK_HISTORY.md`
*   `docs/execution/CURRENT_STATE_REPORT.md`
*   `.agent/BRAIN_LOG_RESTRUCTURE.md`

### 4. Brain Log audits → Docs
*   `docs/archive/EXECUTION_LOGS_ARCHIVE.md`
*   `docs/archive/WALKTHROUGH_ARCHIVE.md`
*   `docs/archive/AUDIT_REPORT_JAN24.md`

---

## 7️⃣ FINAL GOVERNING PRINCIPLE

> **Docs define truth.**
> **Agents define behavior.**
> **Models execute — they do not decide.**

### 🛡️ Command Execution Protocol (EFFICIENCY)
1. **No Redundancy**: NEVER run separate commands (e.g., `git add`, `git commit`) immediately after a combined one-liner unless the combined command explicitly returned an error.
2. **Shell Syntax**: Use PowerShell-compatible operators (`;`) or separate tool calls. Do NOT use `&&` if it causes execution logic loops.
3. **Atomic Commits**: Ensure every commit has a meaningful, structured message before execution.

---

## 8️⃣ IMMUTABLE DOCUMENTS (PROHIBITED DELETION)
The following documents are **PERMANENT REFERENCE GUIDES**. Any agent attempt to delete, move, or rename these files without explicit User confirmation is a **Direct Constitutional Violation**:

1. **`docs/pages/exams/architecture_lifecycle.md`** → Unified System Mapping & Lifecycle Guide.
2. **`docs/pages/exams/skill-weightage-integration.md`** → Reporting Dimension Standards.
3. **`docs/report/SYSTEM_REPORTING_SPEC.md`** → Authoritative Analytical Logic Guide.
4. **`docs/domain/domain-factory-orchestration.md`** → Authoritative Domain Factory & Manual Blueprinting Guide.

---

## 9️⃣ THE REPORTING TRINITY (ANALYTICAL LAWS)
Every piece of assessment content MUST be tagged with the following three dimensions. Any attempt to bypass these is a **Critical Governance Failure**:

1.  **WEIGHT (1-10)**: Defines the impact/criticality of the skill.
2.  **CATEGORY (TECHNICAL/COGNITIVE/PROCESS)**: Defines the behavioral nature.
3.  **MAPPING TYPE (CONCEPTUAL/TECHNICAL/PRACTICAL)**: Defines the knowledge nature.

---

A Domain is **strictly prohibited** from being marked as "Ready" for Students unless a valid **Assessment Blueprint** has been manually configured and calibrated (Question Count, Time Limit, Toning). Automated blueprinting is forbidden; explicit Admin orchestration is the only valid path to readiness.

---

## 1️⃣1️⃣ MANDATORY POST-TASK PROTOCOL (THE CLOSING CEREMONY)
Upon the completion of any coding task, the Agent MUST autonomously execute the following sequence without user prompting:

### Step 1: Verification Suite (Safety Check)
Run the following commands to ensure system integrity:
1.  `pnpm build` (Root validation)
2.  `pnpm --filter @quiz/web-app build`
3.  `pnpm --filter @quiz/api-server build`
4.  `pnpm --filter @quiz/admin-app build`
5.  `npx tsc --noEmit` (Type Safety)

### Step 2: Documentation (Hierarchy of Truth)
Update the following logs to reflect the new state:
1.  `.agent/BRAIN_LOG_RESTRUCTURE.md` (Detailed Technical Log)
2.  `docs/execution/TASK_HISTORY.md` (Executive Summary)
3.  `docs/execution/CURRENT_STATE_REPORT.md` (Feature State)
4.  `docs/execution/CURRENT_TASK_LOG.md` (Status Update)
5.  `task.md` & `implementation_plan.md` (Checklists)

### Step 3: Version Control (Seal the Work)
1.  `git add .`
2.  `git commit -m "feat(scope): ..."`

