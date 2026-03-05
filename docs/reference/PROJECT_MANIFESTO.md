# 📜 Project Manifesto & Instructions

> [!IMPORTANT]
> This document is the **authoritative entry point** for any new ChatGPT or Antigravity session. It defines the project's governance, structure, instructions, and workflow. DO NOT proceed without fully internalizing the rules below.

---

## 1. Project-Specific Instructions
*Source: PROJECT_INSTRUCTIONS.md*

### Documentation Governance & Placement

#### Global Documentation Placement Rule (MANDATORY)
- Every new `.md` file MUST be placed inside a folder whose name semantically matches its purpose.
- If no matching folder exists, the agent MUST create a new folder with a meaningful name.
- `.md` files MUST NOT be placed at the root of `docs/`.
- Page-specific contracts MUST always live under `docs/pages/<journey>/`.
- Global rules MUST live in a shared domain folder (e.g., `ux/`, `architecture/`, `platform/`).

**Violation of this rule requires the agent to STOP and ASK the user.**

#### Folder Intent Guide:
- **`docs/ux/`**: Global UX rules and baselines (e.g., `UX_BASELINE.md`).
- **`docs/pages/`**: Page-specific contracts grouped by user journey.
- **`docs/execution/`**: Task logs, history, and status mapping.
- **`docs/architecture/`**: System design, specs, and project instructions.
- **`docs/specs/`**: Technical Specifications (Consolidated).
- **`docs/platform/`**: CI/CD, environment config, and troubleshooting.
- **`docs/security/`**: Auth protocols and security hardening data.
- **`docs/domain/`**: Product modeling and business logic specs.
- **`docs/walkthroughs/`**: Feature demonstrations and verification logs.

- **`docs/archive/`**: Historical logs.
- **`docs/sql/`**: SQL migration scripts and schemas.

### ⚠️ CRITICAL: Git Push Policy

**DO NOT push to GitHub automatically during local development/testing!**

#### Rules:
1. **Local changes** should be committed locally but **NOT pushed** to GitHub
2. **Only push to GitHub** when explicitly instructed by the user
3. **Reason**: Every GitHub push triggers Vercel auto-deployment, which counts against the daily deployment limit (100/day on free tier)

#### Workflow:

**✅ Allowed (Local Testing):**
```bash
# Make changes
git add .
git commit -m "fix: some change"
# STOP HERE - Do not push!
```

**❌ Not Allowed (Unless User Requests):**
```bash
git push origin main  # Only when user explicitly asks!
```

**✅ When User Says "Deploy" or "Push to GitHub":**
```bash
git push origin main  # Now it's okay
```

### Environment Detection
**See [INFRASTRUCTURE_SPEC.md](../specs/INFRASTRUCTURE_SPEC.md#31-environment-configuration)** for automatic Vercel/Production detection rules.


### Database
**See [SYSTEM_ARCHITECTURE.md](../architecture/SYSTEM_ARCHITECTURE.md#2-database-entity-relationship-diagram)** for connection details and schema.
- **Provider**: Neon (PostgreSQL)


### Test Credentials
- Email: `ajayshah@gmail.com`
- Password: `123`

---

## 2. Onboarding: Read This First
*Source: PROJECT_BOOTSTRAP.md*

### Absolute Authority
- `.agent/AGENT_CONSTITUTION.md` is the highest authority.
- Documentation defines truth.
- Agents and models execute — they do NOT decide.
- Architecture, UX rules, and behavior MUST NOT be inferred or invented.

### Global Rules
1. Global UX rules live ONLY in `docs/ux/UX_BASELINE.md`
2. Page-specific behavior lives ONLY in `docs/pages/**`
3. Page contracts are grouped by user journey
4. Architecture, SQL, and migrations are READ-ONLY unless explicitly approved
5. UI/UX MAY be enhanced for clarity, usability, and responsiveness
6. UI/UX MUST NOT be removed, hidden, or degraded unless explicitly instructed by the user

### Workflow (Mandatory)
1. Define or update `.md` contracts FIRST
2. Treat contracts as the sole source of truth
3. Generate Antigravity execution prompts ONLY after contracts exist
4. Never jump directly to code without a governing `.md`
5. All work must be logged:
   - Overwrite `docs/execution/CURRENT_TASK_LOG.md` per task
   - Append to `docs/execution/TASK_HISTORY.md` on completion

---

## 3. New Session Checklist
*Source: NEW_SESSION_CHECKLIST.md*

### Verification of Authority
- [ ] Read `.agent/AGENT_CONSTITUTION.md` (Absolute Authority)
- [ ] Read `docs/architecture/PROJECT_MANIFESTO.md` (This Document)

### Structural Alignment
- [ ] Verify `docs/` folder structure (Semantic folders only)
- [ ] Locate `docs/ux/UX_BASELINE.md` (Global UI Laws)
- [ ] Locate `docs/pages/README.md` (Page Contract Index)

### Contextual Awareness
- [ ] Check `docs/execution/CURRENT_TASK_LOG.md` for active work
- [ ] Review `docs/execution/TASK_HISTORY.md` for recent milestones

### Workflow Compliance
- [ ] Acknowledge that `.md` contracts must exist **BEFORE** code execution
- [ ] Acknowledge that ALL work must be logged in `docs/execution/`
- [ ] Confirm awareness of the "Global Documentation Placement Rule" (Stop & Ask policy)
