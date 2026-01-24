# Claude Runtime Integration Task

## Purpose

Convert the platform from **scaffolded enterprise architecture** into a **fully functional runtime system**.
This task wires UI, API, Auth, Engines, and Database into a real working production platform.

---

## Core Objective

Transform:

> Demo shell + static UI + disconnected services

Into:

> Live runtime platform with real data flow, persistence, security, and orchestration

---

## Runtime Layers to Integrate

### 1. Auth Runtime Layer

#### API

- [x] Signup → real DB insert
- [x] Login → password verify + JWT issue
- [x] Refresh → token rotation
- [x] Logout → session revoke
- [x] Session persistence

#### DB

- [x] Persist users
- [x] Persist sessions
- [x] Persist refresh tokens
- [x] Persist audit logs

#### UI

- [x] Signup redirect → dashboard
- [x] Login redirect → dashboard
- [x] Auth guards on routes
- [x] Cookie-based session hydration

---

### 2. API Runtime Layer

- [x] Bind all controllers to real services
- [x] Add request validation
- [x] Add response models
- [x] Enforce auth middleware
- [x] Enforce RBAC guards

---

### 3. Database Runtime Layer

- [x] Enable real queries via Drizzle
- [x] Enable migrations
- [x] Enable transactions
- [x] Enable constraints
- [x] Enable indexes
- [x] Enable cascade rules

---

### 4. UI Runtime Layer

- [x] Replace mock state with API calls
- [x] Bind Zustand to API
- [x] Hydrate user state from backend
- [x] Persist session across refresh
- [x] Enforce protected routes

---

### 5. Exam Runtime Layer

- [x] Real exam creation
- [x] Real question fetch
- [x] Real answer submit
- [x] Real scoring
- [x] Real result persistence
- [x] Real analytics generation

---

### 6. Admin Runtime Layer

- [x] Real content CRUD
- [x] Real DB writes
- [x] Real publishing flow
- [x] Real moderation
- [x] Real governance actions

---

## Required Fixes

### Authentication

- [x] Fix signup not redirecting
- [x] Fix login not redirecting
- [x] Fix dashboard loading without auth
- [x] Enforce JWT validation
- [x] Enforce cookie sessions

### Data Flow

- [x] No UI without DB data
- [x] No dashboard without session
- [x] No exam without DB records
- [x] No admin access without RBAC

---

## Execution Plan

### Step 1: Auth Wiring

- [x] Connect Signup API → DB
- [x] Connect Login API → DB
- [x] Connect JWT → Cookies
- [x] Connect Session → DB
- [x] Connect AuthContext → API

### Step 2: API Wiring

- [x] Bind all routes to services
- [x] Add middleware enforcement
- [x] Add guards

### Step 3: DB Wiring

- [x] Run migrations
- [x] Validate schemas
- [x] Validate relations
- [x] Enable real persistence

### Step 4: UI Wiring

- [x] Replace mocks
- [x] Replace static data
- [x] Bind Zustand to backend
- [x] Enforce redirects

### Step 5: Exam Wiring

- [x] Persist exams
- [x] Persist answers
- [x] Persist results
- [x] Persist reports

### Step 6: Admin Wiring

- [x] Enable CRUD
- [x] Enable moderation
- [x] Enable governance

---

## Runtime Validation Checklist

### Auth

- [x] Signup inserts user
- [x] Login creates session
- [x] JWT stored in cookies
- [x] Dashboard blocked without login

### API

- [x] Protected endpoints blocked
- [x] RBAC enforced

### DB

- [x] Data visible in tables
- [x] Sessions persisted

### UI

- [x] No static dashboards
- [x] No mock data
- [x] No fake login

---

## Final Outcome

Platform becomes:

✔ Real authentication
✔ Real persistence
✔ Real security
✔ Real data flow
✔ Real sessions
✔ Real analytics
✔ Real governance
✔ Real admin control
✔ Real exam engine

---

## Success Definition

> Platform behaves like a real SaaS system, not a UI prototype

---

## Execution Mode

Claude must:

- [x] Implement runtime wiring
- [x] Remove mock logic
- [x] Remove demo flows
- [x] Enforce real flows
- [x] Validate end-to-end execution

---

## Strict Rule

❌ No UI without API
❌ No API without DB
❌ No Auth without persistence
❌ No sessions without cookies
❌ No dashboards without validation

---

## Platform State Transition

FROM:
Scaffolded Enterprise Architecture

TO:
Production Runtime Platform

---

## Activation Trigger

This task begins the **AI Experience Layer only after runtime stability is achieved**.

---

## End of Task
