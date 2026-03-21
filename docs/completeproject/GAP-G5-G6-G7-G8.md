# Gap G5: Progressive Web App (PWA)
## docs/blueprints/GAP-G5-PWA.md

> Applies to: student-app, tutorial-app
> Critical for: India mobile users on slow connections

---

## Part 1: Setup (Next.js PWA)

```bash
pnpm add next-pwa
# Configure in next.config.ts
```

---

## Part 2: next.config.ts

```typescript
import withPWA from 'next-pwa'

const config = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // Cache tutorial content blocks (read-heavy, rarely changes)
      urlPattern: /^https:\/\/api\.realtutorialhub\.com\/tutorial\/subtopics\/.*\/content/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'tutorial-content',
        expiration: { maxAgeSeconds: 3600, maxEntries: 100 }
      }
    },
    {
      // Cache exam questions (offline exam taking)
      urlPattern: /^https:\/\/api\.realtutorialhub\.com\/exam\/session\/.*\/questions/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'exam-questions',
        expiration: { maxAgeSeconds: 7200, maxEntries: 20 }
      }
    },
    {
      // Next.js static assets: cache forever (immutable)
      urlPattern: /\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxAgeSeconds: 31536000 }
      }
    }
  ]
})(nextConfig)

export default config
```

---

## Part 3: Web App Manifest

```json
// public/manifest.json
{
  "name": "RealTutorialHub",
  "short_name": "RTHub",
  "description": "AI-powered learning platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3d5a9e",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/home.png", "sizes": "390x844", "type": "image/png" }
  ],
  "shortcuts": [
    { "name": "My Exams", "url": "/exams", "icons": [{ "src": "/icons/exam-96.png", "sizes": "96x96" }] },
    { "name": "Continue Learning", "url": "/learn", "icons": [{ "src": "/icons/learn-96.png", "sizes": "96x96" }] }
  ]
}
```

---

## Part 4: Offline Handling

```typescript
// When student is offline during exam:
// Service Worker caches questions on session start
// Answers stored in IndexedDB → sync on reconnect

// apps/student-app/src/lib/offline-sync.ts
import { openDB } from 'idb'

const db = await openDB('exam-offline', 1, {
  upgrade(db) {
    db.createObjectStore('pending-answers', { keyPath: 'id' })
  }
})

export async function savePendingAnswer(answer: ExamAnswer) {
  await db.put('pending-answers', { ...answer, savedAt: new Date() })
}

export async function syncPendingAnswers() {
  const all = await db.getAll('pending-answers')
  for (const answer of all) {
    await fetch('/api/exam/answer', { method: 'POST', body: JSON.stringify(answer) })
    await db.delete('pending-answers', answer.id)
  }
}

// Listen for online event:
window.addEventListener('online', syncPendingAnswers)
```

---

## Part 5: Install Prompt

```typescript
// Prompt "Install App" after 3rd visit
let deferredPrompt: BeforeInstallPromptEvent | null = null

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  // Show install banner after delay
  setTimeout(() => showInstallBanner(deferredPrompt!), 3000)
})
```

---

## Part 6: Verification

```
□ Lighthouse PWA score ≥ 90
□ "Install App" prompt appears on mobile
□ App opens in standalone mode (no browser chrome)
□ Last 5 tutorial subtopics accessible offline
□ Exam answers sync on reconnect (IndexedDB → API)
□ Service worker registered and active
□ manifest.json valid (Lighthouse check)
□ Push notifications permission prompt works
```

---

*Gap: G5 | Priority: Medium | Status: Ready*

---
---

# Gap G6: Admin Audit Trail
## docs/blueprints/GAP-G6-AUDIT-TRAIL.md

> Applies to: All admin actions across all services
> Legal requirement for financial + exam operations

---

## Part 1: Audit Log Schema

```sql
-- In People DB (accessible to admin-app):
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID NOT NULL,      -- who performed the action
  actor_role      TEXT NOT NULL,      -- 'admin' | 'super_admin' | 'faculty'
  action          TEXT NOT NULL,      -- e.g., 'student.status_changed'
  resource_type   TEXT NOT NULL,      -- 'student' | 'question' | 'payment'
  resource_id     UUID NOT NULL,      -- ID of the affected record
  before_state    JSONB,              -- state before change
  after_state     JSONB,              -- state after change
  ip_address      INET,
  user_agent      TEXT,
  request_id      TEXT,               -- X-Request-ID from gateway
  service         TEXT NOT NULL,      -- which service performed the action
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- Retention: never delete audit logs
-- Archive to cold storage (GCS) after 2 years
```

---

## Part 2: Audit Actions Catalog

