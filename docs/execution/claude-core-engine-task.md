# CLAUDE CORE ENGINE IMPLEMENTATION TASK
# Platform: Quiz Platform (realtutorialhub.com)
# Phase: Platform Core → Runtime Engine Layer
# Execution Mode: Enterprise Platform Engineering
# Stack: Next.js + TypeScript + Vercel + Neon PostgreSQL + Drizzle + Turborepo

## GLOBAL CONTEXT
This project follows:
- PRD.md
- TRD.md
- System Architecture Document
- Security Architecture Document
- AI Architecture Document
- Platform Roadmap
- Engineering Principles & Optimization Playbook
- Auth & Identity Blueprint
- Auth Security Hardening Docs
- Domain Modeling Docs
- Domain Schema Definitions
- Exam Composition Rules
- Difficulty Engine Specs
- Reporting Model Docs
- All agent files:
  - architect-agent.md
  - backend-agent.md
  - frontend-agent.md
  - devops-agent.md
  - qa-agent.md
  - docs-agent.md
  - ai-agent.md
  - build-workflow.md

Claude must follow:
- SOLID
- DRY
- KISS
- YAGNI
- Clean Architecture
- Domain-Driven Design (DDD)
- Separation of concerns
- Modular design
- Event-driven readiness
- Scalability
- Platform-first architecture
- AI-readiness
- Production safety

---

# 🎯 TASK OBJECTIVE
Implement the **Core Runtime Engines** of the platform.

This is the **execution layer**, not modeling, not infra, not auth, not security.

These engines turn logic into **live system behavior**.

---

# 🧠 CORE ENGINES TO IMPLEMENT

## 1) Quiz Engine
Responsible for:
- quiz creation
- quiz configuration
- quiz lifecycle
- quiz state
- quiz sessions
- quiz persistence

---

## 2) Exam Engine
Responsible for:
- exam instantiation
- exam session lifecycle
- exam timers
- question streaming
- pagination
- navigation control
- submission flow
- state recovery
- resume logic

---

## 3) Question Delivery Engine
Responsible for:
- question fetching
- difficulty enforcement
- randomization
- order balancing
- diversity control
- repetition prevention
- code-mcq rendering support

---

## 4) Answer Evaluation Engine
Responsible for:
- answer validation
- correctness detection
- multi-option MCQ support
- code-option MCQ support
- partial scoring readiness
- negative marking readiness

---

## 5) Scoring Engine (Runtime Layer)
Responsible for:
- live scoring
- dimension scoring
- difficulty scoring
- topic scoring
- skill scoring
- accuracy metrics
- time efficiency metrics
- consistency metrics

---

## 6) Report Engine
Responsible for:
- result generation
- breakdown creation
- strength mapping
- weakness detection
- mastery evaluation
- improvement mapping
- recommendation hooks

---

## 7) Dashboard Data Engine
Responsible for:
- user dashboard aggregation
- progress tracking
- performance history
- trend analysis
- visualization readiness
- analytics pipelines

---

## 8) Admin Runtime Engine
Responsible for:
- content publishing
- question lifecycle
- validation workflows
- moderation flows
- approval pipelines
- audit tracking

---

# 🧱 MODULE STRUCTURE (apps/api-server)

Create:

apps/api-server/src/modules/quiz-engine/
apps/api-server/src/modules/exam-engine/
apps/api-server/src/modules/question-engine/
apps/api-server/src/modules/answer-engine/
apps/api-server/src/modules/scoring-engine/
apps/api-server/src/modules/report-engine/
apps/api-server/src/modules/dashboard-engine/
apps/api-server/src/modules/admin-engine/

Each module must contain:
- controller.ts
- service.ts
- routes.ts
- model.ts
- validator.ts
- engine.ts

---

# 🔁 RUNTIME FLOW

User → Quiz Engine → Exam Engine → Question Engine → Answer Engine → Scoring Engine → Report Engine → Dashboard Engine


---

# 🧠 SESSION MODEL

Implement:
- exam sessions
- quiz sessions
- persistence
- resume capability
- crash recovery
- timeout handling
- auto-submit
- reconnect logic

---

# 🧠 EVENT FLOW (LOGICAL)

EXAM_STARTED
QUESTION_SERVED
ANSWER_SUBMITTED
ANSWER_EVALUATED
SCORE_UPDATED
EXAM_COMPLETED
REPORT_GENERATED
DASHBOARD_UPDATED


---

# 📐 API CONTRACTS

Base URL:
https://api.realtutorialhub.com/api

### Quiz/Exam APIs:
- POST   /quiz/start
- GET    /quiz/state
- POST   /quiz/answer
- POST   /quiz/submit
- GET    /quiz/result
- GET    /dashboard
- GET    /reports
- POST   /admin/publish
- POST   /admin/validate
- POST   /admin/approve

---

# 🗄️ DATABASE MODELS

Implement:
- quiz_sessions
- exam_sessions
- question_sessions
- answer_logs
- live_scores
- results
- reports
- dashboards
- analytics_events

---

# 🧪 QA REQUIREMENTS

Implement tests for:
- session flow
- engine coordination
- scoring accuracy
- timing logic
- state recovery
- question sequencing
- randomization
- result integrity
- report correctness
- dashboard consistency

---

# 📚 DOCUMENTATION

Generate:
- runtime engine architecture
- engine interaction diagrams
- session lifecycle diagrams
- scoring flow
- reporting flow
- dashboard data flow
- admin runtime flow
- event model docs

---

# 🧠 EXECUTION RULES FOR CLAUDE

Claude must:
- Build real runtime logic
- Not generate demo flows
- Not generate mock engines
- Implement production-safe logic
- Use async-safe patterns
- Use transaction safety
- Use idempotent operations
- Implement failure recovery
- Implement retries where needed
- Implement state consistency
- Avoid tight coupling
- Use service orchestration
- Follow clean layering
- Respect module boundaries
- Respect agents
- Respect governance
- Respect monorepo structure
- Respect scalability requirements
- Design for AI integration
- Design for analytics
- Design for future streaming

---

# ✅ FINAL OUTPUT EXPECTED

- Quiz engine implemented
- Exam engine implemented
- Question delivery engine implemented
- Answer evaluation engine implemented
- Scoring engine implemented
- Report engine implemented
- Dashboard engine implemented
- Admin runtime engine implemented
- Runtime APIs implemented
- Session persistence implemented
- Recovery logic implemented
- Docs generated
- Tests scaffolded
