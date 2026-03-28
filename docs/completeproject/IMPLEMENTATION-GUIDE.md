# Implementation Guide: Missing Features
> Based on CODE-VERIFICATION-REPORT.md
> Generated: 2026-03-28
> Approach: No regression, match existing patterns, use current codebase structure

---

## Table of Contents
1. [Event Consumers Implementation](#1-event-consumers-implementation)
2. [Tutorial Progress Tracking API](#2-tutorial-progress-tracking-api)
3. [Batch Capacity Redis Counter](#3-batch-capacity-redis-counter)
4. [Assignment Engine](#4-assignment-engine)
5. [AI Tutor / Gemini Integration](#5-ai-tutor--gemini-integration)
6. [Remediation Engine](#6-remediation-engine)
7. [SkillUp Notification System](#7-skillup-notification-system)
8. [SkillUp Certificate Flow](#8-skillup-certificate-flow)

---

## Priority Order

**IMMEDIATE (Unblocks core features):**
1. Event Consumers (foundation for async processing)
2. Tutorial Progress Tracking API (enables learning flow)
3. Batch Capacity Redis Counter (prevents overbooking)

**SHORT TERM (Completes Tutorial Engine):**
4. Assignment Engine (self-directed practice)
5. Remediation Engine (weak area targeting)

**MEDIUM TERM (Advanced features):**
6. AI Tutor / Gemini Integration (conversational help)
7. SkillUp Notification System (email reminders)
8. SkillUp Certificate Flow (completion rewards)

---

## 1. Event Consumers Implementation

### Current State
- ✅ Event types defined in `packages/events/src/types.ts` (18 types)
- ✅ Event publishing works via `publishEvent()` from `@quiz/events`
- ❌ Consumer directory does not exist: `apps/api-server/src/consumers/`
- ❌ No consumer implementations

### Pattern to Follow
**Reference**: `apps/api-server/src/modules/tutor/tutor.service.ts` (async processing pattern)

### File Structure to Create
```
apps/api-server/src/consumers/
├── index.ts                           # Export all consumers
├── base-consumer.ts                   # Shared consumer logic
├── session-reminder.consumer.ts       # SESSION_SCHEDULED event
├── payment-overdue.consumer.ts        # PAYMENT_OVERDUE event
├── certificate.consumer.ts            # CERTIFICATE_ISSUED event
├── tutorial-completion.consumer.ts    # TUTORIAL_SUBTOPIC_COMPLETED event
├── subscription-upgrade.consumer.ts   # SUBSCRIPTION_UPGRADED event
└── __tests__/
    ├── session-reminder.consumer.test.ts
    └── payment-overdue.consumer.test.ts
```

### Step 1: Create Base Consumer Class

**File**: `apps/api-server/src/consumers/base-consumer.ts`

**Class Name**: `BaseConsumer`

**Purpose**: Shared logic for QStash webhook verification, error handling, logging

**Key Methods**:
- `verifyQStashSignature(req: NextRequest): Promise<boolean>` — Verify QStash signature
- `parseEventPayload<T>(body: unknown, schema: z.ZodSchema<T>): T` — Validate payload
- `handleError(error: unknown, eventType: string): void` — Log errors without throwing

**Dependencies**:
- `@upstash/qstash` for signature verification
- `@quiz/events` for event schemas
- `@/modules/core/logger.service` for logging

**Pattern**:
```typescript
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { LoggerService } from '@/modules/core/logger.service';
import { container } from '@/modules/core/container';
import type { z } from 'zod';

export abstract class BaseConsumer {
  protected logger: LoggerService;

  constructor() {
    this.logger = container.get(LoggerService);
  }

  protected async verifyQStashSignature(req: Request): Promise<boolean> {
    // Use verifySignatureAppRouter from @upstash/qstash
    // Return true if valid, false otherwise
  }

  protected parseEventPayload<T>(body: unknown, schema: z.ZodSchema<T>): T {
    // Validate using schema.parse()
    // Throw if invalid
  }

  protected handleError(error: unknown, eventType: string): void {
    // Log error with context
    // Do NOT throw (fire-and-forget pattern)
  }
}
```


### Step 2: Create Session Reminder Consumer

**File**: `apps/api-server/src/consumers/session-reminder.consumer.ts`

**Class Name**: `SessionReminderConsumer`

**Event Type**: `PlatformEventTypes.SESSION_SCHEDULED`

**Purpose**: Send email reminders to all students in a batch when session is scheduled

**Dependencies**:
- `@quiz/db-people` (batches, batchEnrollments, users, userProfiles)
- `@quiz/events` (PlatformEventPayloadSchemas)
- Resend API for email sending

**Key Method**:
```typescript
async processSessionScheduled(payload: SessionScheduledPayload): Promise<void>
```

**Logic Flow**:
1. Query batch name from `batches` table using `payload.batchId`
2. Query all enrolled students from `batchEnrollments` WHERE `batchId = payload.batchId` AND `status = 'active'` AND `deletedAt IS NULL`
3. JOIN with `users` and `userProfiles` to get email addresses
4. For each student:
   - Send email via Resend API
   - Email subject: "Upcoming Session: {batchName}"
   - Email body: Include `payload.scheduledAt`, `payload.sessionNotes`
5. Log success/failure for each email

**Database Pattern** (match existing code):
```typescript
import { db as peopleDb, batches, batchEnrollments, users, userProfiles } from '@quiz/db-people';
import { eq, and, isNull } from 'drizzle-orm';

const batchData = await peopleDb
  .select({ name: batches.name })
  .from(batches)
  .where(and(eq(batches.id, batchId), isNull(batches.deletedAt)))
  .limit(1);

const enrolledStudents = await peopleDb
  .select({
    userId: users.id,
    email: users.email,
    name: userProfiles.fullName,
  })
  .from(batchEnrollments)
  .innerJoin(users, eq(users.id, batchEnrollments.studentUserId))
  .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
  .where(and(
    eq(batchEnrollments.batchId, batchId),
    eq(batchEnrollments.status, 'active'),
    isNull(batchEnrollments.deletedAt)
  ));
```

**Resend Integration**:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'SkillUp IT Academy <noreply@skillupitacademy.com>',
  to: studentEmail,
  subject: `Upcoming Session: ${batchName}`,
  html: `<p>Your session is scheduled for ${scheduledAt}</p><p>Notes: ${sessionNotes}</p>`,
});
```

**API Route to Create**:
**File**: `apps/api-server/src/app/api/consumers/session-scheduled/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { SessionReminderConsumer } from '@/consumers/session-reminder.consumer';

export async function POST(req: NextRequest) {
  const consumer = new SessionReminderConsumer();
  await consumer.handle(req);
  return NextResponse.json({ success: true }, { status: 200 });
}
```

**Environment Variable Needed**:
- `RESEND_API_KEY` — Add to `.env.local` and GCP Secret Manager


### Step 3: Create Payment Overdue Consumer

**File**: `apps/api-server/src/consumers/payment-overdue.consumer.ts`

**Class Name**: `PaymentOverdueConsumer`

**Event Type**: `PlatformEventTypes.PAYMENT_OVERDUE`

**Purpose**: Send reminder email to student about overdue payment

**Dependencies**:
- `@quiz/db-payment` (paymentInstallments)
- `@quiz/db-people` (users, userProfiles)
- Resend API

**Key Method**:
```typescript
async processPaymentOverdue(payload: PaymentOverduePayload): Promise<void>
```

**Logic Flow**:
1. Query installment details from `paymentInstallments` WHERE `id = payload.installmentId`
2. JOIN with `users` and `userProfiles` to get student email
3. Send reminder email via Resend
4. Email subject: "Payment Reminder: Installment Overdue"
5. Email body: Include amount, due date, `payload.overdueByDays`

**Database Pattern**:
```typescript
import { db as paymentDb, paymentInstallments } from '@quiz/db-payment';
import { db as peopleDb, users, userProfiles } from '@quiz/db-people';
import { eq, and, isNull } from 'drizzle-orm';

const installmentData = await paymentDb
  .select({
    amount: paymentInstallments.amount,
    dueDate: paymentInstallments.dueDate,
    studentUserId: paymentInstallments.studentUserId,
  })
  .from(paymentInstallments)
  .where(eq(paymentInstallments.id, installmentId))
  .limit(1);

const studentData = await peopleDb
  .select({
    email: users.email,
    name: userProfiles.fullName,
  })
  .from(users)
  .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
  .where(and(eq(users.id, studentUserId), isNull(users.deletedAt)))
  .limit(1);
```

**API Route**:
**File**: `apps/api-server/src/app/api/consumers/payment-overdue/route.ts`

---

### Step 4: Create Certificate Consumer

**File**: `apps/api-server/src/consumers/certificate.consumer.ts`

**Class Name**: `CertificateConsumer`

**Event Type**: `PlatformEventTypes.CERTIFICATE_ISSUED`

**Purpose**: Generate PDF certificate, upload to GCS, send email with download link

**Dependencies**:
- `@quiz/db-tutorial` (certificates)
- `@quiz/db-people` (users, userProfiles)
- `@google-cloud/storage` for GCS upload
- `pdfmake` or `puppeteer` for PDF generation
- Resend API

**Key Method**:
```typescript
async processCertificateIssued(payload: CertificateIssuedPayload): Promise<void>
```

**Logic Flow**:
1. Query certificate details from `certificates` table
2. Query user details from `users` and `userProfiles`
3. Generate PDF certificate using pdfmake
4. Upload PDF to GCS bucket `skillup-certificates` or `rth-certificates`
5. Get public URL from GCS
6. Update `certificates` table with `certificateUrl`
7. Send email with download link via Resend

**GCS Upload Pattern**:
```typescript
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY || '{}'),
});

const bucket = storage.bucket('skillup-certificates');
const fileName = `${userId}/${certificateId}.pdf`;
const file = bucket.file(fileName);

await file.save(pdfBuffer, {
  contentType: 'application/pdf',
  metadata: {
    cacheControl: 'public, max-age=31536000',
  },
});

await file.makePublic();
const publicUrl = `https://storage.googleapis.com/skillup-certificates/${fileName}`;
```

**Environment Variables Needed**:
- `GCP_PROJECT_ID`
- `GCP_SERVICE_ACCOUNT_KEY` (JSON string)

**API Route**:
**File**: `apps/api-server/src/app/api/consumers/certificate-issued/route.ts`


### Step 5: Update Event Publishers to Use Real Consumer URLs

**Current State**: Publishers use placeholder URLs like `https://placeholder.invalid/consumers/session-scheduled`

**Files to Update**:
- `apps/api-server/src/lib/skillup-notifications.ts`
- Any other files that call `publishEvent()`

**Pattern**:
```typescript
// Before
const destinationUrl = process.env.SKILLUP_SESSION_REMINDER_URL ?? 'https://placeholder.invalid/consumers/session-scheduled';

// After
const destinationUrl = process.env.SKILLUP_SESSION_REMINDER_URL ?? `${process.env.NEXT_PUBLIC_API_URL}/api/consumers/session-scheduled`;
```

**Environment Variables to Add** (`.env.local`):
```bash
# Consumer URLs (optional overrides, defaults to api-server routes)
SKILLUP_SESSION_REMINDER_URL=https://api.yourdomain.com/api/consumers/session-scheduled
PAYMENT_OVERDUE_CONSUMER_URL=https://api.yourdomain.com/api/consumers/payment-overdue
CERTIFICATE_ISSUED_CONSUMER_URL=https://api.yourdomain.com/api/consumers/certificate-issued
```

---

## 2. Tutorial Progress Tracking API

### Current State
- ✅ DB table exists: `tutorial_progress` in `packages/db-tutorial/src/schema/tutorial-progress.ts`
- ✅ UNIQUE index on `(user_id, subtopic_id)` already applied
- ❌ API routes missing: `POST /api/tutorial/progress`, `GET /api/tutorial/progress`
- ❌ Frontend integration missing

### Pattern to Follow
**Reference**: `apps/api-server/src/app/api/tutorial/faculty/live-sessions/route.ts` (API route structure)

### Step 1: Create Repository

**File**: `packages/db-tutorial/src/repositories/tutorial-progress.repository.ts`

**Class Name**: `TutorialProgressRepository`

**Extends**: `TutorialRepositoryBase` (from `packages/db-tutorial/src/repositories/base.repository.ts`)

**Key Methods**:
```typescript
async upsertProgress(input: {
  userId: string;
  subtopicId: string;
  blockType: ContentBlockType;
  status: 'viewed' | 'completed';
}): Promise<TutorialProgressRecord>

async getProgress(userId: string, subtopicId: string): Promise<TutorialProgressRecord | null>

async getCompletionPercentage(userId: string, subtopicId: string): Promise<number>

async isAssignmentUnlocked(userId: string, subtopicId: string): Promise<boolean>
```

**Database Pattern** (match existing repositories):
```typescript
import { and, eq, isNull } from 'drizzle-orm';
import { tutorialProgress } from '../schema/tutorial-progress';
import { TutorialRepositoryBase } from './base.repository';

export class TutorialProgressRepository extends TutorialRepositoryBase {
  async upsertProgress(input) {
    const [row] = await this.runRead(
      this.dbInstance
        .insert(tutorialProgress)
        .values({
          userId: input.userId,
          subtopicId: input.subtopicId,
          blocksViewed: [input.blockType],
          lastViewedBlock: input.blockType,
          completionPercent: 16.67, // 1/6 blocks
          assignmentUnlocked: false,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [tutorialProgress.userId, tutorialProgress.subtopicId],
          set: {
            blocksViewed: sql`array_append(COALESCE(${tutorialProgress.blocksViewed}, ARRAY[]::text[]), ${input.blockType})`,
            lastViewedBlock: input.blockType,
            completionPercent: sql`(array_length(array_append(COALESCE(${tutorialProgress.blocksViewed}, ARRAY[]::text[]), ${input.blockType}), 1)::float / 6.0) * 100`,
            assignmentUnlocked: sql`array_length(array_append(COALESCE(${tutorialProgress.blocksViewed}, ARRAY[]::text[]), ${input.blockType}), 1) >= 6`,
            updatedAt: new Date(),
          },
        })
        .returning(),
      'TutorialProgressRepository.upsertProgress'
    );
    return row;
  }

  async getProgress(userId: string, subtopicId: string) {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialProgress)
        .where(and(
          eq(tutorialProgress.userId, userId),
          eq(tutorialProgress.subtopicId, subtopicId)
        )),
      'TutorialProgressRepository.getProgress'
    );
    return rows[0] ?? null;
  }
}
```


### Step 2: Create API Routes

**File**: `apps/api-server/src/app/api/tutorial/progress/route.ts`

**Methods**: `POST`, `GET`

**Auth**: Read `x-user-id` from header (injected by proxy.ts)

**POST Logic**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { TutorialProgressRepository } from '@quiz/db-tutorial';
import { z } from 'zod';

const progressSchema = z.object({
  subtopicId: z.string().uuid(),
  blockType: z.enum(['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor']),
  status: z.enum(['viewed', 'completed']),
});

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 });
  }

  const repository = new TutorialProgressRepository();
  const progress = await repository.upsertProgress({
    userId,
    ...parsed.data,
  });

  return NextResponse.json({ data: progress }, { status: 200 });
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subtopicId = searchParams.get('subtopicId');
  if (!subtopicId) {
    return NextResponse.json({ error: 'subtopicId required' }, { status: 400 });
  }

  const repository = new TutorialProgressRepository();
  const progress = await repository.getProgress(userId, subtopicId);

  return NextResponse.json({ 
    data: progress ?? {
      blocksViewed: [],
      completionPercent: 0,
      assignmentUnlocked: false,
    }
  }, { status: 200 });
}
```

**Export Config**:
```typescript
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

