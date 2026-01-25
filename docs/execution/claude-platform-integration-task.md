# Claude Platform Integration & Runtime Wiring Task - [COMPLETED]

## Objective
Transform the platform from UI-simulated state into a fully functional runtime system by wiring:
- UI ↔ API
- API ↔ Database
- Auth ↔ Session
- Engines ↔ Persistence
- Admin ↔ Governance
- Runtime ↔ Storage

This phase converts the system from "visual platform" to "operational platform". once execution done then build the project solve the error and deploy on github repo

---

## Phase 1 — API Client Layer - [COMPLETED]
Create frontend API client:

### packages/api-client
- Axios/Fetch wrapper
- Auth interceptor
- Token injection
- Error handling
- Retry logic
- CSRF handling

Expose typed clients:
- AuthClient
- QuizClient
- ExamClient
- ReportClient
- AdminClient

---

## Phase 2 — Auth Binding - [COMPLETED]
Wire UI auth to API:

### Web App
- SignupForm → POST /auth/signup
- LoginForm → POST /auth/login
- Store JWT + refresh token
- Sync Zustand auth store with API state
- Redirect on success
- Persist session
- Implement /auth/me bootstrap

### API
- Ensure signup writes to DB
- Ensure login validates DB
- Issue JWT + refresh tokens
- Set cookies
- Validate sessions

---

## Phase 3 — Route Guards - [COMPLETED]
Implement real guards:

### Frontend
- AuthGuard component
- AdminGuard component
- ProtectedRoute wrapper

### Backend
- JWT validation middleware
- Role-based guards
- Session verification

---

## Phase 4 — Dashboard Binding - [COMPLETED]
Replace mock data:

- Dashboard → GET /user/dashboard
- Stats → DB aggregation
- Charts → real metrics
- Exams → DB queries
- History → DB fetch

---

## Phase 5 — Quiz & Exam Binding - [COMPLETED]

### Quiz Selection
- Fetch domains from API
- Fetch subjects from API
- Fetch topics from API

### Start Exam
- POST /quiz/start
- Create exam session in DB
- Store session state

### Exam Runtime
- GET /quiz/state
- POST /quiz/answer
- POST /quiz/submit

### Result Flow
- GET /quiz/result
- GET /reports

---

## Phase 6 — Persistence Wiring - [COMPLETED]
Ensure DB writes:

- users
- sessions
- refresh_tokens
- quizzes
- exams
- exam_sessions
- answers
- results
- reports
- analytics

---

## Phase 7 — Admin Platform Wiring - [COMPLETED]

### Admin UI
- Admin login → API
- Admin auth guard
- Admin API client

### Admin APIs
- /admin/domains
- /admin/subjects
- /admin/topics
- /admin/questions
- /admin/audit
- /admin/metrics

---

## Phase 8 — API Server Activation - [COMPLETED]
Convert API server from static placeholder to runtime API:

- Add routing
- Add controllers
- Add middleware
- Add DB binding
- Add error handling
- Add logging
- Add health checks

---

## Phase 9 — Runtime Orchestration - [COMPLETED]
Create full runtime flow:

UI → API → Engine → DB → Engine → API → UI

---

## Phase 10 — Validation - [COMPLETED]
Add checks:
- DB writes
- Auth validation
- Session persistence
- Data fetch correctness
- Role enforcement
- Access control
- Error handling
- Security enforcement

---

## Success Criteria
- Signup creates DB user
- Login validates DB user
- Dashboard loads only if authenticated
- Quiz starts creates DB exam
- Exam answers persist
- Results persist
- Reports generated
- Admin only accessible by admin
- No UI-only flows
- No mock state
- No fake data
- Full runtime system operational
