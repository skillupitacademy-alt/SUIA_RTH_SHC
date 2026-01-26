# 📜 AGENT_CONSTITUTION.md
# Repository AI Governance & Execution Constitution

**Scope**: All Antigravity Agents  
**Applies To**: Every model, every execution, every task  
**Priority**: ABSOLUTE  
**Change Policy**: User-only approval  

---

## 1️⃣ PURPOSE OF THIS CONSTITUTION

This document defines **binding laws** for how AI agents operating in this repository must:

- Interpret documentation
- Organize files
- Respect architecture
- Prevent code breakage
- Remain stable across model changes
- Avoid silent behavior drift

This constitution **overrides agent reasoning, model preferences, and inferred behavior**.

---

## 2️⃣ SOURCE-OF-TRUTH HIERARCHY (NON-NEGOTIABLE)

All decisions MUST follow this hierarchy **in order**:

1. `@docs/**` → **Absolute Source of Truth**
2. Executable artifacts (SQL, migrations) → **Immutable Truth**
3. `agent/**` → **Behavioral control only**
4. Model reasoning → **Lowest priority**

### Conflict Rule

If a conflict exists at any level:

- **Higher authority ALWAYS wins**
- **Agent MUST STOP and ASK the user**

---

## 3️⃣ DEFINITION OF ROLES

### 📚 `@docs/**`

Defines:
- Architecture
- Runtime behavior
- Security rules
- API contracts
- Database rules
- Environment configuration
- CI/CD & deployment
- Product & UX contracts

👉 **Docs define WHAT the system is**

---

### 🤖 `agent/**`

Defines:
- HOW an agent behaves
- HOW tasks are executed
- WHAT to avoid

👉 **Agents do NOT define system truth**

---

### 🧠 Model

- Executes instructions
- Must NOT decide architecture
- Must NOT invent rules
- Must NOT reinterpret truth

---

## 4️⃣ DOCUMENT PLACEMENT LAWS

### ✅ MUST LIVE IN `@docs/`

The following file types are **forbidden inside `agent/`** and MUST live in `@docs/`:

- Architecture documents
- Runtime flow diagrams
- Domain models
- Security specifications
- Auth rules
- Environment configuration
- Deployment instructions
- CI/CD rules
- Build fixes
- Testing guides
- Audit reports
- Platform task definitions
- UX / product specifications

**Reason**:  
These documents must **NEVER be reinterpreted by models**.

---

### ❌ STRICTLY FORBIDDEN IN `agent/`

The agent MUST NEVER place, copy, or rewrite:

- SQL files
- Migrations
- Database schemas
- Environment rules
- Deployment steps
- Runtime architecture
- API contracts
- Business logic
- Security policies

🚨 **Violation = STOP IMMEDIATELY**

---

## 5️⃣ SQL & MIGRATION CONSTITUTION

SQL files represent **executable system truth**.

### Placement

- `packages/db/migrations/`
- OR referenced under `@docs/db/`

### Agent Rules

- ✅ MAY read
- ✅ MAY explain
- ✅ MAY validate
- ❌ MUST NOT modify
- ❌ MUST NOT regenerate
- ❌ MUST NOT reorder
- ❌ MUST NOT auto-apply

Unless the user explicitly states:

> **“Modify migration SQL”**

---

## 6️⃣ AGENT EXECUTION RULES

 An Antigravity agent MUST:

- Explicitly reference documentation paths  
  Example:


@docs/runtime/runtime-engine-architecture.md


- Treat `@docs/**` as immutable law
- Never duplicate docs into agent prompts
- Never “optimize” architecture
- Never refactor due to model preference
- Never infer missing rules
- Never bypass documented constraints

---

## 7️⃣ MODEL-SWITCH SAFETY GUARANTEE

When the active model changes:

- Execution behavior MUST remain identical
- Code output MUST remain consistent
- API contracts MUST remain unchanged
- Runtime logic MUST NOT drift

