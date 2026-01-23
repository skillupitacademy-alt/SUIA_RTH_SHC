# CLAUDE DOMAIN MODELING TASK
# Platform: Quiz Platform (realtutorialhub.com)
# Phase: Platform Core → Domain Modeling Layer
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
- Enterprise scalability
- AI-readiness
- Platform-first architecture

---

# 🎯 TASK OBJECTIVE
Design and implement the **Domain Model** for the Quiz Platform.

This is the **core product intelligence layer**.

It must define:
- structure
- relationships
- hierarchy
- logic
- rules
- mappings
- constraints
- selection engines
- composition rules
- scoring models
- reporting dimensions

This is NOT UI work.
This is NOT infra work.
This is NOT auth work.
This is **product logic architecture**.

---

# 🧠 BUSINESS CONTEXT

Platform supports quizzes for:
1. Full Stack Development
2. Data Analyst
3. Data Science
4. Data Engineering
5. Cyber Security
6. Ethical Hacking

Each domain contains:
- subjects
- topics
- subtopics
- skills
- difficulty layers
- learning objectives

---

# 🎓 DIFFICULTY MODEL (GLOBAL RULE)

Difficulty is system-controlled:
- Simple → 30%
- Intermediate → 30%
- Expert → 40%

Difficulty is NOT user-based.
Difficulty is NOT profile-based.
Difficulty is part of the **exam engine**.

---

# 🧱 DOMAIN ENTITIES TO MODEL

## Core Entities

### Domain
- id
- name
- description
- category
- status

### Subject
- id
- domain_id
- name
- description
- order
- status

### Topic
- id
- subject_id
- name
- description
- complexity_level
- weight
- status

### Subtopic
- id
- topic_id
- name
- description
- depth_level

### Skill
- id
- name
- category
- mapping_type

---

# 🔗 RELATIONSHIP MODELS

- Domain → Subjects (1:N)
- Subject → Topics (1:N)
- Topic → Subtopics (1:N)
- Topic ↔ Skills (N:M)
- Topic ↔ Difficulty (rule-based)
- Domain ↔ Exams (1:N)

---

# 📊 QUESTION MODEL

### Question Entity
- id
- topic_id
- difficulty
- type (MCQ, CODE_MCQ)
- question_text
- options[]
- correct_answer
- explanation
- code_snippet (optional)
- metadata
- tags[]

---

# 🧠 EXAM COMPOSITION ENGINE

Implement logic for:

## ExamBlueprint
- selected_domains[]
- selected_subjects[]
- selected_topics[]
- total_questions
- time_limit
- difficulty_distribution

## Composition Rules
- enforce 30/30/40 difficulty
- topic coverage balance
- subject weight normalization
- randomization
- repetition avoidance
- question diversity
- skill coverage

---

# 📐 SCORING MODEL

### Score Dimensions
- domain_score
- subject_score
- topic_score
- difficulty_score
- accuracy
- time_efficiency
- consistency

---

# 📈 REPORTING DIMENSIONS

- strength_areas
- weak_areas
- topic_mastery
- skill_gaps
- improvement_zones
- learning_recommendations

---

# 🗄️ DATABASE MODELS (Drizzle)

Create schemas for:
- domains
- subjects
- topics
- subtopics
- skills
- topic_skills
- questions
- exams
- exam_blueprints
- exam_questions
- results
- score_dimensions
- reports

---

# 🧱 MODULE STRUCTURE (apps/api-server)

Create:

apps/api-server/src/modules/domain/
- domain.service.ts
- domain.controller.ts
- domain.routes.ts

apps/api-server/src/modules/subject/
apps/api-server/src/modules/topic/
apps/api-server/src/modules/question/
apps/api-server/src/modules/exam/
apps/api-server/src/modules/report/
apps/api-server/src/modules/scoring/
apps/api-server/src/modules/selection-engine/

---

# 🧠 ALGORITHMIC COMPONENTS

Implement:
- Question selection algorithm
- Difficulty distribution algorithm
- Topic balancing algorithm
- Randomization engine
- Repetition prevention
- Skill coverage algorithm
- Adaptive composition readiness

---

# 🧪 QA REQUIREMENTS

Tests for:
- selection logic
- difficulty distribution
- coverage logic
- composition rules
- scoring accuracy
- report correctness
- data integrity

---

# 📚 DOCUMENTATION

Generate:
- Domain model docs
- Entity relationship diagrams
- Exam engine logic
- Selection algorithm docs
- Difficulty engine docs
- Scoring model docs
- Reporting model docs
- Data dictionary

---

# 🧠 EXECUTION RULES FOR CLAUDE

Claude must:
- Follow DDD patterns
- Use layered architecture
- Separate concerns
- Use service pattern
- Use repository pattern
- Use modular schemas
- Avoid monolithic files
- Respect monorepo structure
- Respect agent governance
- Respect platform boundaries
- Avoid UI logic
- Avoid infra logic
- Avoid auth logic
- Implement real logic
- Implement scalable models
- Design for future AI integration

---

# ✅ FINAL OUTPUT EXPECTED

- Domain schemas created
- DB models implemented
- Domain services created
- API routes created
- Exam composition engine implemented
- Selection algorithms implemented
- Scoring engine implemented
- Reporting models implemented
- Documentation generated
- Test scaffolding created
