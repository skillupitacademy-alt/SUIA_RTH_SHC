# Integration Architecture Decision
## Exam Engine + Tutorial Engine + 3-Platform Ecosystem

> ADR-CRITICAL-001 | Status: FINAL RECOMMENDATION
> Context: RealTutorialHub + SkillUp IT Academy + SkillHubCore
> Deployment: GCP ($300 credit) + OCI (permanent free tier) + Neon Postgres

---

## THE QUESTION YOU ASKED

```
Option A: Integrate Tutorial into Exam Engine — common database, common monorepo
Option B: Common monorepo, different databases
Option C: 2 separate monorepos, 2 different databases
```

## THE ANSWER (Long-Term, Scalable, Performance-First)

```
✅ OPTION B — One Turborepo monorepo + Separate databases per service

This is the correct answer. Here is exactly why.
```

---

## PART 1: Why NOT Option A (Common Database)

```
Exam Engine DB has:
  questions, blueprints, exam_sessions, exam_answers,
  exam_results, results_by_dimension

Tutorial Engine DB needs:
  tutorial_content, assignments, projects, progress,
  video_links, badges, remediation_triggers

If you merge them into ONE database:

Problem 1 — SCALING CONFLICT
  Exam day: 10,000 students start exams simultaneously at 10:00 AM
  → Massive write load on exam_sessions + exam_answers tables
  → Tutorial content reads (notes.realtutorialhub.com) compete
    for the same connection pool
  → Result: exam submissions slow down because tutorial readers
    are consuming connections
  → On exam day, this is catastrophic

Problem 2 — DEPLOYMENT COUPLING
  You want to update tutorial content (fix a typo in notes)?
  → Must deploy the entire exam engine
  → Risk of breaking exam sessions during deployment
  → One migration failure = both systems down

Problem 3 — LOAD TEST RESULTS MISLEADING
  Your k6 T130–T134 tests will show false results
  → Cannot distinguish exam load from tutorial load
  → Cannot identify which system is the bottleneck
  → OCI free tier k6 results will be unreliable

Problem 4 — NEON CONNECTION LIMITS
  You are on Neon (serverless Postgres)
  Neon pooled connections: up to 10,000 concurrent
  But if exam + tutorial share one DB:
  → Tutorial idle readers hold connections during exam rush
  → Exam writers cannot get connections fast enough
  → Students see "exam submission failed"

VERDICT: Option A is dangerous for your use case.
Never share a database between exam-time write-heavy
and tutorial-time read-heavy workloads.
```

---

## PART 2: Why NOT Option C (Separate Monorepos)

```
If you have 2 separate GitHub repos:

Problem 1 — TYPE DRIFT
  The Domain → Subject → Topic → Subtopic hierarchy
  is shared between BOTH engines.
  In separate repos, this type drifts over time:
  → Exam Engine calls it "subtopicId: string"
  → Tutorial Engine calls it "subTopicId: UUID"
  → Cross-service events fail silently
  → Debugging takes days

Problem 2 — SHARED PACKAGE HELL
  You have packages/ui, packages/types, packages/auth
  In separate repos, you need to:
  → Publish to npm (private registry costs money)
  → OR use git submodules (nightmare to manage)
  → OR copy-paste code (duplicates + drift)
  All 3 options are painful at scale

Problem 3 — CI/CD COMPLEXITY
  2 separate repos = 2 separate GitHub Actions pipelines
  → Breaking change in shared types = must update both repos separately
  → No atomic commits across both systems
  → "Works in exam repo, broken in tutorial repo" — happens constantly

Problem 4 — HARDER FOR SMALL TEAM
  You are not Google with 100 engineers per repo
  Separate repos require more coordination overhead than the
  complexity savings they provide at your current team size

VERDICT: Option C is operationally correct at Google-scale
but actively harmful for a small team building to scale.
```

---

## PART 3: Why Option B is Correct (One Monorepo + Separate DBs)

```
One Turborepo monorepo gives you:
  ✅ Shared types (no drift between Exam and Tutorial)
  ✅ Shared packages (auth, events, ui, logger — one source of truth)
  ✅ Atomic commits across both engines
  ✅ One GitHub Actions CI pipeline
  ✅ One CLAUDE.md root (AI knows the whole system)

Separate databases give you:
  ✅ Exam DB connection pool dedicated to exam-time load
  ✅ Tutorial DB connection pool dedicated to read-heavy content
  ✅ k6 load tests measure each system independently
  ✅ Deploy Tutorial updates without touching Exam Engine
  ✅ Scale Neon compute independently per database
  ✅ Exam DB can go to Neon Scale plan; Tutorial DB stays on free tier
```

