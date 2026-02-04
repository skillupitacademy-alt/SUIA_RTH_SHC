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



# Engineering Guardrails (Merged from concernforproject)

# AGENT_CONSTITUTION (Project Guardrails)

Purpose
- This constitution defines non-negotiable engineering rules to prevent known risks and scalability failures.
- It is designed to be appended into the main project AGENT_CONSTITUTION.md later.

Authority
- This document overrides conflicting local conventions unless the user explicitly says otherwise.

1) Security and Access Control
1.1 No public migrations
- /api/migrate must never be public in production.
- Allowed only via internal secret header or offline CLI.

1.2 Admin-only factory and governance endpoints
- All factory and admin write routes must enforce RBAC at the server.
- Do not rely on frontend gating for admin privileges.

1.3 Exam ownership
- Every exam read/write must verify ownership (userId must match) or admin role.

1.4 Token storage
- Access tokens must NOT be stored in localStorage or sessionStorage.
- Use httpOnly, secure cookies for access and refresh tokens.

1.5 CSRF rules
- All mutations must require CSRF or equivalent double-submit protection.
- Do not bypass CSRF validation unless the request is internal and authenticated.

2) Data Integrity and Transactions
2.1 Transaction safety
- Any multi-table write must use transactions or compensating actions.
- No partial writes on failures (e.g., exam + exam_questions).

2.2 Idempotency
- All write endpoints must accept idempotency keys.
- Duplicate submissions must be safe and return the same outcome.

3) Scalability Requirements
3.1 Query design
- No ORDER BY RANDOM in production paths.
- Use indexed sampling, pre-shuffled pools, or deterministic selection.

3.2 Database indexes
- Add indexes for hot query paths (exam_id, question_id, topic_id, difficulty, status, created_at).

3.3 Async scoring
- Scoring must be asynchronous for large exams.
- Request path returns accepted status and result polling or notification.

3.4 Distributed rate limiting
- In-memory rate limits are not allowed in production.
- Use Redis or gateway-level rate limits.

3.5 Caching
- Cache hot configs, blueprints, and session state in Redis.
- Do not rely on database for every autosave or heartbeat.

4) Reliability and Observability
4.1 SLOs
- Define SLOs for launch, autosave, submit, scoring, and reporting.

4.2 Telemetry
- Structured logs with requestId, userId, tenantId.
- Traces across gateway, services, and database.

4.3 Alerts
- Alerts for error spikes, latency breaches, queue lag, and DB saturation.

5) Privacy and Compliance
5.1 PII handling
- Minimize PII in logs and analytics.
- Encrypt PII at rest.

5.2 Audit logs
- Every admin action must be audited.
- Audit logs are immutable.

6) Testing and Release
6.1 Load tests
- Load testing is required before production launch for exam flows.

6.2 Release gates
- No release if SLO or security checks fail.

7) Documentation and Change Control
7.1 Contract-first
- Update .md contracts before code changes.
- Keep docs synchronized with behavior.

7.2 No silent assumptions
- Every major assumption (scale targets, data retention, limits) must be documented.

Enforcement
- Any violation must be flagged and fixed before further development.
- If a rule conflicts with a user instruction, request clarification.