### Step 3: Frontend Integration

**File**: `apps/realtutorialhub-web/src/components/content/BlockRenderer.tsx`

**Pattern**: Call `POST /api/tutorial/progress` when block is viewed

**For TextBlock**: Use Intersection Observer
```typescript
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        fetch('/api/tutorial/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subtopicId,
            blockType: 'notes',
            status: 'viewed',
          }),
        });
        observer.disconnect();
      }
    },
    { threshold: 0.5 }
  );
  observer.observe(ref.current);
}, []);
```

**For CodeBlock**: On copy button click
**For DiagramBlock**: On render complete
**For SummaryBlock**: On scroll into view
**For QuizLinkBlock**: On click
**For AiTutorDrawer**: On first message sent

---

## 3. Batch Capacity Redis Counter

### Current State
- ❌ Service does not exist: `apps/api-server/src/modules/people/batch-capacity.service.ts`
- ❌ Not wired to enrollment routes

### Pattern to Follow
**Reference**: `apps/api-server/src/modules/core/cache.service.ts` (Redis operations)

### Step 1: Create Service

**File**: `apps/api-server/src/modules/people/batch-capacity.service.ts`

**Class Name**: `BatchCapacityService`

**Purpose**: Atomic batch capacity management using Redis counters

**Dependencies**:
- `@/modules/core/cache.service` (CacheService)
- `@quiz/db-people` (batches)