```typescript
// packages/types/src/audit.types.ts
export type AuditAction =
  // Student actions
  | 'student.created'
  | 'student.status_changed'
  | 'student.batch_assigned'
  | 'student.dropped'
  // Exam actions
  | 'question.created' | 'question.edited' | 'question.deleted'
  | 'exam.score_overridden'
  | 'blueprint.created' | 'blueprint.edited'
  // Financial actions (most critical)
  | 'payment.manual_entry'
  | 'payment.installment_waived'
  | 'scholarship.applied'
  | 'fee.discounted'
  | 'payment.refunded'
  // Content actions
  | 'content.published' | 'content.unpublished'
  | 'content.deleted'
  // Admin actions
  | 'admin.role_granted' | 'admin.role_revoked'
  | 'faculty.empanelled' | 'faculty.suspended'
  | 'batch.created' | 'batch.cancelled'
```

---

## Part 3: Audit Middleware

```typescript
// packages/auth/src/audit.ts

export async function auditLog(params: {
  actorId: string
  actorRole: string
  action: AuditAction
  resourceType: string
  resourceId: string
  beforeState?: unknown
  afterState?: unknown
  requestId?: string
  service: string
}): Promise<void> {
  // Fire and forget — never block the main action
  // Use QStash to write audit log asynchronously
  await qstash.publishJSON({
    url: `${ADMIN_SERVICE_URL}/api/workers/write-audit-log`,
    body: {
      ...params,
      createdAt: new Date().toISOString()
    }
  })
}

// Usage in payment-service:
await auditLog({
  actorId: adminUserId,
  actorRole: 'admin',
  action: 'payment.installment_waived',
  resourceType: 'installment',
  resourceId: installmentId,
  beforeState: { status: 'pending', amount: 5000 },
  afterState: { status: 'waived', reason: 'scholarship' },
  requestId: requestId,
  service: 'payment-service'
})
```

---

## Part 4: Admin Audit UI

```
Route: admin.realtutorialhub.com/audit-logs

Filters:
  - Date range (from/to)
  - Actor (search by name/email)
  - Action type (dropdown)
  - Resource type (student/question/payment/etc.)

Table columns:
  When | Who | Action | Resource | Before → After | Service | IP

Click row → expand:
  Full JSON diff of before_state vs after_state
  User agent, X-Request-ID (for tracing)
  Link to the affected resource

Export: CSV download of filtered results
Retention policy: visible for 2 years, then archived
```

---

## Part 5: Verification

```
□ Every admin form submission creates audit log entry
□ Financial actions (waiver, discount, refund) always audited
□ Exam score overrides always audited with before/after
□ Audit logs never deleted (append-only)
□ Admin can filter by actor, action, date, resource
□ Audit log write never blocks main operation (async via QStash)
□ Before/after state stored as JSON diff
□ IP address and X-Request-ID captured for forensics
```

---

*Gap: G6 | Priority: Medium-High | Status: Ready*

---
---

# Gap G7: SEO & Social Sharing
## docs/blueprints/GAP-G7-SEO.md

> Applies to: Public pages of realtutorialhub.com + skillupitacademy.com
> Goal: organic discovery + LinkedIn/WhatsApp sharing

---

## Part 1: Next.js Metadata (App Router)

```typescript
// apps/student-app/src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://realtutorialhub.com'),
  title: { default: 'RealTutorialHub — AI-Powered Learning', template: '%s | RealTutorialHub' },
  description: 'Learn Full Stack, Data Science, and more with AI-powered tutorials, exams, and real-world projects.',
  keywords: ['online learning', 'data science', 'full stack', 'AI tutor', 'exam preparation'],
  openGraph: {
    type: 'website',
    siteName: 'RealTutorialHub',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }]
  },
  twitter: { card: 'summary_large_image', site: '@realtutorialhub' },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://realtutorialhub.com' }
}

// Per-domain page metadata:
// apps/student-app/src/app/(public)/explore/[domainSlug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const domain = await getDomainBySlug(params.domainSlug)
  return {
    title: `${domain.name} Courses`,
    description: `Learn ${domain.name} with AI-powered tutorials and exams. ${domain.subtopicCount}+ subtopics.`,
    openGraph: {
      title: `${domain.name} — RealTutorialHub`,
      description: domain.description,
      images: [{ url: domain.ogImageUrl }]
    }
  }
}
```

---

## Part 2: Sitemap

