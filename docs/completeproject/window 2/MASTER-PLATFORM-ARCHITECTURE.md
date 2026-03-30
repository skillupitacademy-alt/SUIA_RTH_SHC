# Master Platform Architecture Blueprint
## Complete Microservices Design — BYJU's-Grade EdTech Platform

> Version: 1.0 | Status: Approved for Implementation
> Stack: Next.js · Node.js (Hono) · Neon Postgres · Upstash · Vercel · Cloudflare · Razorpay · Stripe · Resend

---

## PART 0: Architecture Philosophy

### Pattern: "Modular Monolith Microservices"
Each service is:
- A self-contained, independently deployable application
- Internally structured as a clean monolith (SOLID, DI, Repository Pattern)
- Owner of its own database schema (or shared DB with strict table ownership)
- Communicates externally via events (QStash) or REST (API Gateway)
- Can be scaled, failed, deployed, and rolled back independently

### Why NOT pure microservices?
Pure microservices (100+ tiny functions) require a dedicated platform
engineering team of 20+ engineers just to operate the infrastructure.
At your current stage, each "service" here is sized correctly —
large enough to be meaningful, small enough to deploy independently.

---

## PART 1: Recommended Answers to All Open Questions

### 1.1 — Frontend ↔ Service Communication
**RECOMMENDATION: API Gateway for external + BFF per frontend for complex UIs**

```
External (student browser → platform):
  student.yourplatform.com → Cloudflare → API Gateway → correct service

Internal (service → service):
  Never via API Gateway. Always via QStash events (async)
  or direct HTTP with service tokens (sync, rare)
```

Reason: API Gateway gives you one place for auth, rate limiting,
logging, and routing. BFF per frontend handles UI-specific aggregation
(combining data from multiple services for one page render).

### 1.2 — Service-to-Service Communication
**RECOMMENDATION: Hybrid — REST for sync queries + QStash events for async**

```
Synchronous (needs immediate response):
  API Gateway calls service via authenticated REST
  Example: "Is this student enrolled?" → Student Service → yes/no

Asynchronous (fire and forget, eventual consistency):
  QStash message queue between services
  Example: "Exam completed" → QStash → Tutorial Service creates remediation plan
                            → QStash → Notification Service sends email
                            → QStash → CRM Service updates student status
```

Reason: gRPC adds protobuf complexity with no benefit at this scale.
Pure events break debuggability. Hybrid gives you speed + simplicity.

### 1.3 — Services Confirmed
**RECOMMENDATION: 8 services — exactly as listed below**

```
1. api-gateway-service      → Auth, routing, rate limiting, JWT validation
2. student-faculty-service  → People DB (students + faculty + batches + attendance)
3. crm-service              → Enquiry + Admission + Follow-up (People DB)
4. payment-service          → Payment DB (ledger + installments + gateway abstraction)
5. exam-service             → Exam DB (questions + sessions + scores)
6. tutorial-service         → Tutorial DB (content + assignments + projects + progress)
7. notification-service     → All channels (Email + SMS + WhatsApp + Push) — stateless
8. placement-service        → Placement DB (jobs + internships + certifications)
```

### 1.4 — Repository Strategy
**RECOMMENDATION: pnpm Turborepo Monorepo with independent deployments**

```
One GitHub repo. One pnpm workspace. Turborepo for build orchestration.
Each service deploys independently to Vercel (frontend apps) or
Cloudflare Workers / Railway (backend Hono services).
```

Reason: Polyrepo creates massive coordination overhead for a small team.
Monorepo lets you share types, utilities, and DB clients across services
while still deploying each service independently.

---

