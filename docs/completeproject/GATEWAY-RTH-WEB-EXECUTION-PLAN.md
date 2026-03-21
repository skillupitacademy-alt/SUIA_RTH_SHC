# API Gateway + RealTutorialHub-Web — Execution Plan
## Hono on Cloudflare Workers + realtutorialhub-web frontend
## Source: PHASE-INFRA-GATEWAY.md + ADR-CRITICAL-001

> **API Gateway**: `services/api-gateway/` — Cloudflare Workers
> **RealTutorialHub Web**: `apps/realtutorialhub-web/` — notes.realtutorialhub.com
> **Prerequisite**: SkillHubCore deployed (JWT_SECRET known), tutorial-service deployed

---

## ─── OPENING PROMPT — paste at start of every Gateway/RTH session ───

```
You are a senior implementation agent working in d:\onlinewebsites\quiz-platform

You are building:
  1. API Gateway — Hono on Cloudflare Workers (routes ALL traffic)
  2. apps/realtutorialhub-web — the tutorial/notes frontend at notes.realtutorialhub.com

Architecture:
  Gateway handles: JWT verify at edge, rate limiting, CORS, routing to GCP services
  JWT_SECRET is the SAME secret used by SkillHubCore (shared env var)
  All services receive X-Gateway-Secret header — they MUST verify it

Your scope: services/api-gateway/ + apps/realtutorialhub-web/
Do NOT touch: exam-service, tutorial-service, skillhubcore-service internals

Key facts:
  - Gateway verifies JWT at Cloudflare edge (no DB call — JWT is self-contained)
  - Rate limiting: 100 req/min per IP (Upstash Ratelimit, edge-compatible)
  - All GCP services trust X-Gateway-Secret header to confirm request came through gateway
  - Cold start: < 50ms (Cloudflare Workers — already fast by nature)

Hard rules:
  1. All 1138+ existing tests must stay green
  2. Gateway must NOT break existing api.realtutorialhub.com traffic during migration
  3. Deploy gateway BEFORE updating Cloudflare DNS
  4. Run pnpm typecheck:all and pnpm build:all after every task
```

---

## Phase GW-1 — API Gateway (Cloudflare Workers)

#### GW-1-A-01 · Create `services/api-gateway` scaffold + routing table · `SERVICE` · M

- **File path**: `services/api-gateway/`
- **Runtime**: Hono on Cloudflare Workers (edge — NOT Node.js)

**▶ AI PROMPT**
```
Create services/api-gateway in the monorepo.

Package: @platform/api-gateway
Runtime: Cloudflare Workers (Hono framework, wrangler)
IMPORTANT: Must use ONLY edge-compatible libraries (jose for JWT — no Node crypto)

Structure:
  services/api-gateway/
    CLAUDE.md
    package.json → name: @platform/api-gateway
    wrangler.toml → see config below
    tsconfig.json → target: ES2022, lib: [ES2022]
    src/
      index.ts          → main Hono app
      routes/
        routing-table.ts  → all service routes (see below)
      middleware/
        auth.ts           → JWT verify middleware (jose only)
        rate-limit.ts     → Upstash Ratelimit
        cors.ts           → CORS config
        request-id.ts     → X-Request-ID injection
      lib/
        proxy.ts          → proxyRequest() function

wrangler.toml (from PHASE-INFRA-GATEWAY.md Part 6 — copy exactly):
  name = "platform-api-gateway"
  main = "src/index.ts"
  compatibility_date = "2024-01-01"
  [env.production]
  vars = { ENVIRONMENT = "production" }
  [[env.production.routes]]
  pattern = "api.realtutorialhub.com/*"
  zone_name = "realtutorialhub.com"
  [[env.production.routes]]
  pattern = "api.skillhubcore.in/*"
  zone_name = "skillhubcore.in"

ROUTING TABLE (services/api-gateway/src/routes/routing-table.ts — copy from PHASE-INFRA-GATEWAY.md Part 2 exactly):
  /auth → SKILLHUBCORE_URL (public: true)
  /students → STUDENT_FACULTY_URL (auth: true)
  /faculty → STUDENT_FACULTY_URL (auth: true)
  /batches → STUDENT_FACULTY_URL (auth: true)
  /attendance → STUDENT_FACULTY_URL (auth: true)
  /exam → EXAM_SERVICE_URL (auth: true)
  /questions → EXAM_SERVICE_URL (auth: true)
  /tutorial → TUTORIAL_SERVICE_URL (auth: true)
  /ai-tutor → TUTORIAL_SERVICE_URL (auth: true)
  /payments → PAYMENT_SERVICE_URL (auth: true)
  /webhooks → PAYMENT_SERVICE_URL (public: true)
  /crm → CRM_SERVICE_URL (auth: true)
  /enquiries → CRM_SERVICE_URL (public: true)
  /notifications → NOTIFICATION_URL (auth: true)
  /placement → PLACEMENT_URL (auth: true)
  /jobs → PLACEMENT_URL (public: true)
  /admin → ADMIN_URL (auth: true, requireRole: 'admin')

Add to turbo.json and pnpm-workspace.yaml.
Run pnpm typecheck:all → zero errors.
```