**Key Methods**:
```typescript
async getAvailable(batchId: string): Promise<number>
async reserveSlot(batchId: string): Promise<boolean>
async releaseSlot(batchId: string): Promise<void>
async seed(batchId: string, capacity: number, enrolled: number): Promise<void>
```

**Implementation**:
```typescript
import { cacheService } from '@/modules/core/cache.service';
import { db as peopleDb, batches } from '@quiz/db-people';
import { eq } from 'drizzle-orm';

export class BatchCapacityService {
  private redisKey(batchId: string): string {
    return `batch:capacity:${batchId}`;
  }

  async getAvailable(batchId: string): Promise<number> {
    const key = this.redisKey(batchId);
    const available = await cacheService.get<number>(key);
    
    if (available === null) {
      // Seed from database
      await this.seedFromDatabase(batchId);
      return await cacheService.get<number>(key) ?? 0;
    }
    
    return available;
  }

  async reserveSlot(batchId: string): Promise<boolean> {
    const key = this.redisKey(batchId);
    const available = await this.getAvailable(batchId);
    
    if (available <= 0) {
      return false; // No slots available
    }
    
    // Atomic decrement
    const result = await cacheService.increment(key, 0); // No TTL
    // Note: increment() increases, so we need custom Redis command
    // Use Redis DECR instead
    
    return true;
  }

  async releaseSlot(batchId: string): Promise<void> {
    const key = this.redisKey(batchId);
    // Use Redis INCR to add back the slot
  }

  private async seedFromDatabase(batchId: string): Promise<void> {
    const batch = await peopleDb
      .select({
        capacity: batches.capacity,
        enrolled: batches.enrolledCount,
      })
      .from(batches)
      .where(eq(batches.id, batchId))
      .limit(1);
    
    if (batch[0]) {
      const available = batch[0].capacity - batch[0].enrolled;
      await cacheService.set(this.redisKey(batchId), available);
    }
  }
}
```