---

## PART 4: The Exact Architecture for Your 3-Platform System

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ONE TURBOREPO MONOREPO                           │
│                    (github.com/yourorg/platform)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  apps/                                                              │
│  ├── realtutorialhub-web/      ← notes.realtutorialhub.com         │
│  ├── realtutorialhub-quiz/     ← quiz.realtutorialhub.com          │
│  ├── realtutorialhub-admin/    ← admin.realtutorialhub.com         │
│  ├── skillup-web/              ← app.skillupitacademy.com          │
│  ├── skillup-admin/            ← admin.skillupitacademy.com        │
│  └── skillhubcore-admin/       ← admin.skillhubcore.in             │
│                                                                     │
│  services/                                                          │
│  ├── exam-service/             ← YOUR EXISTING api-server          │
│  ├── tutorial-service/         ← NEW (from Tutorial Blueprint)     │
│  ├── skillhubcore-service/     ← NEW (SSO + subscriptions)         │
│  ├── skillup-service/          ← NEW (CRM + batches + placement)   │
│  ├── notification-service/     ← NEW (Email + WhatsApp + SMS)      │
│  └── payment-service/          ← NEW (Razorpay + Stripe)           │
│                                                                     │
│  packages/                                                          │
│  ├── types/                    ← ALL shared TypeScript types       │
│  ├── auth/                     ← JWT + SSO (shared across all)     │
│  ├── events/                   ← QStash event bus (shared)         │
│  ├── db-exam/                  ← Drizzle client → Exam DB          │
│  ├── db-tutorial/              ← Drizzle client → Tutorial DB      │
│  ├── db-people/                ← Drizzle client → People DB        │
│  ├── db-payment/               ← Drizzle client → Payment DB       │
│  ├── ui/                       ← Shared React components           │
│  └── logger/                   ← Pino (shared across all services) │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PART 5: The 5 Databases (Neon — Separate Instances)

```
DB 1: exam-db         (Neon)
      Owner: exam-service ONLY
      Tables: questions, blueprints, exam_sessions,
              exam_answers, exam_results, results_by_dimension
      Scale plan: Neon Pro (scales on exam day)
      Connection: DATABASE_EXAM_URL in exam-service only

DB 2: tutorial-db     (Neon)
      Owner: tutorial-service ONLY
      Tables: tutorial_content, assignments, projects,
              tutorial_progress, badges, remediation_triggers
      Scale plan: Neon Free → Scale when needed
      Connection: DATABASE_TUTORIAL_URL in tutorial-service only

DB 3: people-db       (Neon)
      Owner: skillhubcore-service + skillup-service
      Tables: users, students, faculty, roles,
              batches, attendance, enrollments
              (Exam + Tutorial reference userId but NEVER join here)
      Connection: DATABASE_PEOPLE_URL

DB 4: payment-db      (Neon)
      Owner: payment-service ONLY
      Tables: payment_plans, installments, ledger,
              razorpay_orders, stripe_intents, refunds
      MOST ISOLATED: financial data never shared

DB 5: skillup-db      (Neon)
      Owner: skillup-service ONLY
      Tables: enquiries, admissions, batches,
              attendance, certifications, placements

Cross-DB "joins" happen via:
  → QStash events (async, eventual consistency)
  → API calls between services (sync, rare)
  → NEVER via SQL JOIN across databases
```

---

## PART 6: How Exam Engine + Tutorial Engine Connect

```
The ONLY connection between Exam DB and Tutorial DB
is via QStash events. No shared tables. No foreign keys.
No direct SQL across databases.

EVENT FLOW (The Remediation Bridge):

Student completes exam
      ↓
exam-service: ScoringEngine calculates results
      ↓
exam-service: Identifies weak subtopics (score < 60%)
      ↓
exam-service PUBLISHES QStash event:
  {
    type: "exam.completed",
    payload: {
      userId: "uuid",
      examResultId: "uuid",
      weakSubtopicIds: ["uuid1", "uuid2"],
      scores: { subtopic1: 45, subtopic2: 38 }
    }
  }
      ↓
tutorial-service CONSUMES event:
  → Creates remediation_triggers record in Tutorial DB
  → Generates personalized study plan
  → Queues Upstash Vector semantic match
      ↓
notification-service CONSUMES event:
  → Sends "Study these topics" email via Resend
  → Sends WhatsApp reminder

SHARED DATA BETWEEN EXAM AND TUTORIAL:
  userId          → string (no DB join needed — just a reference)
  subtopicId      → string (same UUID, both systems know it)
  domainId        → string (same UUID, denormalized in both DBs)

  Both databases store a COPY of the hierarchy
  (domains_ref, subjects_ref, topics_ref, subtopics_ref)
  These are synced via events when admin updates hierarchy
  NOT via shared DB tables or foreign keys
```

