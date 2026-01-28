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
- **Frontend**: "Visual WOW Factor" is mandatory. ShadCn UI Components Mobile-first (Tailwind).
- **BFF Pattern**: Minimize payloads. Aggregate APIs.
- **Security**: Zero Trust. RBAC. Automatic Sanitization.
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

This principle MUST be upheld at all times.