---

#### GW-1-A-02 · Implement complete gateway (copy from PHASE-INFRA-GATEWAY.md) · `SERVICE` · M

**▶ AI PROMPT**
```
Implement the complete API Gateway in services/api-gateway/src/index.ts

Copy the implementation from PHASE-INFRA-GATEWAY.md Part 3 EXACTLY — do not modify it.

The implementation includes:
  - cors() middleware with exact allowed origins list
  - X-Request-ID injection middleware
  - Rate limiting middleware (Upstash Ratelimit, slidingWindow 100 per 1 minute)
  - verifyJWT() function using jose (edge-compatible)
  - proxyRequest() function that:
      → Verifies JWT if route requires auth
      → Checks role if requireRole set
      → Forwards request to upstream with headers:
          X-Request-ID
          X-Gateway-Secret (from env — services verify this)
          X-User-ID (from JWT payload)
  - Route registration loop from routing-table.ts
  - GET /healthz → { status: 'ok', ts: Date.now() }

Environment variables (set in wrangler.toml secrets and Cloudflare dashboard):
  JWT_SECRET              → same value as SkillHubCore JWT_SECRET
  INTERNAL_GATEWAY_SECRET → random 32-char string shared with all GCP services
  UPSTASH_REDIS_URL
  UPSTASH_REDIS_TOKEN
  SKILLHUBCORE_URL        → GCP Cloud Run URL for skillhubcore-service
  EXAM_SERVICE_URL        → GCP Cloud Run URL for exam-service
  TUTORIAL_SERVICE_URL    → GCP Cloud Run URL for tutorial-service
  STUDENT_FACULTY_URL     → GCP Cloud Run URL for student-faculty-service
  PAYMENT_SERVICE_URL     → GCP Cloud Run URL for payment-service
  PLACEMENT_URL           → GCP Cloud Run URL for placement-service
  NOTIFICATION_URL        → GCP Cloud Run URL for notification-service

Also update ALL existing GCP services to verify X-Gateway-Secret header:
  Add middleware to exam-service: if X-Gateway-Secret !== INTERNAL_GATEWAY_SECRET → 403
  (This ensures no one can call GCP services directly, bypassing the gateway)

Run: npx wrangler dev → verify /healthz returns 200 locally.
```

---

#### GW-1-A-03 · Deploy gateway + update Cloudflare DNS · `INFRA` · M

**▶ AI PROMPT**
```
Deploy API Gateway to Cloudflare Workers and update DNS.

1. Create .github/workflows/deploy-gateway.yml:
   Trigger: push to main, paths: services/api-gateway/**
   Steps:
     - Checkout, pnpm install
     - Run: npx wrangler deploy --env production
       with secrets: JWT_SECRET, INTERNAL_GATEWAY_SECRET, all service URLs
     - Smoke test: curl https://api.realtutorialhub.com/healthz → 200

2. Cloudflare DNS updates (IMPORTANT — do in this order):
   STEP A: Deploy gateway first and verify it works via wrangler URL
   STEP B: Test /healthz on the workers.dev URL
   STEP C: Only then update DNS:
     api.realtutorialhub.com → Cloudflare Worker (NOT GCP directly)
     api.skillhubcore.in     → Cloudflare Worker (NOT GCP directly)
   STEP D: Verify existing exam flow still works after DNS change

3. Add to README.md — Gateway deployment runbook:
   How to add a new service route
   How to rotate INTERNAL_GATEWAY_SECRET
   How to roll back gateway deployment

Verification:
  □ GET https://api.realtutorialhub.com/healthz → 200
  □ POST https://api.realtutorialhub.com/auth/login → proxied to skillhubcore
  □ GET https://api.realtutorialhub.com/exam → requires auth (401 without token)
  □ Rate limit: 101st request in 1 minute → 429
  □ JWT from SkillHubCore accepted by gateway
  □ Existing exam engine tests still pass
```