**Note**: CacheService needs `decrement()` method added. Extend it:
```typescript
// In apps/api-server/src/modules/core/cache.service.ts
async decrement(key: string): Promise<number> {
  if (this.redis !== null) {
    return await this.withTimeout(this.redis.decr(key), 0);
  }
  // Local fallback
  let count = (this.cache.get(key) as number) || 0;
  count = Math.max(0, count - 1);
  this.cache.set(key, count);
  return count;
}
```


### Step 2: Wire to Enrollment Routes

**File**: `apps/skillup-admin/src/app/(admin)/batches/[id]/enroll/route.ts` (or similar)

**Pattern**: Call `reserveSlot()` BEFORE database INSERT

**Logic Flow**:
```typescript
import { BatchCapacityService } from '@/modules/people/batch-capacity.service';

export async function POST(req: NextRequest) {
  const { batchId, studentUserId } = await req.json();
  
  const capacityService = new BatchCapacityService();
  
  // 1. Try to reserve slot atomically
  const reserved = await capacityService.reserveSlot(batchId);
  if (!reserved) {
    return NextResponse.json({ error: 'Batch is full' }, { status: 409 });
  }
  
  try {
    // 2. Insert into database
    await peopleDb.insert(batchEnrollments).values({
      batchId,
      studentUserId,
      status: 'active',
      enrolledAt: new Date(),
    });
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    // 3. Rollback: release slot if DB insert fails
    await capacityService.releaseSlot(batchId);
    throw error;
  }
}
```

**On Enrollment Cancellation**:
```typescript
export async function DELETE(req: NextRequest) {
  const { enrollmentId } = await req.json();
  
  // 1. Soft delete enrollment
  await peopleDb
    .update(batchEnrollments)
    .set({ deletedAt: new Date(), status: 'cancelled' })
    .where(eq(batchEnrollments.id, enrollmentId));
  
  // 2. Release slot
  const enrollment = await peopleDb.query.batchEnrollments.findFirst({
    where: eq(batchEnrollments.id, enrollmentId),
  });
  
  if (enrollment) {
    const capacityService = new BatchCapacityService();
    await capacityService.releaseSlot(enrollment.batchId);
  }
  
  return NextResponse.json({ success: true }, { status: 200 });
}
```

---

## 4. Assignment Engine

### Current State
- ❌ DB tables missing: `assignment_progress`, `assignment_help_requests`
- ❌ API routes missing
- ❌ UI pages missing

### Pattern to Follow
**Reference**: Tutorial progress tracking (similar flow)

### Step 1: Create Database Schema

**File**: `packages/db-tutorial/src/schema/assignment-progress.ts`

**Table Name**: `assignment_progress`