---

## PART 7: Deployment on GCP + OCI (Your Specific Setup)

```
YOUR CURRENT DEPLOYMENT:
  GCP: $300 free credit (3 months) → exam-service + tutorial-service
  OCI: Permanent free tier → k6 load testing (T130–T134)

RECOMMENDED SERVICE DISTRIBUTION:

GCP (use $300 credit wisely — 3 months):
  ├── exam-service         → Cloud Run (serverless, scales to 0)
  ├── tutorial-service     → Cloud Run (serverless)
  ├── notification-service → Cloud Run (serverless, event-driven)
  └── api-gateway          → Cloud Run or Cloud Endpoints

OCI (permanent free — use for always-on):
  ├── k6 load testing      → OCI Compute (2 AMD OCPU + 12GB RAM free)
  ├── Grafana + Prometheus  → OCI Compute (monitoring dashboard)
  └── Future: skillup-service (after GCP credit expires)

Neon Postgres: All 5 databases (free tier initially)
Upstash:       Redis + QStash + Vector (free tier)
Vercel:        Frontend apps ONLY (realtutorialhub-web, quiz, admin)
Cloudflare:    DNS + WAF + CDN (free tier)

WHY CLOUD RUN FOR BACKEND SERVICES ON GCP:
  → Pay per request (not per hour) — $300 lasts longer
  → Scales to 0 when no traffic (saves credits)
  → Scales to 1000+ instances on exam day automatically
  → No cold start for exam-service (keep min-instances: 1)
  → Tutorial-service can scale to 0 (content reads are cached)
```

---

## PART 8: k6 Load Test Strategy (T130–T134) — Before Tutorial Integration

```
YOU SAID: ExamEngine tasks T130–T134 (k6 load tests) are next.
          All other tasks before T130 are done.

CRITICAL: Run k6 tests on exam-service BEFORE integrating Tutorial Engine.
This gives you a clean baseline of exam performance WITHOUT tutorial load.

T130 — Baseline Load Test (OCI k6 → GCP exam-service)
  Target: 100 concurrent exam sessions
  Metrics to capture:
    - p95 latency for exam submission: target < 300ms
    - p95 latency for exam start: target < 500ms
    - Connection pool utilization on exam-db
    - Error rate: target < 0.1%

T131 — Stress Test (find breaking point)
  Ramp from 100 → 1000 → 5000 concurrent users
  Find the exact number where p95 > 1000ms
  This is your current capacity ceiling

T132 — Spike Test (exam day simulation)
  0 users → 10,000 users in 60 seconds (everyone starts at 10:00 AM)
  This is the most realistic exam day scenario
  Watch for: connection pool exhaustion, QStash queue backup

T133 — Soak Test (endurance — 2 hours)
  500 concurrent users for 2 hours
  Watch for: memory leaks, connection pool drift, Redis TTL issues

T134 — Post-optimization re-test
  After fixing issues found in T130–T133
  Verify improvements are real

RUN ALL TESTS FROM OCI:
  OCI has 2 AMD OCPU + 12GB RAM on free tier
  k6 can generate 10,000+ virtual users from this machine
  OCI → GCP tests measure real network latency (not localhost)

AFTER T130–T134 PASS:
  → THEN integrate tutorial-service into monorepo
  → Run T130–T134 AGAIN with both services running
  → Confirm exam performance is NOT degraded by tutorial service
  → This proves your separate-DB decision was correct
```

---

## PART 9: The RealTutorialHub + SkillHubCore Integration Plan

```
SkillHubCore is the Platform Brain.
It provides SSO across all 3 platforms.

HOW SSO WORKS ACROSS YOUR 3 PLATFORMS:

1. User registers at realtutorialhub.com
   → skillhubcore-service creates identity record
   → Issues JWT with platform claims:
     {
       userId: "uuid",
       platforms: ["realtutorialhub"],
       subscriptionTier: "free",
       iat: ..., exp: ...
     }

2. Same user logs into skillupitacademy.com
   → skillhubcore-service validates JWT
   → Adds "skillup" to platforms claim
   → Issues new JWT with both platforms

3. Either platform validates JWT:
   → Checks: does platforms[] include "realtutorialhub"?
   → Checks: subscriptionTier for feature access
   → NO database call needed (JWT is self-contained)

4. SkillUp faculty monitors student progress:
   → skillup-service calls tutorial-service API:
     GET /api/students/{userId}/progress
   → tutorial-service returns progress from Tutorial DB
   → No direct DB access from SkillUp to Tutorial DB

SkillHubCore DB tables:
  users (identity — source of truth for userId)
  subscriptions (free/premium/combo/training)
  platform_access (which platforms user can access)
  sso_sessions (refresh token management)
```