---

## Phase RTH-1 — RealTutorialHub Web App (notes.realtutorialhub.com)

#### RTH-1-A-01 · Create `apps/realtutorialhub-web` scaffold · `FRONTEND` · M

- **File path**: `apps/realtutorialhub-web/`
- **Domain**: `notes.realtutorialhub.com`

**▶ AI PROMPT**
```
Create apps/realtutorialhub-web — the RealTutorialHub learning portal.

Package: @platform/realtutorialhub-web
Tech: Next.js 15, App Router, Tailwind CSS
Domain: notes.realtutorialhub.com

IMPORTANT: Match the existing web-app (realtutorialhub-quiz) design language EXACTLY.
Same Tailwind config, same font, same color palette, same component patterns.

Directory structure:
  apps/realtutorialhub-web/
    CLAUDE.md
    package.json
    next.config.ts
    tailwind.config.ts   → extend packages/ui tailwind config
    tsconfig.json
    src/
      app/
        (public)/
          page.tsx         → Landing: "Learn with AI"
          explore/page.tsx → Browse domains/subjects/topics
        (auth)/
          login/page.tsx
          register/page.tsx
        (student)/
          dashboard/page.tsx
          learn/
            [domain]/
              page.tsx                              → Subject list
              [subject]/page.tsx                    → Topic list
              [subject]/[topic]/page.tsx            → Subtopic list
              [subject]/[topic]/[subtopic]/page.tsx → MAIN LEARNING PAGE
          progress/page.tsx   → My progress across all domains
          assignments/page.tsx → My assignments
          my-plan/page.tsx    → Remediation plan (weak areas)
        api/                  → BFF routes proxying to tutorial-service
          tutorial/route.ts
          progress/route.ts
          ai-tutor/route.ts
      components/
        blocks/              → 6 content block components (from TUTORIAL-ENGINE-EXECUTION-PLAN T2-A-01)
          NotesBlock.tsx
          LaymanBlock.tsx
          RealLifeBlock.tsx
          TechnicalBlock.tsx
          CodeBlock.tsx
          AITutorBlock.tsx
        layout/
          Sidebar.tsx        → Domain/Subject/Topic navigation tree
          ProgressBar.tsx    → Subtopic completion indicator
          BlockNav.tsx       → Jump between 6 blocks within a subtopic

Add to turbo.json. Run pnpm typecheck:all and pnpm build:all → pass.
```

---

#### RTH-1-A-02 · Subtopic learning page (main page) · `FRONTEND` · L ⚠ USER-GATED

- **File path**: `apps/realtutorialhub-web/src/app/(student)/learn/[domain]/[subject]/[topic]/[subtopic]/page.tsx`
- **Reference**: `tutorial-subtopic-page_prompt.md` (uploaded MD file)

**▶ AI PROMPT**
```
Implement the main subtopic learning page in apps/realtutorialhub-web.

Path: src/app/(student)/learn/[domain]/[subject]/[topic]/[subtopic]/page.tsx

This is the MOST IMPORTANT page in RealTutorialHub — where students actually learn.

Layout (from tutorial-subtopic-page_prompt.md — follow exactly):
  Left sidebar (collapsible): domain → subject → topic → subtopic navigation tree
    → Shows completion indicators (✓ green, ○ not started, ▶ current)

  Main content area:
    Header: Subtopic name + difficulty badge + completion % 
    Block tabs: [Notes] [Layman] [Real-Life] [Technical] [Code] [AI Tutor]
    → Default tab: Layman (NEVER start with Technical)
    → Each tab shows the corresponding Block component
    → Tab has ✓ indicator when student has visited it

    Block navigation arrows: ← Previous block | Next block →
    Progress bar: 0% → 100% as blocks completed

  Right panel (collapsible): Assignments
    → Tier 1 (MCQ), Tier 2 (Short answer), Tier 3 (Project), Tier 4 (Capstone)
    → Locked until previous tier completed

Data fetching:
  GET /api/tutorial/content/{subtopicId}?difficulty=simple
    → Returns { notes, layman, real_life, technical, code, ai_tutor }
  GET /api/tutorial/progress/{userId}/subtopic/{subtopicId}
    → Returns { completedBlocks: ['layman','real_life'], percentage: 33 }

On block view (user stays > 10 seconds):
  POST /api/tutorial/progress/mark-block-viewed
  Body: { subtopicId, blockType, timeSpentSeconds }

Block components (import from components/blocks/):
  NotesBlock → renders markdown with @tailwindcss/typography
  LaymanBlock → card with: 💡 Simple Explanation, 📦 Analogy, 📊 Example 1, 📊 Example 2
  RealLifeBlock → scenario card with highlighted border
  TechnicalBlock → deep-dive card with 'Technical' badge
  CodeBlock → syntax highlighted (shiki), copy button, language label
  AITutorBlock → chat UI with pre-loaded qa_pairs + input for new questions

Mobile responsive: sidebar collapses to hamburger menu.
Accessibility: keyboard nav between tabs (left/right arrows), ARIA labels.
```