**Columns**:
```typescript
import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const assignmentProgress = pgTable('assignment_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  subtopicId: uuid('subtopic_id').notNull(),
  tier: text('tier').notNull(), // 'simple' | 'mixed' | 'intermediate' | 'expert'
  status: text('status').notNull().default('started'), // 'started' | 'self_completed'
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  uqUserSubtopicTier: uniqueIndex('uq_assignment_progress_user_subtopic_tier').on(
    table.userId,
    table.subtopicId,
    table.tier
  ),
}));
```

**File**: `packages/db-tutorial/src/schema/assignment-help-requests.ts`

**Table Name**: `assignment_help_requests`

**Columns**:
```typescript
export const assignmentHelpRequests = pgTable('assignment_help_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  subtopicId: uuid('subtopic_id').notNull(),
  tier: text('tier').notNull(),
  questionIndex: integer('question_index').notNull(),
  doubtText: text('doubt_text').notNull(),
  status: text('status').notNull().default('open'), // 'open' | 'resolved'
  resolvedBy: uuid('resolved_by'),
  resolvedAt: timestamp('resolved_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxSubtopicStatus: index('idx_assignment_help_subtopic_status').on(
    table.subtopicId,
    table.status
  ),
}));
```

**Migration File**: `packages/db-tutorial/migrations/XXXX_assignment_engine.sql`

```sql
CREATE TABLE assignment_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subtopic_id UUID NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('simple', 'mixed', 'intermediate', 'expert')),
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'self_completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_assignment_progress_user_subtopic_tier 
  ON assignment_progress(user_id, subtopic_id, tier);

CREATE TABLE assignment_help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subtopic_id UUID NOT NULL,
  tier TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  doubt_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_assignment_help_subtopic_status 
  ON assignment_help_requests(subtopic_id, status);
```

**Run Migration**:
```bash
cd packages/db-tutorial
pnpm drizzle-kit generate
pnpm drizzle-kit push
```


### Step 2: Create Repository

**File**: `packages/db-tutorial/src/repositories/assignment-progress.repository.ts`

**Class Name**: `AssignmentProgressRepository`

**Key Methods**:
```typescript
async getTierStatus(userId: string, subtopicId: string): Promise<{
  simple: 'locked' | 'available' | 'started' | 'completed';
  mixed: 'locked' | 'available' | 'started' | 'completed';
  intermediate: 'locked' | 'available' | 'started' | 'completed';
  expert: 'locked' | 'available' | 'started' | 'completed';
}>

async markTierCompleted(userId: string, subtopicId: string, tier: string): Promise<void>

async submitHelpRequest(input: {
  userId: string;
  subtopicId: string;
  tier: string;
  questionIndex: number;
  doubtText: string;
}): Promise<AssignmentHelpRequestRecord>
```

**Tier Unlock Logic**:
```typescript
async getTierStatus(userId: string, subtopicId: string) {
  // 1. Check if all 6 content blocks viewed
  const progressRepo = new TutorialProgressRepository();
  const progress = await progressRepo.getProgress(userId, subtopicId);
  const allBlocksViewed = progress?.assignmentUnlocked ?? false;
  
  // 2. Query assignment progress
  const assignments = await this.dbInstance
    .select()
    .from(assignmentProgress)
    .where(and(
      eq(assignmentProgress.userId, userId),
      eq(assignmentProgress.subtopicId, subtopicId)
    ));
  
  const statusMap = {
    simple: 'locked',
    mixed: 'locked',
    intermediate: 'locked',
    expert: 'locked',
  };
  
  // 3. Simple always available after content blocks
  if (allBlocksViewed) {
    statusMap.simple = 'available';
  }
  
  // 4. Check each tier
  for (const assignment of assignments) {
    statusMap[assignment.tier] = assignment.status === 'self_completed' ? 'completed' : 'started';
  }
  
  // 5. Unlock next tier if previous completed
  if (statusMap.simple === 'completed') statusMap.mixed = 'available';
  if (statusMap.mixed === 'completed') statusMap.intermediate = 'available';
  if (statusMap.intermediate === 'completed') statusMap.expert = 'available';
  
  return statusMap;
}
```

### Step 3: Create API Routes

**File**: `apps/api-server/src/app/api/tutorial/assignments/route.ts`

**GET**: List tiers + unlock status
```typescript
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const { searchParams } = new URL(req.url);
  const subtopicId = searchParams.get('subtopicId');
  
  if (!userId || !subtopicId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }
  
  const repository = new AssignmentProgressRepository();
  const tierStatus = await repository.getTierStatus(userId, subtopicId);
  
  return NextResponse.json({ data: tierStatus }, { status: 200 });
}
```

**File**: `apps/api-server/src/app/api/tutorial/assignments/progress/route.ts`

**POST**: Mark tier as self-completed
```typescript
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const { subtopicId, tier } = await req.json();
  
  const repository = new AssignmentProgressRepository();
  await repository.markTierCompleted(userId, subtopicId, tier);
  
  return NextResponse.json({ success: true }, { status: 200 });
}
```

**File**: `apps/api-server/src/app/api/tutorial/assignments/help/route.ts`

**POST**: Submit help request
```typescript
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const { subtopicId, tier, questionIndex, doubtText } = await req.json();
  
  const repository = new AssignmentProgressRepository();
  const helpRequest = await repository.submitHelpRequest({
    userId,
    subtopicId,
    tier,
    questionIndex,
    doubtText,
  });
  
  return NextResponse.json({ data: helpRequest }, { status: 201 });
}
```

### Step 4: Create Frontend Page

**File**: `apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/assignments/page.tsx`