This is enforced by:
- Centralized truth in `@docs/`
- Thin, procedural agent behavior
- Zero architectural inference

---

## 8️⃣ STOP CONDITIONS (MANDATORY)

The agent MUST STOP and ASK the user if:

- A request contradicts `@docs/**`
- A file location is ambiguous
- A migration needs modification
- A deployment rule conflicts
- An environment rule is unclear
- The task would alter system truth

**No exceptions.**

---

## 9️⃣ SELF-VALIDATION CHECKLIST (REQUIRED)

Before completing any task, the agent must internally confirm:

- [ ] All authoritative `.md` files are in `@docs/`
- [ ] No SQL exists inside `agent/`
- [ ] No business logic exists in agent files
- [ ] Docs are referenced, not copied
- [ ] No assumptions were introduced
- [ ] No model-specific behavior was added

If any check fails → **STOP**

---

## 🔟 CHANGE CONTROL POLICY

This constitution can ONLY be changed by:

- The repository owner
- Explicit user instruction

Agents MUST NOT:

- Edit this file
- Summarize it away
- Override it
- Replace it

---

## 1️⃣1️⃣ FINAL GOVERNING PRINCIPLE

> **Docs define truth**  
> **Agents define behavior**  
> **Models execute — they do not decide**

This principle MUST be upheld at all times.

---

## 1️⃣2️⃣ ENGINEERING STANDARDS (FAANG SDE-3)

All code and architecture MUST adhere to these Tier-1 engineering principles:

### 🚀 Scalability Mandate
> **All future logic must support millions of concurrent users. Implement database-level pagination, efficient indexing, and stateless processing for all services.**

### 🎨 Frontend (UI/UX Excellence)
- **Visual WOW Factor**: Interfaces must look premium, modern, and high-performance. Use vibrant colors, smooth micro-animations, and glassmorphism where appropriate.
- **Performance First**: Optimize for Core Web Vitals (LCP, FID, CLS). Use code-splitting, lazy loading, and image optimization assets.
- **Accessibility (A11y)**: Full WCAG 2.1 Compliance. Semantic HTML is mandatory.
- **State Sovereignty**: Centralized state management (e.g., Zustand/Redux) with clear patterns for optimistic updates and caching.

### 🏢 BFF (Backend For Frontend)
- **Payload Minimization**: Never return raw database objects. Every response must be tailored for the consumer (web/mobile), trimming unnecessary fields to save bandwidth.
- **API Aggregation**: The BFF must resolve multiple downstream data sources into a single request for the client.
- **Client-Side Caching Headers**: Implement ETag, Last-Modified, and Cache-Control strategies aggressively.

### 🔩 Backend (Distributed Systems)
- **High Concurrency**: Use non-blocking I/O and stateless architecture to allow seamless horizontal scaling across compute nodes.
- **Database Optimization**: Mandatory query profiling. Use B-Tree/GIN indexing strategically. Never perform `SELECT *` on high-traffic tables.
- **Idempotency**: All write operations (POST/PUT/DELETE) must be idempotent to prevent duplicate processing during retries.
- **Consistent Consistency**: Use transactions for atomic state changes; use eventual consistency models for non-critical logging/analytics.

### 🛡️ Security & Privacy
- **Zero Trust Architecture**: Never trust internal calls. Every request must be authenticated and authorized via JWT/OIDC.
- **Least Privilege (RBAC)**: Enforce strict Role-Based Access Control at the API and Database levels.
- **Automatic Sanitization**: All user input MUST be sanitized and validated at the boundary before entering business logic.

### ⚖️ Reliability & Load Balancing
- **Horizontal Elasticity**: Services must be designed to spin up/down based on load with zero downtime.
- **Observability**: Every operation must be traceable. Implement structured logging, metrics (Prometheus), and distributed tracing (OpenTelemetry).
- **Graceful Degradation**: Implement Circuit Breakers and Retries with Exponential Backoff for all external service calls.

---

📌 **END OF AGENT CONSTITUTION**