```typescript
// apps/student-app/src/app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const domains = await getAllPublishedDomains()
  const subjects = await getAllPublishedSubjects()
  const topics = await getAllPublishedTopics()

  return [
    { url: 'https://realtutorialhub.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://realtutorialhub.com/explore', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    ...domains.map(d => ({
      url: `https://realtutorialhub.com/explore/${d.slug}`,
      lastModified: d.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    })),
    ...subjects.map(s => ({
      url: `https://realtutorialhub.com/explore/${s.domainSlug}/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7
    })),
    // Individual topic pages: priority 0.6
  ]
}
```

---

## Part 3: JSON-LD Structured Data

```typescript
// For course/learning pages:
const courseJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: subject.name,
  description: subject.description,
  provider: {
    '@type': 'Organization',
    name: 'RealTutorialHub',
    url: 'https://realtutorialhub.com'
  },
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    inLanguage: 'en'
  }
}

// Add to page:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
/>
```

---

## Part 4: Certificate Sharing

```typescript
// When certificate is issued → generate OG image for LinkedIn sharing
// cert.realtutorialhub.com/{verificationCode}
// Dynamic OG image: @vercel/og (Edge Function)

// apps/student-app/src/app/api/og/certificate/route.tsx
import { ImageResponse } from 'next/og'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  const course = searchParams.get('course')
  const date = searchParams.get('date')

  return new ImageResponse(
    <div style={{ display: 'flex', ...certificateStyles }}>
      <div>Certificate of Completion</div>
      <div>{name}</div>
      <div>has completed {course}</div>
      <div>Issued: {date}</div>
      <div>Verify: cert.realtutorialhub.com/...</div>
    </div>,
    { width: 1200, height: 630 }
  )
}
```

---

## Part 5: Verification

```
□ Google Search Console: all pages indexed
□ Lighthouse SEO score ≥ 90 on all public pages
□ sitemap.xml accessible at /sitemap.xml
□ robots.txt: allows all crawlers, blocks /api/*
□ OG image appears when sharing domain/subject URL on WhatsApp
□ Certificate OG image generated dynamically with student name
□ JSON-LD Course schema valid (test with Google Rich Results)
□ Canonical URLs set correctly on all pages
□ Meta description ≤ 160 characters on all pages
```

---

*Gap: G7 | Priority: Low | Status: Ready*

---
---

# Gap G8: Content Versioning (Question Bank)
## docs/blueprints/GAP-G8-CONTENT-VERSIONING.md

> Applies to: Exam Engine questions + Tutorial content blocks
> Critical for: fairness disputes, question corrections

---

## Part 1: Question Versioning (Exam Engine)

```sql
-- Exam DB: add version tracking to questions
CREATE TABLE question_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id     UUID NOT NULL,
  version         INTEGER NOT NULL,
  content         JSONB NOT NULL,   -- snapshot of question at this version
  changed_by      UUID NOT NULL,
  change_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_id, version)
);

-- Link exam sessions to specific question versions used:
ALTER TABLE exam_answers
  ADD COLUMN question_version INTEGER DEFAULT 1;
-- This records which version of the question the student answered

-- When a question is edited:
-- 1. Increment questions.version
-- 2. Insert new row in question_versions
-- 3. All future exams use new version
-- 4. Past exam answers remain linked to old version
```

---

## Part 2: Tutorial Content Versioning

```sql
-- Already in PHASE-T1 schema:
-- tutorial_content.version (INTEGER, increments on each edit)
-- But we also need the full history:

CREATE TABLE tutorial_content_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID NOT NULL REFERENCES tutorial_content(id),
  version         INTEGER NOT NULL,
  content         JSONB NOT NULL,   -- full content snapshot
  changed_by      UUID NOT NULL,
  change_summary  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(content_id, version)
);

-- Student progress links to version consumed:
ALTER TABLE subtopic_flow_progress
  ADD COLUMN content_version_consumed INTEGER DEFAULT 1;
```

---

## Part 3: Version History UI

```
Admin: admin.realtutorialhub.com/questions/{id}/history
  - Timeline of all versions
  - Side-by-side diff: version 2 vs version 3
  - "Restore to version N" button (requires admin confirmation)
  - Who changed it, when, why

Admin: admin.realtutorialhub.com/content/{subtopicId}/history
  - Same timeline view per content block type
  - Shows which students saw which version
```

---

## Part 4: Dispute Resolution

```typescript
// When student disputes: "The question was wrong when I took it"
// Admin can check which version they saw:

async function getVersionStudentSaw(
  studentId: string,
  examSessionId: string,
  questionId: string
): Promise<QuestionVersion> {
  // Get the exam_answers record
  const answer = await db.query.examAnswers.findFirst({
    where: and(
      eq(examAnswers.examSessionId, examSessionId),
      eq(examAnswers.questionId, questionId)
    )
  })

  // Get the exact version they answered
  return db.query.questionVersions.findFirst({
    where: and(
      eq(questionVersions.questionId, questionId),
      eq(questionVersions.version, answer.questionVersion)
    )
  })
}
```

---

## Part 5: Bulk Import/Export (Question Bank)

```typescript
// CSV format for bulk question import:
// columns: id, type, text, optionA, optionB, optionC, optionD, correctAnswer,
//          difficulty, subtopicId, explanation, tags

// Validation before import:
// - Check subtopicId exists in hierarchy
// - Verify correctAnswer matches one of optionA-D
// - Check difficulty is valid enum value
// - Detect duplicates (same text + subtopicId)

// Export:
// Admin selects domain → exports all questions as CSV or JSON
// Used for: backup, review, sharing with subject matter experts
```

---

## Part 6: Verification

```
□ Every question edit creates new version in question_versions
□ exam_answers.question_version correctly records version used
□ Admin can view version history for any question
□ Side-by-side diff shows exactly what changed
□ Restore to previous version works (admin confirmation required)
□ Bulk CSV import validates all rows before inserting any
□ Duplicate detection prevents importing same question twice
□ Student dispute resolution: admin can see exact question version shown
□ Tutorial content version recorded when student reads block
```

---

*Gap: G8 | Priority: Medium-High | Status: Ready*