**Component Structure**:
```typescript
export default async function AssignmentsPage({ params }) {
  const hierarchy = await getHierarchyBySlugs(params);
  const theme = getDomainTheme(params.domainSlug);
  
  return (
    <div>
      <h1>Practice Assignments</h1>
      <TierCard tier="simple" />
      <TierCard tier="mixed" />
      <TierCard tier="intermediate" />
      <TierCard tier="expert" />
    </div>
  );
}
```

**TierCard Component**:
- Shows lock icon if `status === 'locked'`
- Shows "Start" button if `status === 'available'`
- Shows questions if `status === 'started'`
- Shows checkmark if `status === 'completed'`
- Each question has "Mark Done" and "Flag for Help" buttons
- Reference answer shown AFTER marking done

---

## 5. AI Tutor / Gemini Integration

### Current State
- ❌ No Gemini integration exists
- ❌ API route missing: `POST /api/tutorial/ai-tutor`
- ❌ Frontend drawer component missing

### Pattern to Follow
**Reference**: `apps/api-server/src/modules/tutor/tutor.service.ts` (async AI processing)

### Step 1: Install Gemini SDK

```bash
cd apps/api-server
pnpm add @google/generative-ai
```

### Step 2: Create AI Tutor Service

**File**: `apps/api-server/src/modules/tutorial/ai-tutor.service.ts`

**Class Name**: `AiTutorService`

**Purpose**: Generate contextual answers using Gemini Flash

**Dependencies**:
- `@google/generative-ai`
- `@quiz/db-tutorial` (tutorialContent)

**Key Method**:
```typescript
async generateAnswer(input: {
  subtopicId: string;
  question: string;
  userId: string;
}): Promise<{ answer: string; citations: string[] }>
```

**Implementation**:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TutorialContentRepository } from '@quiz/db-tutorial';

export class AiTutorService {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  
  async generateAnswer(input: { subtopicId: string; question: string; userId: string }) {
    // 1. Fetch subtopic content
    const repository = new TutorialContentRepository();
    const contentRecords = await repository.getPublished(input.subtopicId, 'simple');
    
    if (contentRecords.length === 0) {
      return {
        answer: 'I don\'t have content for this subtopic yet.',
        citations: [],
      };
    }
    
    const content = contentRecords[0].content;
    
    // 2. Build context prompt
    const contextPrompt = `
You are an AI tutor helping a student learn programming concepts.

Context from the lesson:
- Notes: ${content.notes.markdown}
- Simple Explanation: ${content.layman.simpleExplanation}
- Technical Details: ${content.technical.markdown}

Student's question: ${input.question}

Provide a clear, helpful answer based on the lesson content. If the question is outside the lesson scope, politely redirect to the lesson material.
    `.trim();
    
    // 3. Call Gemini Flash
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    const answer = response.text();
    
    return {
      answer,
      citations: ['Lesson content', 'Technical documentation'],
    };
  }
}
```


### Step 3: Create API Route

**File**: `apps/api-server/src/app/api/tutorial/ai-tutor/route.ts`

**Method**: POST

**Request Body**:
```typescript
{
  subtopicId: string;
  question: string;
}
```

**Response**: Streaming (Server-Sent Events)

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AiTutorService } from '@/modules/tutorial/ai-tutor.service';
import { z } from 'zod';

const requestSchema = z.object({
  subtopicId: z.string().uuid(),
  question: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  
  try {
    const service = new AiTutorService();
    const result = await service.generateAnswer({
      ...parsed.data,
      userId,
    });
    
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

### Step 4: Create Frontend Drawer Component

**File**: `apps/realtutorialhub-web/src/components/tutorial/AiTutorDrawer.tsx`

**Component**: Already exists! (Found in `TutorialExperience.tsx`)

**Current State**: Component is imported and rendered
**Location**: `apps/realtutorialhub-web/src/components/tutorial/AiTutorDrawer.tsx`

**Verify Implementation**:
- Check if component calls `POST /api/tutorial/ai-tutor`
- Check if it displays streaming responses
- Check if it shows loading state

**If Missing, Create**:
```typescript
'use client';

import { useState } from 'react';
import type { DomainTheme } from '@/lib/domain-themes';

interface AiTutorDrawerProps {
  subtopicId: string;
  subtopicName: string;
  theme: DomainTheme;
  greeting: string;
}

