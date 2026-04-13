# 🏆 MASTER AUTHENTICATION & AUTHORIZATION IMPLEMENTATION GUIDE

> Purpose: This is your SINGLE SOURCE OF TRUTH to implement authentication & authorization across your platform (Frontend → BFF → Backend → DB → Multi-brand SSO)

---

# 🧭 HOW TO USE THIS DOCUMENT

Follow this guide **step-by-step in sequence**. Do NOT jump steps.

Flow:
Frontend → BFF → Auth Service → Gateway → Backend Services → Database → Multi-Brand SSO

---

# 📚 REQUIRED MD FILES (READ IN THIS ORDER)

## 🔰 PHASE 0 — Understanding Current System
1. ACTUAL-ARCHITECTURE-FLOW.md
2. AUTH_GUIDELINES.md
3. PRODUCTION_CERTIFICATION.md

👉 Goal: Understand what is already built and what NOT to break

---

## 🧱 PHASE 1 — Frontend + BFF (Already Mostly Done)
4. AUTH_SYSTEM_PRD.md

👉 Focus:
- Login/Signup UI
- Brand-agnostic auth pages
- NO token handling in frontend
- Use proxy.ts as auth guard

✅ Output:
- Login working
- User stored in auth store
- Redirect working

---

## 🔐 PHASE 2 — Core Auth Flow (CURRENT SYSTEM)
5. AUTH_GUIDELINES.md (Re-read deeply)

👉 Implement/Verify:
- HTTP-only cookies (access + refresh)
- proxy.ts token verification
- TokenService usage everywhere
- /auth/login and /auth/me working

✅ Output:
- Secure login flow
- Session restoration working

---

## ⚙️ PHASE 3 — Backend Auth (CURRENT → IMPROVE)
6. PRODUCTION_CERTIFICATION.md

👉 Focus:
- TokenService centralization
- Identity headers (x-user-id)
- Middleware enforcement
- No duplicate JWT logic

✅ Output:
- Stable backend auth
- All services trust token

---

## 🌐 PHASE 4 — Gateway Layer
7. PHASE-INFRA-GATEWAY.md

👉 Implement:
- JWT verification at gateway (edge)
- Routing to services
- Rate limiting
- Header injection

⚠️ IMPORTANT:
Currently gateway is partially used → standardize usage

✅ Output:
- All API calls pass through gateway

---

## 🏗️ PHASE 5 — Service Architecture
8. ADR-CRITICAL-001-integration-architecture.md

👉 Focus:
- Separate databases per service
- Event-driven communication (QStash)
- No cross-DB joins
- Microservices separation

✅ Output:
- Scalable backend system

---

## 🔗 PHASE 6 — Build Dedicated Auth Service (UPGRADE)

👉 NEW (Not fully implemented yet)

Create:
- services/auth-service (or skillhubcore-service)

Responsibilities:
- Login / Signup
- Token generation
- Refresh token rotation
- Identity management

Move from:
❌ Auth inside api-server

To:
✅ Central Auth Service

✅ Output:
- Single identity provider

---

## 🌍 PHASE 7 — Multi-Brand SSO (CRITICAL)

👉 Implement SkillHubCore properly

Token should include:

{
  userId,
  platforms: ["realtutorialhub", "skillup"],
  roles,
  subscription
}

Flow:
- Login once
- Access all apps

✅ Output:
- True Single Sign-On

---

## 🔐 PHASE 8 — Authorization System

Implement:

### 1. RBAC
- roles: admin, student, faculty

### 2. Permission checks in services
- middleware-based

### 3. Optional ABAC (advanced)
- access based on attributes (purchase, org, etc.)

✅ Output:
- Fine-grained access control

---

## 🗄️ PHASE 9 — Database Layer

Follow ADR strictly:

- exam-db
- tutorial-db
- people-db
- payment-db

Rules:
- NO shared DB
- NO cross joins
- Use events for sync

✅ Output:
- Scalable data layer

---

## 🔄 PHASE 10 — Full Request Flow (FINAL STATE)

Final Architecture:

Frontend
   ↓
BFF (proxy.ts)
   ↓
API Gateway
   ↓
Auth Service (verify identity)
   ↓
Microservices (apply authorization)
   ↓
Databases

---

# 🚨 GOLDEN RULES (NEVER BREAK)

1. ❌ Never store tokens in localStorage
2. ❌ Never decode JWT in frontend
3. ❌ Never duplicate token logic
4. ❌ Never bypass proxy.ts
5. ❌ Never share databases across services
6. ❌ Never trust frontend for auth

---

# ✅ FINAL CHECKLIST

Before production:

- [ ] Login works via cookies
- [ ] proxy.ts guards all protected routes
- [ ] TokenService used everywhere
- [ ] Gateway validates JWT
- [ ] Auth Service centralized
- [ ] SSO working across brands
- [ ] RBAC implemented
- [ ] No localStorage tokens
- [ ] No duplicate JWT logic

---

# 🎯 SUMMARY

You are evolving from:

👉 BFF-based auth system (current)

To:

👉 FAANG-level distributed auth architecture

---

# 🚀 NEXT ACTION

Start with:

👉 PHASE 0 → PHASE 1 → PHASE 2

Then come back and say:

"Start Auth Service Extraction"

and we will build the central identity system step-by-step.

