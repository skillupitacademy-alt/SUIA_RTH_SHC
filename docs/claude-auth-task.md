# CLAUDE AUTH IMPLEMENTATION TASK
# Platform: Quiz Platform (realtutorialhub.com)
# Stack: Next.js + TypeScript + Vercel + Neon PostgreSQL + Drizzle ORM + Turborepo
# Architecture Mode: Monorepo + Modular Services
# Execution Mode: Enterprise Platform Engineering

## GLOBAL CONTEXT
This project follows:
- PRD.md
- TRD.md
- System Architecture Document
- Security Architecture Document
- AI Architecture Document
- Platform Roadmap
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
- SOLID principles
- DRY
- KISS
- YAGNI
- Clean Architecture
- Domain-driven design
- Separation of concerns
- Zero-trust security
- API-first design
- Modular structure
- Enterprise scalability
- Future-proof extensibility

---

# 🎯 TASK OBJECTIVE
Implement the **Auth & Identity System** for the platform.

This is the foundation system for:
- user identity
- sessions
- onboarding
- security
- dashboards
- admin access
- analytics
- AI recommendations
- reports
- future monetization

---

# 🧠 BUSINESS RULES

## USER MODEL
All are USERS:
- school students
- college students
- graduates
- working professionals
- experienced professionals

They are **profile attributes only**, NOT roles.

### Roles:
- USER
- ADMIN
- SUPER_ADMIN

Difficulty is NOT user-based.
Difficulty is controlled by exam engine:
- Simple 30%
- Intermediate 30%
- Expert 40%

---

# 🧱 TECHNICAL TARGET

## Domain URLs
- quiz.realtutorialhub.com  → user app
- admin.realtutorialhub.com → admin app
- api.realtutorialhub.com   → API server

---

# 🔐 AUTH SYSTEM REQUIREMENTS

## Authentication
- Email + Password
- JWT-based auth
- Refresh tokens
- HttpOnly cookies
- Secure cookies
- SameSite=strict
- Token rotation
- Token revocation

## Authorization
- RBAC:
  - USER
  - ADMIN
  - SUPER_ADMIN

## Sessions
- Access token (15 min)
- Refresh token (7 days)
- Rotation enabled
- Revocation enabled
- Logout invalidation

---

# 🗄️ DATABASE (Neon PostgreSQL + Drizzle)

Tables to implement:

### users
- id (uuid)
- email
- password_hash
- email_verified
- created_at
- updated_at

### user_profiles
- id
- user_id (fk)
- name
- education_level
- professional_status
- age_group
- experience_years
- domain_interest[]

### roles
- id
- name

### user_roles
- user_id
- role_id

### sessions
- id
- user_id
- ip
- device
- expires_at

### refresh_tokens
- id
- user_id
- token
- expires_at
- revoked

---

# 🔗 API CONTRACTS

Base URL:
https://api.realtutorialhub.com/api/auth

Endpoints:

POST   /auth/signup  
POST   /auth/login  
POST   /auth/verify-email  
POST   /auth/refresh  
POST   /auth/logout  
GET    /auth/me  
POST   /auth/onboarding  

---

# 🧱 MODULE STRUCTURE (apps/api-server)

Create:

apps/api-server/src/modules/auth/
- auth.controller.ts
- auth.service.ts
- auth.routes.ts
- auth.middleware.ts
- token.service.ts
- password.service.ts
- session.service.ts
- role.guard.ts

---

# 🧠 SECURITY

- bcrypt hashing
- salt rounds
- rate limiting
- brute force protection
- audit logging
- token rotation
- refresh revocation
- secure cookies
- strict CORS
- CSRF protection

---

# 🖥️ FRONTEND INTEGRATION

## quiz-platform-web-app
Routes:
- /login
- /signup
- /verify
- /onboarding
- /dashboard

Auth state management:
- session check
- protected routes
- redirect guards
- token refresh handling

---

# 🛠️ ENV VARIABLES

Create:
JWT_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRE
JWT_REFRESH_EXPIRE
COOKIE_DOMAIN=.realtutorialhub.com
NODE_ENV=production

---

# 🧪 QA REQUIREMENTS

- auth unit tests
- token tests
- refresh tests
- session tests
- middleware tests
- RBAC tests
- API contract tests

---

# 📚 DOCUMENTATION

Auto-generate:
- auth API docs
- auth flow diagrams
- onboarding flow
- token lifecycle docs
- security model docs

---

# 🧠 EXECUTION RULES FOR CLAUDE

Claude must:
- Respect architecture
- Respect monorepo structure
- Respect module boundaries
- Respect agents
- Respect platform layering
- Not create monolithic files
- Not mix frontend/backend logic
- Not bypass security
- Not hardcode secrets
- Not generate demo code
- Not generate mock auth
- Implement real production logic
- Implement scalable structure

---

# ✅ FINAL OUTPUT EXPECTED

- Auth API implemented
- DB schema implemented
- JWT system implemented
- Middleware implemented
- Session system implemented
- Onboarding API implemented
- Frontend auth pages scaffolded
- Admin auth isolation prepared
- Security baseline active
- Tests scaffolded
- Docs generated