export function AiTutorDrawer({ subtopicId, subtopicName, theme, greeting }: AiTutorDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleAsk = async () => {
    setLoading(true);
    setAnswer('');
    
    try {
      const response = await fetch('/api/tutorial/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtopicId, question }),
      });
      
      const data = await response.json();
      setAnswer(data.data.answer);
    } catch (error) {
      setAnswer('Sorry, I couldn\'t process your question. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          padding: '12px 24px',
          background: theme.sidebarAccent,
          color: 'white',
          borderRadius: 999,
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        Ask AI Tutor
      </button>
      
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: 400,
            height: 600,
            background: 'white',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
            borderRadius: '16px 16px 0 0',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3>AI Tutor</h3>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
            <p style={{ color: '#666', marginBottom: 16 }}>{greeting}</p>
            {answer && (
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                {answer}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 8 }}
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question}
              style={{
                padding: '8px 16px',
                background: theme.sidebarAccent,
                color: 'white',
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

### Step 5: Add Environment Variable

**File**: `.env.local`

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get API Key**: https://aistudio.google.com/app/apikey

**Add to GCP Secret Manager**:
```bash
gcloud secrets create GEMINI_API_KEY --data-file=- <<< "your_key_here"
```

---

## 6. Remediation Engine

### Current State
- ✅ Materialized view exists: `mv_student_weak_areas`
- ❌ API route missing: `GET /api/tutorial/remediation`
- ❌ Frontend page missing

### Step 1: Create API Route

**File**: `apps/api-server/src/app/api/tutorial/remediation/route.ts`

**Method**: GET

**Query Params**: `userId` (optional, defaults to `x-user-id` header)

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db as tutorialDb } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Query materialized view
  const weakAreas = await tutorialDb.execute(sql`
    SELECT 
      subtopic_id,
      subtopic_name,
      weak_score,
      CASE 
        WHEN weak_score < 50 THEN 'simple'
        WHEN weak_score < 70 THEN 'mixed'
        ELSE 'intermediate'
      END as recommended_tier
    FROM mv_student_weak_areas
    WHERE user_id = ${userId}
    ORDER BY weak_score ASC
    LIMIT 10
  `);
  
  return NextResponse.json({ data: weakAreas.rows }, { status: 200 });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

### Step 2: Create Frontend Page

**File**: `apps/realtutorialhub-web/src/app/(learning)/learn/remediation/page.tsx`

**Component**:
```typescript
export default async function RemediationPage() {
  const weakAreas = await fetch('/api/tutorial/remediation', {
    cache: 'no-store',
  }).then(res => res.json());
  
  return (
    <div>
      <h1>Your Weak Areas</h1>
      <p>Focus on these topics to improve your scores</p>
      
      {weakAreas.data.map((area) => (
        <WeakAreaCard
          key={area.subtopic_id}
          subtopicId={area.subtopic_id}
          subtopicName={area.subtopic_name}
          weakScore={area.weak_score}
          recommendedTier={area.recommended_tier}
        />
      ))}
    </div>
  );
}
```

**WeakAreaCard Component**:
- Shows subtopic name
- Shows weak score (e.g., "45% accuracy")
- Shows recommended tier (simple/mixed/intermediate)
- Links to `/learn/.../[subtopicSlug]/assignments?tier={recommendedTier}`

---

## 7. SkillUp Notification System

### Current State
- ❌ Notification consumers not implemented
- ❌ Resend integration not wired

### Dependencies
- Session Reminder Consumer (already covered in Section 1)
- Payment Overdue Consumer (already covered in Section 1)

### Implementation
**See Section 1: Event Consumers Implementation**

All notification logic is handled by event consumers:
- `session-reminder.consumer.ts` — Sends batch session reminders
- `payment-overdue.consumer.ts` — Sends payment due alerts

**No additional work needed** — implement event consumers first.

---

## 8. SkillUp Certificate Flow

### Current State
- ❌ Certificate consumer not implemented
- ❌ PDF generation not wired
- ❌ GCS upload not configured

### Dependencies
- Certificate Consumer (already covered in Section 1, Step 4)

### Implementation
**See Section 1, Step 4: Create Certificate Consumer**

Certificate flow is handled by the `certificate.consumer.ts`:
- Generates PDF using pdfmake
- Uploads to GCS bucket
- Updates database with certificate URL
- Sends email with download link

**No additional work needed** — implement event consumers first.

---

## Testing Strategy

### Unit Tests

**Pattern**: Match existing test structure in `apps/api-server/src/modules/__tests__/`

**For Each Service**:
```typescript
// Example: tutorial-progress.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TutorialProgressRepository } from '@quiz/db-tutorial';

vi.mock('@quiz/db-tutorial');

describe('TutorialProgressRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('upserts progress correctly', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({
      id: 'test-id',
      userId: 'user-1',
      subtopicId: 'subtopic-1',
      blocksViewed: ['notes'],
      completionPercent: 16.67,
    });
    
    vi.mocked(TutorialProgressRepository.prototype.upsertProgress).mockImplementation(mockUpsert);
    
    const repo = new TutorialProgressRepository();
    const result = await repo.upsertProgress({
      userId: 'user-1',
      subtopicId: 'subtopic-1',
      blockType: 'notes',
      status: 'viewed',
    });
    
    expect(result.blocksViewed).toContain('notes');
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

**For API Routes**:
```typescript
// Example: progress.route.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/tutorial/progress/route';

describe('POST /api/tutorial/progress', () => {
  it('returns 401 without x-user-id header', async () => {
    const req = new Request('http://localhost/api/tutorial/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtopicId: 'test', blockType: 'notes', status: 'viewed' }),
    });
    
    const response = await POST(req as any);
    expect(response.status).toBe(401);
  });
  
  it('upserts progress with valid input', async () => {
    const req = new Request('http://localhost/api/tutorial/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-123',
      },
      body: JSON.stringify({
        subtopicId: '11111111-1111-1111-1111-111111111111',
        blockType: 'notes',
        status: 'viewed',
      }),
    });
    
    const response = await POST(req as any);
    expect(response.status).toBe(200);
  });
});
```

### Manual Testing Checklist

**Tutorial Progress Tracking**:
- [ ] View a subtopic page → Check `tutorial_progress` table for new row
- [ ] View all 6 blocks → Verify `assignmentUnlocked = true`
- [ ] Call `GET /api/tutorial/progress?subtopicId=X` → Verify response

**Batch Capacity**:
- [ ] Enroll student in batch → Verify Redis counter decrements
- [ ] Try enrolling when full → Verify 409 error
- [ ] Cancel enrollment → Verify Redis counter increments

**Assignment Engine**:
- [ ] Complete all content blocks → Verify simple tier unlocked
- [ ] Complete simple tier → Verify mixed tier unlocked
- [ ] Submit help request → Verify row in `assignment_help_requests`

**AI Tutor**:
- [ ] Ask question → Verify Gemini API called
- [ ] Check response includes lesson context
- [ ] Verify rate limiting works (if implemented)

**Event Consumers**:
- [ ] Publish `SESSION_SCHEDULED` event → Verify emails sent
- [ ] Publish `PAYMENT_OVERDUE` event → Verify reminder email
- [ ] Publish `CERTIFICATE_ISSUED` event → Verify PDF generated + uploaded

---

## Deployment Checklist

### Environment Variables to Add

**api-server** (`.env.local` + GCP Secret Manager):
```bash
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Resend Email
RESEND_API_KEY=your_resend_api_key

