# 🚀 ONBOARDING: READ THIS FIRST
> [!IMPORTANT]
> This document is the authoritative entry point for any new ChatGPT or Antigravity session. It defines the project's governance, structure, and workflow. DO NOT proceed without fully internalizing the rules below.

PROJECT BOOTSTRAP PROMPT
(FOR NEW CHATGPT / ANTIGRAVITY SESSION)

You are assisting on an actively governed project using Antigravity agents.
This project follows a strict documentation-first, contract-driven workflow.

Before performing any task, you must fully understand and comply with the
authority, structure, and workflow defined below.

========================================
ABSOLUTE AUTHORITY
========================================

- `.agent/AGENT_CONSTITUTION.md` is the highest authority.
- Documentation defines truth.
- Agents and models execute — they do NOT decide.
- Architecture, UX rules, and behavior MUST NOT be inferred or invented.

========================================
CURRENT DOCUMENTATION STRUCTURE (AUTHORITATIVE)
========================================

docs/
├── ux/                  → Global UX & responsiveness laws
│   └── UX_BASELINE.md
│
├── pages/               → Page contracts (grouped by user journey)
│   ├── auth/            → sign-in, sign-up, onboarding
│   ├── dashboard/       → dashboard
│   ├── exams/           → start-exam, exam-session
│   ├── reports/         → reports
│   └── settings/        → settings
│
├── execution/           → Task governance & audit trail
│   ├── CURRENT_TASK_LOG.md
│   └── TASK_HISTORY.md
│
├── architecture/        → System & runtime truth (read-only)
├── platform/            → CI/CD, environment, deployment
├── security/            → Authentication & security rules
├── domain/              → Domain & product modeling
├── audits/              → Audit reports
├── walkthroughs/        → Permanent historical records
└── sql/                 → Executable database truth (read-only)

========================================
GLOBAL RULES (NON-NEGOTIABLE)
========================================

1. Global UX rules live ONLY in `docs/ux/UX_BASELINE.md`
2. Page-specific behavior lives ONLY in `docs/pages/**`
3. Page contracts are grouped by user journey
4. New `.md` files MUST be placed in a folder whose name semantically matches their purpose
   - If no suitable folder exists, create one
   - `.md` files MUST NOT live at the root of `docs/`
5. Architecture, SQL, and migrations are READ-ONLY unless explicitly approved
6. UI/UX MAY be enhanced for clarity, usability, and responsiveness
7. UI/UX MUST NOT be removed, hidden, or degraded unless explicitly instructed by the user

========================================
WORKFLOW (MANDATORY)
========================================

1. Define or update `.md` contracts FIRST
2. Treat contracts as the sole source of truth
3. Generate Antigravity execution prompts ONLY after contracts exist
4. Never jump directly to code without a governing `.md`
5. All work must be logged:
   - Overwrite `docs/execution/CURRENT_TASK_LOG.md` per task
   - Append to `docs/execution/TASK_HISTORY.md` on completion

========================================
CURRENT PROJECT STATE
========================================

- Documentation structure has been fully reorganized and stabilized
- Global UX baseline is defined and enforced
- Page contracts exist for all major user journeys
- Dashboard has undergone major compliance and UX alignment
- Execution logging and walkthrough history are active
- The project is operating in a contract-first, audit-safe mode

========================================
STOP CONDITIONS (NO EXCEPTIONS)
========================================

You MUST STOP and ASK the user if:
- A required contract is missing or unclear
- A new behavior contradicts an existing `.md`
- A UI element would need to be removed or hidden
- A schema or migration change is required
- A document’s placement or authority is ambiguous

Acknowledge this governance model and current project state
before proposing or executing any new task.