---

## PART 10: Migration Path (Your Existing Exam Engine → New Architecture)

```
You have an existing working exam engine on GCP/Vercel.
Do NOT rewrite it. Migrate incrementally.

STEP 1 (This week): Turborepo scaffold
  Create new monorepo structure
  Move existing quiz-platform into:
    services/exam-service/ (copy, not rewrite)
    packages/db-exam/ (extract existing Drizzle schema)
  Verify: existing tests still pass (748 tests)
  Verify: existing deployment still works

STEP 2 (Next 2 weeks): Run k6 T130–T134
  Test exam-service in isolation on GCP
  Get your performance baseline numbers
  Fix any issues found

STEP 3 (After k6 passes): Add tutorial-service
  Create services/tutorial-service/ in same monorepo
  Create packages/db-tutorial/ (Tutorial DB schema)
  Neon: create second database instance (tutorial-db)
  Connect exam-service → tutorial-service via QStash events
  Test remediation bridge end-to-end

STEP 4: Add SkillHubCore
  Create services/skillhubcore-service/
  Create packages/db-people/ (People DB schema)
  Implement SSO JWT across platforms
  Connect RealTutorialHub login to SkillHubCore

STEP 5: Add SkillUp
  Create services/skillup-service/
  Create apps/skillup-web/ and apps/skillup-admin/
  Connect to People DB + Payment DB

NEVER DO THIS:
  ❌ Merge exam-db and tutorial-db at any point
  ❌ Add tutorial tables to existing exam schema
  ❌ Create foreign keys from tutorial_progress to exam_results
     (use QStash event reference instead)
```

---

## PART 11: Cost Projection (Free Tiers + GCP Credit)

```
SERVICE               PROVIDER        COST
─────────────────────────────────────────────────────────
exam-service          GCP Cloud Run   ~$20-40/month
tutorial-service      GCP Cloud Run   ~$10-20/month
api-gateway           Cloudflare      FREE
All 5 databases       Neon            FREE (0.5 GB/db)
Redis + QStash        Upstash         FREE (10K msgs/day)
k6 load testing       OCI             FREE (permanent)
Grafana + monitoring  OCI             FREE (permanent)
Frontend apps         Vercel Hobby    FREE (3 apps)
CDN + DNS + WAF       Cloudflare      FREE
Email (Resend)        Resend          FREE (3K/month)

GCP $300 CREDIT LASTS:
  At ~$40-60/month → 5-7 months
  After credit: move to OCI (always-on free) or Railway
  OCI free: 2 AMD OCPUs + 12GB RAM = runs 2-3 small services

TOTAL MONTHLY COST AFTER GCP CREDIT:
  If on OCI: ~$0/month (OCI free always-on)
  If on Railway: ~$20-40/month
  Neon, Upstash, Cloudflare, Vercel: $0
```

---

## FINAL DECISION SUMMARY

```
QUESTION: How to integrate Tutorial Engine with Exam Engine?

ANSWER:
  ✅ ONE Turborepo monorepo (shared types, shared packages, one CI/CD)
  ✅ SEPARATE Neon databases (exam-db ≠ tutorial-db — never merge)
  ✅ QStash events as the ONLY bridge between the two services
  ✅ userId and subtopicId are the ONLY shared references (strings, no joins)

FOR YOUR 3-PLATFORM ECOSYSTEM:
  ✅ RealTutorialHub  = exam-service + tutorial-service + frontend apps
  ✅ SkillUp          = skillup-service + skillup-web
  ✅ SkillHubCore     = skillhubcore-service (SSO + subscriptions)
  ✅ All 3 platforms  = one monorepo, one Cloudflare, one Upstash account

FOR GCP + OCI DEPLOYMENT:
  ✅ Run k6 T130–T134 on OCI → GCP NOW (before Tutorial integration)
  ✅ Get your exam baseline, then add Tutorial Engine
  ✅ Run k6 again after integration to prove no degradation

THE RULE TO NEVER BREAK:
  "Exam DB and Tutorial DB are owned by their respective services.
   They communicate only via QStash events.
   No shared tables. No cross-DB foreign keys. Ever."
```

---

*Decision Version: 1.0 | FINAL — No revision needed*
*Applies to: RealTutorialHub + SkillUp IT Academy + SkillHubCore*
