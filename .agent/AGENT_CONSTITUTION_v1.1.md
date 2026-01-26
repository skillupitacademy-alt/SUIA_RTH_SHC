# 📜 AGENT_CONSTITUTION_v1.1.md
# Repository AI Governance & Execution Constitution (Addendum)

**Version**: 1.1  
**Status**: Additive Amendment (Non-breaking)  
**Applies To**: All Antigravity Agents & Models  
**Parent Document**: AGENT_CONSTITUTION.md  
**Change Policy**: User-only approval  

---

## ⚠️ IMPORTANT NOTICE

This document is an **addendum** to `AGENT_CONSTITUTION.md`.

- All rules in v1.0 remain **fully valid**
- This file **only adds missing guardrails**
- In case of conflict, **v1.0 still applies unless explicitly overridden here**

---

## 1️⃣ READ vs WRITE PERMISSION MATRIX (MANDATORY)

To prevent accidental system truth modification, all agents MUST follow this **explicit permission matrix**.

### 📂 Permission Rules by Path

| Path | Read | Write | Notes |
|-----|-----|------|------|
| `@docs/**` | ✅ | ❌ | Read-only unless user explicitly says **“update docs”** |
| `apps/**` | ✅ | ⚠️ | Write ONLY within explicitly requested scope |
| `packages/**` | ✅ | ⚠️ | Write ONLY for named modules |
| `agent/**` | ✅ | ✅ | Behavior & orchestration only |
| SQL / Migrations | ✅ | ❌ | Immutable unless user explicitly says **“modify migration SQL”** |

### Enforcement Rule

If write permission is **unclear or implied** →  
🚨 **AGENT MUST STOP AND ASK USER**

---

## 2️⃣ VERSIONING & CHANGE TRACEABILITY RULE

To preserve long-term stability and auditability:

### Documentation Change Law

Any modification to files under `@docs/**` MUST:

- Preserve original intent
- NOT remove historical meaning
- Append changes instead of rewriting
- Add a **Change Log** section if modification is approved

### Forbidden Actions

- Silent rewrites
- Auto-refactoring of docs
- “Cleaning up” wording without approval

---

## 3️⃣ NON-GOALS (EXPLICITLY FORBIDDEN BEHAVIORS)

The following are **explicit non-goals** of this repository and its AI agents:

- ❌ Autonomous architecture refactoring
- ❌ Automatic schema optimization
- ❌ Self-healing migrations
- ❌ Silent performance rewrites
- ❌ Business logic invention
- ❌ Inferring requirements not present in `@docs/**`

If a request implicitly moves toward a non-goal →  
🚨 **AGENT MUST STOP**

---

## 4️⃣ EMERGENCY OVERRIDE PROTOCOL (MANDATORY)

In rare emergency situations (e.g., production outage):

### Override Conditions

- ONLY the repository owner may authorize an override
- The user MUST explicitly state:

> **“Emergency override — proceed despite constitution”**

### Override Rules

- All overridden actions must be acknowledged
- No silent overrides allowed
- Overrides do NOT become new defaults

Without explicit override language →  
🚨 **NO RULE MAY BE BYPASSED**

---

## 5️⃣ CLARIFICATION: `agent/**` vs EXECUTION LOGIC

To avoid confusion:

- `agent/**` files define **HOW an agent behaves**
- They do NOT define:
  - Architecture
  - Runtime logic
  - Business rules
  - Security policies

Execution logic must always derive from `@docs/**`.

---

## 6️⃣ CLARIFICATION: DOCS vs SPECS vs TASKS

### Document Roles

| Type | Purpose |
|----|--------|
| Specs | Define system truth |
| Tasks | Derived execution steps |
| Walkthroughs | Human guidance |
| Implementations | Concrete realization |

Only **Specs** are authoritative.  
All others are **derived artifacts**.

---

## 7️⃣ AI ACTION OBSERVABILITY (OPTIONAL BUT RECOMMENDED)

For transparency and debugging, agents SHOULD internally track:

- Files read
- Files written
- STOP conditions triggered
- Override acknowledgements

This data is for **agent self-validation**, not runtime logging.

---

## 8️⃣ MANDATORY DOC APPEND RULE (NEW)

### 🚨 CRITICAL ADDITION

Whenever an agent **creates or updates** any of the following files:

- `task.md`
- `implementation.md`
- `walkthrough.md`

The agent MUST obey the following rules:

### Placement Law
- Tasks, Walkthroughs, and Implementation plans MUST live inside the `@docs/` directory
- **Specifications (Spec MDs)** MUST live inside `@docs/execution/`
- They are **FORBIDDEN** in the root or generic subfolders unless derived

### Creation / Append Rules

1. If the file **does NOT exist**:
   - Create it under `@docs/`
2. If the file **already exists**:
   - Append new content
   - DO NOT overwrite existing content
3. Content must be:
   - Clearly sectioned
   - Timestamped (recommended)
   - Traceable to source spec

### Example Paths

- `@docs/task.md`
- `@docs/implementation.md`
- `@docs/walkthroughs/WALKTHROUGH_COMPLIANCE_ALIGNMENT.md`

🚨 Violation of this rule requires **immediate STOP**.

---

## 9️⃣ FINAL ADDENDUM PRINCIPLE

> **System truth remains centralized**  
> **Derived artifacts remain append-only**  
> **AI assists — it never replaces intent**

This principle applies to **all future models and agents**.

---

📌 **END OF AGENT_CONSTITUTION_v1.1 ADDENDUM**