# GCS for Certificates
GCP_PROJECT_ID=your_project_id
GCP_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Consumer URLs (optional, defaults to api-server)
SKILLUP_SESSION_REMINDER_URL=https://api.yourdomain.com/api/consumers/session-scheduled
PAYMENT_OVERDUE_CONSUMER_URL=https://api.yourdomain.com/api/consumers/payment-overdue
CERTIFICATE_ISSUED_CONSUMER_URL=https://api.yourdomain.com/api/consumers/certificate-issued
```

### Database Migrations

**Run in order**:
```bash
# 1. Assignment engine tables
cd packages/db-tutorial
pnpm drizzle-kit generate
pnpm drizzle-kit push

# 2. Verify materialized view exists
psql $DATABASE_URL_TUTORIAL -c "SELECT * FROM mv_student_weak_areas LIMIT 1;"

# 3. Refresh materialized view
psql $DATABASE_URL_TUTORIAL -c "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_student_weak_areas;"
```

### GCP Setup

**Create GCS Buckets**:
```bash
gsutil mb -l asia-south1 gs://skillup-certificates
gsutil mb -l asia-south1 gs://rth-certificates

# Make buckets publicly readable
gsutil iam ch allUsers:objectViewer gs://skillup-certificates
gsutil iam ch allUsers:objectViewer gs://rth-certificates
```

**Add Secrets**:
```bash
echo -n "your_gemini_key" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "your_resend_key" | gcloud secrets create RESEND_API_KEY --data-file=-
```

### QStash Configuration

**Add Consumer Endpoints**:
1. Go to Upstash Console → QStash
2. Add endpoints:
   - `https://api.yourdomain.com/api/consumers/session-scheduled`
   - `https://api.yourdomain.com/api/consumers/payment-overdue`
   - `https://api.yourdomain.com/api/consumers/certificate-issued`
3. Enable signature verification

---

## Rollback Plan

**If Issues Occur**:

1. **Event Consumers**: Set `QUEUE_ENABLED=false` in `.env.local` to disable async processing
2. **Tutorial Progress**: API routes are additive, no rollback needed
3. **Batch Capacity**: Remove `reserveSlot()` call, revert to database-only checks
4. **Assignment Engine**: Drop tables if needed:
   ```sql
   DROP TABLE IF EXISTS assignment_help_requests;
   DROP TABLE IF EXISTS assignment_progress;
   ```
5. **AI Tutor**: Remove API route, component will gracefully fail
6. **Remediation**: API route is read-only, no rollback needed

**Database Backup Before Changes**:
```bash
# Neon automatic PITR is enabled
# Note timestamp before starting: 2026-03-28 10:00:00 UTC
# Restore via Neon dashboard if needed
```

---

## Success Criteria

**Feature is DONE when**:

1. ✅ Code passes all tests (`pnpm test`)
2. ✅ Manual testing checklist completed
3. ✅ No TypeScript errors (`pnpm typecheck`)
4. ✅ No ESLint errors (`pnpm lint`)
5. ✅ Feature works in local development
6. ✅ Feature works in staging environment
7. ✅ Documentation updated (if needed)
8. ✅ Environment variables added to GCP Secret Manager

---

## Implementation Order (Recommended)

**Week 1: Foundation**
- Day 1-2: Event Consumers (base + 3 consumers)
- Day 3-4: Tutorial Progress Tracking API
- Day 5: Batch Capacity Redis Counter

**Week 2: Tutorial Engine**
- Day 1-2: Assignment Engine (DB + API + UI)
- Day 3: Remediation Engine
- Day 4-5: Testing + Bug Fixes

**Week 3: Advanced Features**
- Day 1-3: AI Tutor / Gemini Integration
- Day 4: SkillUp Notifications (verify consumers work)
- Day 5: SkillUp Certificates (verify consumer works)

**Week 4: Polish + Deploy**
- Day 1-2: Integration testing
- Day 3: Staging deployment
- Day 4: Production deployment
- Day 5: Monitoring + Documentation

---

## Support & References

**Existing Code Patterns**:
- Service pattern: `apps/api-server/src/modules/tutor/tutor.service.ts`
- Repository pattern: `packages/db-tutorial/src/repositories/tutorial-content.repository.ts`
- API route pattern: `apps/api-server/src/app/api/tutorial/faculty/live-sessions/route.ts`
- Cache usage: `apps/api-server/src/modules/core/cache.service.ts`
- Event types: `packages/events/src/types.ts`

**External Documentation**:
- Gemini API: https://ai.google.dev/docs
- Resend API: https://resend.com/docs
- QStash: https://upstash.com/docs/qstash
- Drizzle ORM: https://orm.drizzle.team/docs

**Questions?**
- Check CODE-VERIFICATION-REPORT.md for what exists
- Check PENDING-WORK.md for feature requirements
- Check platform_prompt.md for architecture rules

---

**END OF IMPLEMENTATION GUIDE**
