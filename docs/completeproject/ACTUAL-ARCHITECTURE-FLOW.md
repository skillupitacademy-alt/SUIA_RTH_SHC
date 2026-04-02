# Actual Architecture Flow (Verified from Code)

> [!IMPORTANT]
> Historical architecture note: this file captures an older flow model and still references retired student hosts.
> Current production truth lives in `.kiro/DEPLOYMENT_STATUS_MATRIX.md`.
> Treat `user.realtutorialhub.com`, `user.skillupitacademy.com`, `tutorial.skillhubcore.in`, `quiz.skillhubcore.in`, and `placement.skillhubcore.in` as the active public host map unless this file explicitly says otherwise.

> Based on codebase inspection
> Generated: 2026-03-29

---

## ❌ Your Flowchart is INCORRECT

The flowchart you showed is **NOT** what you're actually doing. Here's what's really happening:

---

## ✅ ACTUAL Architecture (What Your Code Does)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├──────────────────────────────────┐
                              │                                  │
                              ▼                                  ▼
┌──────────────────────────────────────┐    ┌──────────────────────────────────┐
│  notes.realtutorialhub.com           │    │  app.skillupitacademy.com        │
│  (realtutorialhub-web)               │    │  (skillup-web)                   │
│                                      │    │                                  │
│  ┌────────────────────────────────┐  │    │  ┌────────────────────────────┐  │
│  │ /app/api/* (BFF Routes)        │  │    │  │ /app/api/* (BFF Routes)    │  │
│  │ - Calls api-server directly    │  │    │  │ - Calls people_prod DB     │  │
│  │ - OR queries tutorial_prod DB  │  │    │  │ - Calls api-server         │  │
│  └────────────────────────────────┘  │    │  └────────────────────────────┘  │
└──────────────────────────────────────┘    └──────────────────────────────────┘
                │                                          │
                │ fetch('/api/tutorial/...')               │ fetch('/api/student/...')
                │ OR direct DB query                       │ OR direct DB query
                ▼                                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    api-server (Cloud Run)                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Tutorial     │  │ Exam         │  │ Payment      │            │
│  │ Module       │  │ Module       │  │ Module       │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└──────────────────────────────────────────────────────────────────┘
                │                │                │
                ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ tutorial_    │  │ quiz_        │  │ payment_     │  │ people_      │
│ prod         │  │ platform_    │  │ prod         │  │ prod         │
│              │  │ prod         │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Key Differences from Your Flowchart

### ❌ What You Showed (WRONG)
```
User → Frontend → Gateway → Auth Service → api-server → DB
```

### ✅ What Actually Happens (CORRECT)
```
User → Frontend (with BFF routes) → api-server OR direct DB → DB
```

---

## Detailed Flow Breakdown

### Flow 1: RTH Tutorial App (notes.realtutorialhub.com)

**Pattern**: BFF (Backend-for-Frontend) with fallback

```typescript
// apps/realtutorialhub-web/src/lib/tutorial-content-api.ts

1. User visits /learn/javascript/promises/async-await
2. Server-side component calls getTutorialContentBySubtopicId()
3. First tries: fetch(`${NEXT_PUBLIC_API_URL}/tutorial/content/${subtopicId}`)
   → Calls api-server if available
4. If fails: Direct DB query via TutorialContentRepository
   → Queries tutorial_prod directly
5. If still fails: Returns DEFAULT_TUTORIAL_CONTENT (hardcoded fallback)
```

**Key Finding**: 
- ✅ Has BFF routes in `/app/api/workers/*` (QStash consumers)
- ✅ Has BFF routes in `/app/api/ai-tutor/*` (AI tutor queries)
- ✅ Queries DB directly as fallback
- ❌ Does NOT go through gateway
- ❌ Does NOT call auth service

---

### Flow 2: RTH Quiz App (quiz.realtutorialhub.com)

**Pattern**: BFF + Direct API calls

```typescript
// apps/realtutorialhub-quiz/src/utils/apiBase.ts

1. User takes exam
2. Frontend calls fetch('/api/bff/exam-config')
   → BFF route in quiz app
3. BFF route calls api-server internally
4. OR frontend calls fetch(`${NEXT_PUBLIC_API_URL}/reports?id=...`)
   → Direct call to api-server (bypasses BFF)
```

**Key Finding**:
- ✅ Has BFF routes in `/app/api/bff/*`
- ✅ Also makes direct API calls to api-server
- ❌ Does NOT go through gateway
- ❌ Does NOT call auth service

---

### Flow 3: SkillUp Student Portal (app.skillupitacademy.com)

**Pattern**: BFF with direct DB queries

```typescript
// apps/skillup-web/src/app/api/student/my-batch/route.ts

export async function GET(request?: Request) {
  return NextResponse.json(await getSkillupMyBatch(request));
}

// apps/skillup-web/src/lib/skillup-data.ts
// Queries people_prod database DIRECTLY
```

**Key Finding**:
- ✅ Has BFF routes in `/app/api/student/*`, `/app/api/programs/*`, `/app/api/batches/*`
- ✅ Queries people_prod DB DIRECTLY (no api-server)
- ❌ Does NOT go through gateway
- ❌ Does NOT call auth service

---

### Flow 4: SkillUp Admin (admin.skillupitacademy.com)

**Pattern**: BFF with direct DB queries

```typescript
// apps/skillup-admin/src/app/api/admin/students/route.ts

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;
  
  // Queries people_prod directly
  return NextResponse.json(await listAdminStudents(request));
}
```

**Key Finding**:
- ✅ Has BFF routes in `/app/api/admin/*`
- ✅ Queries people_prod DB DIRECTLY
- ❌ Does NOT go through gateway
- ❌ Does NOT call auth service

---

## Where is the Gateway Actually Used?

**File**: `services/api-gateway/src/routes/routing-table.ts`

**Gateway Routes**:
```typescript
{ host: 'app.skillupitacademy.com', prefix: '/', upstreamKey: 'SKILLUP_WEB_URL' }
{ host: 'admin.skillupitacademy.com', prefix: '/', upstreamKey: 'SKILLUP_ADMIN_URL' }
{ host: 'faculty.skillupitacademy.com', prefix: '/', upstreamKey: 'FACULTY_URL' }
{ host: 'api.skillhubcore.in', prefix: '/', upstreamKey: 'SKILLHUBCORE_URL' }
```

**What this means**:
- Gateway routes **entire apps** (HTML pages), not API calls
- Gateway is a **reverse proxy** for hosting, not an API gateway
- Frontend apps are served through gateway, but API calls bypass it

---

## Where is Auth Service?

**File**: `services/skillhubcore-service/src/modules/auth/token.service.ts`

**Status**: 🔶 SCAFFOLD ONLY - Not implemented

**Current Auth Pattern**:
- Each app has its own auth middleware
- JWT verification happens in each app
- No centralized auth service
- `api.skillhubcore.in` is planned but not active

---

## Correct Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ RTH Tutorial  │    │ RTH Quiz      │    │ SkillUp Web   │
│ (Next.js)     │    │ (Next.js)     │    │ (Next.js)     │
│               │    │               │    │               │
│ Has BFF       │    │ Has BFF       │    │ Has BFF       │
│ routes        │    │ routes        │    │ routes        │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        │ Some calls          │ Some calls          │ Direct DB
        ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│              api-server (Cloud Run)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │Tutorial  │  │Exam      │  │Payment   │               │
│  │Module    │  │Module    │  │Module    │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
        │                │                │
        ▼                ▼                ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│tutorial_ │    │quiz_     │    │payment_  │    │people_   │
│prod      │    │platform_ │    │prod      │    │prod      │
│          │    │prod      │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     ▲                                                ▲
     │                                                │
     └────────────────────────────────────────────────┘
              Direct DB queries from BFF routes
```

---

## Summary: What You're Actually Doing

### Architecture Pattern: **BFF (Backend-for-Frontend)**

Each frontend app has:
1. ✅ Its own `/app/api/*` routes (BFF layer)
2. ✅ Direct database access (via Drizzle ORM)
3. ✅ Optional calls to api-server for shared logic
4. ❌ NO gateway for API calls
5. ❌ NO centralized auth service (yet)

### Why This is Actually GOOD

**Pros**:
- ✅ Low latency (no extra hop through gateway)
- ✅ Resilient (fallback to direct DB if api-server down)
- ✅ Simple (no complex routing logic)
- ✅ Fast development (each team owns their BFF)

**Cons**:
- ⚠️ Code duplication (auth logic in each app)
- ⚠️ Harder to enforce consistent API patterns
- ⚠️ Each app needs DB credentials

---

## Recommendation

**Your current architecture is fine!** Don't force it to match the flowchart. The BFF pattern you're using is:
- ✅ Industry standard (Netflix, Spotify use this)
- ✅ Scales well
- ✅ Already working in your code

**What to fix**:
1. Update documentation to match actual architecture
2. Remove references to "gateway for API calls" (it's for hosting only)
3. Remove references to "auth service" (it's not implemented yet)
4. Document the BFF pattern you're actually using

---

**END OF ANALYSIS**