## PART 2: Complete Platform Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STUDENT-FACING APPS                             │
│  student-app (Next.js)   faculty-app (Next.js)   crm-app (Next.js)     │
│  placement-app (Next.js) admin-app (Next.js — existing)                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS
                        ┌───────▼────────┐
                        │  Cloudflare    │  WAF, DDoS, CDN, Edge Cache
                        └───────┬────────┘
                                │
                        ┌───────▼────────┐
                        │  API Gateway   │  Auth, Rate Limit, Routing
                        │  Service       │  JWT validation at edge
                        └───┬───┬───┬───┘
              ┌─────────────┘   │   └──────────────┐
              │                 │                  │
    ┌─────────▼──────┐ ┌───────▼───────┐ ┌────────▼────────┐
    │ student-faculty│ │  exam-service  │ │tutorial-service │
    │    service     │ │  (Exam DB)     │ │ (Tutorial DB)   │
    │  (People DB)   │ └───────┬────────┘ └────────┬────────┘
    └─────┬──────────┘         │                   │
          │              ┌─────▼───────────────────▼──────┐
    ┌─────▼──────┐       │         QStash Event Bus        │
    │crm-service │       │  (async cross-service messaging)│
    │(People DB) │       └─────────────────┬───────────────┘
    └────────────┘                         │
    ┌─────────────┐              ┌──────────▼──────────┐
    │  payment-   │              │ notification-service │
    │  service    │              │ Email+SMS+WA+Push    │
    │ (Payment DB)│              └─────────────────────┘
    └─────────────┘
    ┌─────────────┐
    │ placement-  │
    │  service    │
    │(Placement DB│
    └─────────────┘
```

---

## PART 3: Database Architecture

### DB 1 — People DB (Neon) — Shared by Student + Faculty + CRM Services

```
Table Ownership Rules:
  student-faculty-service OWNS:
    users, students, faculty, roles, user_roles,
    batches, batch_enrollments, batch_sessions,
    attendance_records, faculty_batch_assignments

  crm-service OWNS:
    enquiries, enquiry_follow_ups, admissions,
    admission_documents, admission_status_history

  SHARED READ (owned by student-faculty-service, read by crm):
    batches, courses, domains, subjects

  Cross-service writes → NEVER direct SQL →
    Always via QStash event to owning service
```

### DB 2 — Exam DB (Neon) — Owned exclusively by exam-service

```
  domains_ref*, subjects_ref*, topics_ref*, subtopics_ref*
  (* denormalized copies — synced via events, not foreign keys)
  questions, question_options, blueprints,
  exam_sessions, exam_answers, exam_results,
  results_by_dimension, exam_feedback
```

### DB 3 — Tutorial DB (Neon) — Owned exclusively by tutorial-service

```
  domains_ref*, subjects_ref*, topics_ref*, subtopics_ref*
  tutorial_content, tutorial_assignments, tutorial_projects,
  tutorial_progress, tutorial_video_links,
  project_submissions, badges, remediation_triggers,
  student_streaks, certificates
```

### DB 4 — Payment DB (Neon) — Owned exclusively by payment-service

```
  payment_plans, payment_installments, payment_transactions,
  payment_ledger, refunds, scholarships, fee_waivers,
  gateway_webhooks_log, razorpay_orders, stripe_payment_intents
```

### DB 5 — Placement DB (Neon) — Owned exclusively by placement-service

```
  student_profiles, resumes, skills_matrix,
  companies, job_listings, internship_listings,
  applications, interviews, interview_feedback,
  offers, placements, placement_training,
  certifications (post-course, industry-recognized)
```

### Shared Infrastructure (ALL services)

```
Upstash Redis:    Session cache, rate limiting, feature flags,
                  leaderboards, streaks, idempotency keys
Upstash QStash:   Async job queue between ALL services
Upstash Vector:   AI semantic search (tutorial + exam content)
Upstash Workflow: Multi-step durable workflows (payment follow-up,
                  remediation pipeline, placement matching)
Resend:           All transactional email (via notification-service)
Sentry:           Error tracking — one DSN per service
Vercel Analytics: Core Web Vitals per frontend app
```

---

## PART 4: Complete Monorepo Structure

```
platform-root/                          ← pnpm + Turborepo monorepo
│
├── CLAUDE.md                           ← Root AI memory
├── turbo.json                          ← Turborepo pipeline config
├── pnpm-workspace.yaml
├── .mcp.json
│
├── apps/                               ← Deployable applications
│   │
│   ├── student-app/                    ← Next.js (student portal) EXISTING+ENHANCED
│   │   ├── CLAUDE.md
│   │   └── src/app/
│   │       ├── (public)/              ← Landing, explore, pricing
│   │       ├── (auth)/                ← Login, register, forgot-password
│   │       ├── (student)/             ← Dashboard, courses, exams, progress
│   │       │   ├── dashboard/
│   │       │   ├── learn/             ← Links to tutorial-app
│   │       │   ├── exams/             ← Links to exam-app
│   │       │   ├── my-batches/
│   │       │   ├── payments/
│   │       │   ├── certificates/
│   │       │   └── placement/
│   │       └── api/                   ← BFF: aggregates student-faculty
│   │                                      + exam + tutorial + payment
│   │
│   ├── faculty-app/                    ← Next.js (faculty portal) NEW
│   │   ├── CLAUDE.md
│   │   └── src/app/
│   │       ├── (auth)/
│   │       ├── (faculty)/
│   │       │   ├── dashboard/
│   │       │   ├── my-batches/        ← Batch execution management
│   │       │   ├── attendance/        ← Mark attendance per session
│   │       │   ├── students/          ← Students under my batches
│   │       │   ├── assignments/       ← Review via tutorial-service
│   │       │   ├── exams/             ← Set + review via exam-service
│   │       │   ├── content/           ← Create tutorial content
│   │       │   └── reports/           ← Batch performance analytics
│   │       └── api/                   ← BFF: aggregates student-faculty
│   │                                      + exam + tutorial
│   │
│   ├── admin-app/                      ← Next.js (super admin) EXISTING+ENHANCED
│   │   ├── CLAUDE.md
│   │   └── src/app/
│   │       ├── (admin)/
│   │       │   ├── dashboard/         ← Platform-wide metrics
│   │       │   ├── students/          ← All student management
│   │       │   ├── faculty/           ← Faculty onboarding + management
│   │       │   ├── batches/           ← Batch creation + allocation
│   │       │   ├── courses/           ← Course catalog management
│   │       │   ├── payments/          ← Fee management + reports
│   │       │   ├── crm/               ← Enquiry + admission pipeline
│   │       │   ├── content/           ← Tutorial + exam content admin
│   │       │   ├── placement/         ← Placement management
│   │       │   └── settings/          ← Platform configuration
│   │       └── api/                   ← BFF: calls all services
│   │
│   ├── crm-app/                        ← Next.js (CRM portal) NEW
│   │   ├── CLAUDE.md
│   │   └── src/app/
│   │       ├── (crm)/
│   │       │   ├── dashboard/         ← Enquiry funnel metrics
│   │       │   ├── enquiries/         ← All enquiries + pipeline view
│   │       │   ├── follow-ups/        ← Scheduled calls + tasks
│   │       │   ├── admissions/        ← Admission processing
│   │       │   ├── payments/          ← Fee collection + follow-up
│   │       │   └── reports/           ← Conversion analytics
│   │       └── api/                   ← BFF: crm-service + payment-service
│   │
│   └── placement-app/                  ← Next.js (placement portal) NEW
│       ├── CLAUDE.md
│       └── src/app/
│           ├── (student)/             ← Student placement profile
│           ├── (company)/             ← Company HR portal
│           ├── (admin)/               ← Placement admin
│           └── api/                   ← BFF: placement-service
│
├── services/                           ← Backend Hono microservices
│   │
│   ├── api-gateway/                    ← Hono on Cloudflare Workers NEW
│   │   ├── CLAUDE.md
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts            ← JWT verify (jose, edge-compatible)
│   │   │   │   ├── rate-limit.ts      ← Upstash Ratelimit
│   │   │   │   ├── cors.ts
│   │   │   │   └── request-id.ts
│   │   │   ├── routes/
│   │   │   │   ├── student.routes.ts  ← proxy → student-faculty-service
│   │   │   │   ├── exam.routes.ts     ← proxy → exam-service
│   │   │   │   ├── tutorial.routes.ts ← proxy → tutorial-service
│   │   │   │   ├── payment.routes.ts  ← proxy → payment-service
│   │   │   │   ├── crm.routes.ts      ← proxy → crm-service
│   │   │   │   └── placement.routes.ts
│   │   │   └── index.ts
│   │   └── wrangler.toml              ← Cloudflare Workers config
│   │
│   ├── student-faculty-service/        ← Hono on Railway/Fly.io NEW
│   │   ├── CLAUDE.md
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── students/
│   │   │   │   │   ├── student.repository.ts
│   │   │   │   │   ├── student.service.ts
│   │   │   │   │   ├── student.routes.ts
│   │   │   │   │   └── student.types.ts
│   │   │   │   ├── faculty/
│   │   │   │   │   ├── faculty.repository.ts
│   │   │   │   │   ├── faculty.service.ts
│   │   │   │   │   ├── faculty.routes.ts
│   │   │   │   │   └── faculty.types.ts
│   │   │   │   ├── batches/
│   │   │   │   │   ├── batch.repository.ts
│   │   │   │   │   ├── batch.service.ts
│   │   │   │   │   ├── batch.routes.ts
│   │   │   │   │   └── batch-execution.service.ts
│   │   │   │   ├── attendance/
│   │   │   │   │   ├── attendance.repository.ts
│   │   │   │   │   ├── attendance.service.ts
│   │   │   │   │   └── attendance.routes.ts
│   │   │   │   └── events/
│   │   │   │       ├── handlers/      ← QStash event consumers
│   │   │   │       └── publishers/    ← QStash event publishers
│   │   │   ├── lib/
│   │   │   │   ├── db.ts              ← Neon People DB client
│   │   │   │   ├── cache.ts           ← Upstash Redis
│   │   │   │   └── logger.ts          ← Pino structured logging
│   │   │   └── index.ts
│   │   └── drizzle/
│   │       ├── schema.ts              ← People DB schema
│   │       └── migrations/
│   │
│   ├── crm-service/                    ← Hono NEW
│   │   ├── CLAUDE.md
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── enquiry/
│   │   │   │   │   ├── enquiry.repository.ts
│   │   │   │   │   ├── enquiry.service.ts   ← CRM pipeline logic
│   │   │   │   │   ├── enquiry.routes.ts
│   │   │   │   │   └── followup.service.ts  ← QStash scheduled reminders
│   │   │   │   ├── admission/
│   │   │   │   │   ├── admission.service.ts
│   │   │   │   │   └── document.service.ts
│   │   │   │   └── events/
│   │   │   └── lib/
│   │   │       └── db.ts              ← Same Neon People DB (different tables)
│   │   └── drizzle/
│   │       └── schema.ts              ← CRM tables only
│   │
│   ├── payment-service/                ← Hono NEW (MOST SECURITY-CRITICAL)
│   │   ├── CLAUDE.md
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── plans/
│   │   │   │   │   ├── payment-plan.service.ts
│   │   │   │   │   └── installment.service.ts
│   │   │   │   ├── gateways/
│   │   │   │   │   ├── gateway.interface.ts   ← IPaymentGateway
│   │   │   │   │   ├── razorpay.gateway.ts    ← Implements IPaymentGateway
│   │   │   │   │   ├── stripe.gateway.ts      ← Implements IPaymentGateway
│   │   │   │   │   └── manual.gateway.ts      ← Admin offline entry
│   │   │   │   ├── ledger/
│   │   │   │   │   └── ledger.service.ts      ← Immutable financial ledger
│   │   │   │   ├── webhooks/
│   │   │   │   │   ├── razorpay.webhook.ts    ← Verify + process
│   │   │   │   │   └── stripe.webhook.ts
│   │   │   │   └── followup/
│   │   │   │       └── payment-followup.service.ts ← Upstash Workflow
│   │   │   └── lib/
│   │   │       └── db.ts              ← Neon Payment DB (isolated)
│   │   └── drizzle/
│   │       └── schema.ts
│   │
│   ├── exam-service/                   ← EXISTING api-server MIGRATED + enhanced
│   │   ├── CLAUDE.md
│   │   └── src/
│   │       └── modules/               ← All existing exam modules
│   │           └── events/            ← NEW: QStash publishers/consumers
│   │
│   ├── tutorial-service/               ← NEW (from Tutorial Blueprint)
│   │   ├── CLAUDE.md
│   │   └── src/
│   │       └── modules/               ← All tutorial modules from blueprint
│   │           └── events/
│   │
│   ├── notification-service/           ← Hono NEW (pure stateless dispatcher)
│   │   ├── CLAUDE.md
│   │   ├── src/
│   │   │   ├── channels/
│   │   │   │   ├── channel.interface.ts     ← INotificationChannel
│   │   │   │   ├── email.channel.ts         ← Resend
│   │   │   │   ├── sms.channel.ts           ← Twilio / AWS SNS
│   │   │   │   ├── whatsapp.channel.ts      ← Meta Business API
│   │   │   │   └── push.channel.ts          ← Firebase FCM
│   │   │   ├── templates/
│   │   │   │   ├── enquiry-followup.ts
│   │   │   │   ├── payment-reminder.ts
│   │   │   │   ├── exam-result.ts
│   │   │   │   ├── course-completion.ts
│   │   │   │   └── placement-update.ts
│   │   │   ├── dispatcher.service.ts        ← Routes to correct channel(s)
│   │   │   └── events/                      ← QStash consumer only
│   │   └── drizzle/
│   │       └── schema.ts              ← notification_log table only
│   │
│   └── placement-service/              ← Hono NEW
│       ├── CLAUDE.md
│       ├── src/
│       │   ├── modules/
│       │   │   ├── student-profile/
│       │   │   ├── company/
│       │   │   ├── job-listings/
│       │   │   ├── applications/
│       │   │   ├── interviews/
│       │   │   ├── offers/
│       │   │   ├── internships/
│       │   │   ├── training/
│       │   │   └── certification/
│       │   └── events/
│       └── drizzle/
│           └── schema.ts
│
├── packages/                           ← Shared code (no direct deployment)
│   │
│   ├── types/                          ← Shared TypeScript types
│   │   ├── src/
│   │   │   ├── student.types.ts
│   │   │   ├── faculty.types.ts
│   │   │   ├── exam.types.ts
│   │   │   ├── tutorial.types.ts
│   │   │   ├── payment.types.ts
│   │   │   ├── notification.types.ts
│   │   │   ├── events.types.ts        ← QStash event payloads (CRITICAL)
│   │   │   └── api.types.ts           ← Shared API response shapes
│   │   └── package.json
│   │
│   ├── auth/                           ← Shared JWT logic (edge-compatible)
│   │   ├── src/
│   │   │   ├── jwt.ts                 ← sign / verify (jose)
│   │   │   ├── session.ts             ← session helpers
│   │   │   └── permissions.ts         ← RBAC permission matrix
│   │   └── package.json
│   │
│   ├── db-people/                      ← Drizzle client for People DB
│   │   ├── src/
│   │   │   ├── index.ts               ← exports: db, dbReadOnly
│   │   │   ├── schema/
│   │   │   │   ├── users.ts
│   │   │   │   ├── students.ts
│   │   │   │   ├── faculty.ts
│   │   │   │   ├── batches.ts
│   │   │   │   ├── attendance.ts
│   │   │   │   ├── enquiries.ts
│   │   │   │   └── admissions.ts
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   ├── db-exam/                        ← Drizzle client for Exam DB
│   ├── db-tutorial/                    ← Drizzle client for Tutorial DB
│   ├── db-payment/                     ← Drizzle client for Payment DB
│   ├── db-placement/                   ← Drizzle client for Placement DB
│   │
│   ├── events/                         ← QStash event bus abstraction
│   │   ├── src/
│   │   │   ├── publisher.ts           ← publish(eventType, payload)
│   │   │   ├── consumer.ts            ← verify QStash signature + parse
│   │   │   ├── event-types.ts         ← ALL platform event names (enum)
│   │   │   └── schemas/               ← Zod schemas per event type
│   │   └── package.json
│   │
│   ├── ui/                             ← Shared React components EXISTING
│   ├── config/                         ← Shared ESLint, TS, Tailwind configs
│   └── logger/                         ← Pino logger factory (shared)
│
├── docs/
│   ├── blueprints/
│   │   ├── PHASE-1-FOUNDATION.md      ← existing
│   │   ├── PHASE-2-ARCHITECTURAL.md   ← existing
│   │   ├── PHASE-3-RELIANCE.md        ← existing
│   │   ├── PHASE-4-HYPERSCALE.md      ← existing
│   │   ├── PHASE-T-TUTORIAL.md        ← existing (Tutorial Blueprint)
│   │   ├── PHASE-SMS-CORE.md          ← NEW: Student Mgmt System Core
│   │   ├── PHASE-SMS-CRM.md           ← NEW: Enquiry + Admission
│   │   ├── PHASE-SMS-PAYMENT.md       ← NEW: Payment Engine
│   │   ├── PHASE-SMS-BATCH.md         ← NEW: Batch + Attendance
│   │   ├── PHASE-FMS-CORE.md          ← NEW: Faculty Mgmt Core
│   │   ├── PHASE-FMS-EXECUTION.md     ← NEW: Batch Execution + Review
│   │   ├── PHASE-PLS-CORE.md          ← NEW: Placement System
│   │   └── PHASE-INFRA-GATEWAY.md     ← NEW: API Gateway + Events
│   │
│   ├── prompts/                        ← Claude Code prompts per phase
│   │   ├── [existing prompts]
│   │   ├── sms-core.prompt.md
│   │   ├── sms-crm.prompt.md
│   │   ├── sms-payment.prompt.md
│   │   ├── sms-batch.prompt.md
│   │   ├── fms-core.prompt.md
│   │   ├── fms-execution.prompt.md
│   │   ├── pls-core.prompt.md
│   │   └── infra-gateway.prompt.md
│   │
│   ├── reference/
│   │   └── adr/
│   │       ├── ADR-001 to ADR-005     ← existing
│   │       ├── ADR-006-monorepo-strategy.md
│   │       ├── ADR-007-api-gateway-cloudflare.md
│   │       ├── ADR-008-people-db-shared.md
│   │       ├── ADR-009-payment-db-isolated.md
│   │       ├── ADR-010-qstash-event-bus.md
│   │       ├── ADR-011-hono-for-services.md
│   │       ├── ADR-012-razorpay-stripe-abstraction.md
│   │       └── ADR-013-notification-service-stateless.md
│   │
│   └── runbooks/
│       ├── payment-failure-runbook.md
│       ├── exam-day-runbook.md
│       └── service-outage-runbook.md
│
└── .github/
    └── workflows/
        ├── quality.yml                     ← Per-service parallel CI
        ├── deploy-gateway.yml
        ├── deploy-student-faculty.yml
        ├── deploy-exam.yml
        ├── deploy-tutorial.yml
        ├── deploy-payment.yml
        ├── deploy-crm.yml
        ├── deploy-notification.yml
        └── deploy-placement.yml
```

---

## PART 5: The Complete QStash Event Map

This is the nervous system of your platform.
Every cross-service interaction happens through these events.

```
EVENT: student.enrolled
  Publisher:  student-faculty-service (after batch enrollment confirmed)
  Consumers:  → notification-service  (send welcome email + WhatsApp)
              → payment-service       (create payment plan)
              → tutorial-service      (initialize progress records)
              → exam-service          (unlock eligible exams)

EVENT: payment.received
  Publisher:  payment-service (after Razorpay/Stripe webhook confirmed)
  Consumers:  → student-faculty-service (mark installment paid)
              → notification-service   (send receipt email)
              → crm-service            (update admission status)

EVENT: payment.overdue
  Publisher:  payment-service (Upstash Workflow: check daily at 9AM)
  Consumers:  → notification-service  (WhatsApp + SMS + email reminder)
              → crm-service           (create follow-up task for CRM team)

EVENT: exam.completed
  Publisher:  exam-service (after ScoringEngine completes)
  Consumers:  → tutorial-service      (create remediation plan if score < 60%)
              → notification-service  (send result email + PDF)
              → student-faculty-service (update student progress status)
              → placement-service     (update skills matrix)

EVENT: tutorial.subtopic_completed
  Publisher:  tutorial-service
  Consumers:  → exam-service          (unlock linked subtopic exam)
              → student-faculty-service (update completion status)
              → notification-service  (streak milestone alerts)

EVENT: batch.session_scheduled
  Publisher:  student-faculty-service
  Consumers:  → notification-service  (reminder 24h + 1h before to students)
              → faculty-app           (calendar update)

EVENT: attendance.marked
  Publisher:  student-faculty-service (faculty marks attendance)
  Consumers:  → notification-service  (alert parent if absent)
              → crm-service           (flag student if >3 consecutive absences)

EVENT: admission.completed
  Publisher:  crm-service
  Consumers:  → student-faculty-service (create student account + enroll)
              → payment-service        (initialize payment plan)
              → notification-service   (send onboarding email + WhatsApp)

EVENT: project.submitted
  Publisher:  tutorial-service
  Consumers:  → notification-service  (notify assigned faculty reviewer)
              → student-faculty-service (update progress)

EVENT: certificate.issued
  Publisher:  tutorial-service OR exam-service
  Consumers:  → placement-service     (update student placement eligibility)
              → notification-service  (send certificate email with PDF)

EVENT: placement.offer_accepted
  Publisher:  placement-service
  Consumers:  → notification-service  (congratulations to student + parents)
              → student-faculty-service (update student status to 'placed')
              → admin dashboard        (platform placement metrics update)
```

---

## PART 6: RBAC Permission Matrix

```
                        SUPER   FACULTY  STUDENT  PARENT  PLACEMENT
                        ADMIN                             PARTNER
─────────────────────────────────────────────────────────────────────
View all students        ✅      ─        ─        ─       ─
Manage own batch         ✅      ✅        ─        ─       ─
Mark attendance          ✅      ✅        ─        ─       ─
View own attendance      ✅      ✅        ✅        ✅       ─
Create exam              ✅      ✅        ─        ─       ─
Take exam                ─       ─        ✅        ─       ─
View exam results        ✅      ✅*       ✅(own)   ✅(child)─
Create tutorial content  ✅      ✅        ─        ─       ─
View tutorial content    ✅      ✅        ✅        ─       ─
Submit assignments       ─       ─        ✅        ─       ─
Review assignments       ✅      ✅*       ─        ─       ─
Manage payments          ✅      ─        view own  ✅(child)─
Process admission        ✅      ─        ─        ─       ─
Manage enquiries         ✅      ─        ─        ─       ─
Post job listings        ✅      ─        ─        ─       ✅
Apply to jobs            ─       ─        ✅        ─       ─
Review applications      ✅      ─        ─        ─       ✅
Issue certificates       ✅      ─        ─        ─       ─
View placement data      ✅      ─        own only  ─       own posts

* Faculty sees only students in their assigned batches
```

---

## PART 7: Payment Gateway Abstraction Layer

```typescript
// packages/types/src/payment.types.ts

interface IPaymentGateway {
  createOrder(params: CreateOrderParams): Promise<GatewayOrder>
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyResult>
  processRefund(params: RefundParams): Promise<RefundResult>
  getPaymentStatus(gatewayOrderId: string): Promise<PaymentStatus>
}

// Currency routing (automatic):
// INR → Razorpay (UPI + cards + netbanking + EMI)
// USD/EUR/GBP/AED + international → Stripe
// Cash/cheque/bank transfer → ManualGateway (admin entry)

// payment-service auto-selects based on:
// 1. Student's billing country (from profile)
// 2. Currency of payment plan
// 3. Admin override (for manual payments)
```

---

## PART 8: Student Lifecycle State Machine

```
ENQUIRY_RECEIVED
    ↓ (CRM team follows up)
ENQUIRY_QUALIFIED
    ↓ (student attends demo / counselling)
ADMISSION_IN_PROGRESS
    ↓ (documents submitted)
DOCUMENTS_VERIFIED
    ↓ (payment plan created)
PAYMENT_PENDING (first installment)
    ↓ (payment received)
ENROLLED (active student)
    ↓ (batch allocated)
BATCH_ALLOCATED
    ↓ (learning begins)
LEARNING_IN_PROGRESS
    ↓ (all topics + exams completed)
ASSESSMENT_COMPLETE
    ↓ (final exam passed)
CERTIFIED
    ↓ (placement process begins)
PLACEMENT_IN_PROGRESS
    ↓ (offer accepted)
PLACED
    ↓ (post-placement)
ALUMNI

Side states (can occur at any active stage):
  PAYMENT_OVERDUE      → payment missed installment
  ON_LEAVE             → temporary suspension
  DROPPED              → withdrew from course
  DEFERRED             → postponed to next batch
```

---

## PART 9: Faculty Lifecycle State Machine

```
APPLICATION_RECEIVED
    ↓ (admin reviews profile + credentials)
UNDER_EVALUATION
    ↓ (demo class / interview)
DEMO_COMPLETED
    ↓ (approved)
EMPANELLED (approved, not yet assigned)
    ↓ (assigned to batch)
BATCH_ASSIGNED
    ↓ (batch starts)
ACTIVELY_TEACHING
    ↓ (batch ends)
BATCH_COMPLETED
    ↓ (re-assigned or on standby)
ON_STANDBY → BATCH_ASSIGNED (cycle)

Side states:
  ON_LEAVE
  SUSPENDED
  RESIGNED
  BLACKLISTED (with reason + audit trail)
```

---

## PART 10: Communication Channel Strategy

```
Channel         When Used                              Provider
──────────────────────────────────────────────────────────────────
WhatsApp        Enquiry follow-up (highest conversion) Meta Business API
                Fee payment reminders                  (via notification-service)
                Exam result announcements
                Batch start reminders
                Placement offers

Email           Formal communications                  Resend
                Receipts + invoices
                Certificate delivery (PDF attachment)
                Weekly progress reports
                Onboarding sequences

SMS             OTP / verification codes               Twilio / AWS SNS
                Critical alerts (exam in 1 hour)
                Payment confirmation (fallback)

Push            In-app alerts (while app open)         Firebase FCM
Notifications   New assignment posted
                Batch schedule change
                New exam unlocked

Routing Logic:
  CRITICAL (payment overdue, exam result) → ALL channels
  TRANSACTIONAL (receipt, OTP)            → Email + SMS
  ENGAGEMENT (new content, streak)        → Push + WhatsApp
  MARKETING (new course, offer)           → Email + WhatsApp
```

---

## PART 11: Deployment Strategy Per Service

```
Service                  Platform              Reason
──────────────────────────────────────────────────────────────────
api-gateway              Cloudflare Workers    Edge, zero cold start,
                                               global, <1ms latency
student-app              Vercel                Next.js native, ISR, Edge
faculty-app              Vercel                Next.js native
admin-app                Vercel                Next.js native
crm-app                  Vercel                Next.js native
placement-app            Vercel                Next.js native
student-faculty-service  Railway               Always-on Node.js,
                                               no cold start for DB ops
crm-service              Railway               Always-on, CRM workflows
payment-service          Railway               CRITICAL: always-on,
                                               webhook processing
exam-service             Railway               Migrated from Vercel
                                               (avoids cold start on exams)
tutorial-service         Railway               Always-on for streaming AI
notification-service     Railway               Always-on queue consumer
placement-service        Railway               Always-on
```

---

## PART 12: Recommended Implementation Order

```
PREREQUISITE: Complete Phase 2 tasks 62, 56, 95 in existing exam-service

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPRINT 0 — Monorepo Restructure (Week 1-2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  □ Set up Turborepo with existing apps + new service folders
  □ Create packages/types, packages/auth, packages/events
  □ Create packages/db-people, db-exam, db-tutorial,
    db-payment, db-placement (Drizzle clients)
  □ Set up per-service CI/CD workflows
  □ Create all CLAUDE.md files for every service

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPRINT 1 — API Gateway + Auth (Week 3-4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  □ Hono API Gateway on Cloudflare Workers
  □ JWT auth middleware (shared packages/auth)
  □ Rate limiting (Upstash Ratelimit)
  □ Service routing + health checks
  □ packages/events publisher + consumer base

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPRINT 2 — Student & Faculty Service (Week 5-8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  □ People DB schema (all tables)
  □ Student CRUD + enrollment
  □ Faculty CRUD + empanelment
  □ Batch management + allocation
  □ Attendance marking + tracking
  □ faculty-app frontend (basic)
  □ Event: student.enrolled, attendance.marked

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPRINT 3 — CRM Service (Week 9-11)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  □ Enquiry capture + pipeline stages
  □ Follow-up scheduling (Upstash Workflow)
  □ Admission processing + document management
  □ crm-app frontend
  □ Event: admission.completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPRINT 4 — Payment Service (Week 12-15)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  □ Payment DB schema
  □ IPaymentGateway abstraction
  □ Razorpay integration (India)
  □ Stripe integration (international)
  □ Manual payment entry
  □ Installment plans + due date tracking
  □ Payment follow-up Workflow (Upstash)
  □ Webhook handling (both gateways)
  □ Event: payment.received, payment.overdue

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPRINT 5 — Notification Service (Week 16-17)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  □ INotificationChannel abstraction
  □ Email channel (Resend)
  □ WhatsApp channel (Meta Business API)
  □ SMS channel (Twilio)
  □ Push channel (Firebase FCM)
  □ Template engine per notification type
  □ QStash consumer for all inbound events

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPRINT 6 — Exam + Tutorial Services (Week 18-22)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  □ Migrate existing exam-service to new monorepo
  □ Add QStash event publishers to exam-service
  □ Build tutorial-service from Tutorial Blueprint
  □ Wire Exam ↔ Tutorial remediation bridge
  □ tutorial-app frontend

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPRINT 7 — Placement Service (Week 23-26)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  □ Placement DB schema
  □ Student placement profile + resume builder
  □ Company management + job listings
  □ Application + interview workflow
  □ Certification post-course
  □ Internship tracking
  □ placement-app frontend (student + company views)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPRINT 8 — Integration + Hardening (Week 27-30)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  □ End-to-end student lifecycle testing
  □ Load testing all services (k6)
  □ Chaos engineering (kill one service, verify others continue)
  □ Rate limiting validation
  □ Security audit (OWASP Top 10 per service)
  □ Observability stack (Grafana + Prometheus per service)
  □ Runbooks for every service
```

---

## PART 13: CLAUDE.md Template for Every Service

```markdown
# [Service Name] — AI Rules

## Service Identity
- This service OWNS: [list tables]
- This service READS (but does not write): [list tables]
- This service NEVER: directly queries another service's owned tables
- Cross-service writes: ALWAYS via QStash event to packages/events

## Architecture Rules
- Every route handler: withRateLimit → withAuth → withLogging → handler
- Every DB write: wrapped in db.transaction() if multi-step
- Every external call (gateway, AI): wrapped in withTimeout()
- Every cross-service trigger: use packages/events publisher
- Error responses: always { error, code, requestId, timestamp }

## Service-Specific Rules
[Filled per service — e.g., payment-service: "NEVER log full card numbers"]

## Testing Rules
- Unit test coverage: ≥90% for core service classes
- Every QStash event handler: has integration test with mock payload
- Payment service: has test for each gateway success + failure scenario
```

---

*Blueprint Version: 1.0 | Status: Architecture Locked | Ready for Sprint 0*
*All decisions confirmed. No multi-tenancy. B2C direct. BYJU's model. Global.*