---

#### RTH-1-A-03 · AI Tutor chat integration · `FRONTEND` · M

**▶ AI PROMPT**
```
Wire up the AI Tutor chat in AITutorBlock.tsx.

AI Tutor UX:
  - Shows 3-5 pre-loaded Q&A pairs from content.ai_tutor.qa_pairs
  - Below: text input "Ask a question about [subtopic name]..."
  - On submit: POST /api/ai-tutor/ask
    Body: { subtopicId, question, conversationHistory: [{role, content}] }
    → Streams response (use ReadableStream / EventSource)
  - Shows typing indicator (3 dots animation) while waiting
  - Appends answer below question
  - Rate limit feedback: if 429 → show "You've used 10 questions this hour. Come back later."

API route (BFF): apps/realtutorialhub-web/src/app/api/ai-tutor/ask/route.ts
  → Proxy to: api.realtutorialhub.com/ai-tutor/ask (which routes to tutorial-service)
  → Forward Authorization header

Conversation history: useState — NOT persisted (cleared on page refresh)

Error states:
  - Network error: "Unable to connect to AI Tutor. Try again."
  - Rate limited: "Limit reached. Upgrade for unlimited AI Tutor access."
  - Feature not in subscription: "Upgrade to access AI Tutor."
```

---

#### RTH-1-A-04 · Deploy `realtutorialhub-web` to GCP · `INFRA` · M

**▶ AI PROMPT**
```
Deploy apps/realtutorialhub-web to GCP Cloud Run.

1. Add Dockerfile to apps/realtutorialhub-web/
   Multi-stage Next.js build (same pattern as existing apps/web-app Dockerfile)
   EXPOSE 3000

2. Create .github/workflows/deploy-realtutorialhub-web.yml
   Trigger: push to main, paths: apps/realtutorialhub-web/** or packages/ui/**
   Steps:
     - Build Docker image
     - Push to GCP Artifact Registry
     - Deploy to Cloud Run: realtutorialhub-web, region asia-south1
     - Smoke test: curl output URL /healthz → 200

3. Update Cloudflare DNS:
   notes.realtutorialhub.com → CNAME → Cloud Run URL

4. Add GET /healthz route to Next.js app:
   src/app/api/healthz/route.ts → returns { status: 'ok' }

Environment variables needed in GCP Secret Manager:
  NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com
  NEXT_PUBLIC_SKILLHUBCORE_URL=https://api.skillhubcore.in

Verification:
  □ notes.realtutorialhub.com loads
  □ Login with SkillHubCore JWT works
  □ Subtopic learning page shows all 6 blocks
  □ AI Tutor responds to questions
  □ Progress marked when blocks viewed
```

---

### Final Deep Audit — Gateway + RTH-Web COMPLETE
```
□ GET https://api.realtutorialhub.com/healthz → 200 (Cloudflare Worker)
□ JWT from SkillHubCore accepted at gateway
□ Rate limit: 101 requests/min → 429
□ Direct GCP URL returns 403 (gateway secret check working)
□ notes.realtutorialhub.com loads subtopic learning page
□ All 6 content blocks render correctly
□ AI Tutor chat works (rate limited at 10/hour)
□ Block progress saved to tutorial-service
□ SkillUp student can access notes.realtutorialhub.com (cross-platform JWT)
□ pnpm typecheck:all → zero errors
□ pnpm test → all 1138+ tests pass
```
