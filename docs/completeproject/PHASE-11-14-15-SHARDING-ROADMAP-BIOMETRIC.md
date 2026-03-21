# Phase 11: Data Sharding & Lifecycle Management
## docs/blueprints/PHASE-11-DATA-SHARDING.md

> Trigger: when any single table exceeds 100M rows
> Applies first to: exam_sessions, exam_answers, tutorial_progress

---

## Part 1: When to Shard

```
CURRENT SCALE (no sharding needed):
  exam_sessions:    < 10M rows     → fine on single table
  exam_answers:     < 100M rows    → fine
  tutorial_progress: < 50M rows   → fine

TRIGGER SHARDING WHEN:
  Any table: > 100M rows AND query p95 > 100ms despite indexes
  OR: Neon storage > 10GB on a single table
  OR: Vacuum taking > 1 hour (autovacuum blocking issue)

EXPECTED TIMELINE:
  1M students × 20 exams × 30 questions = 600M rows in exam_answers
  → Sharding needed at ~500K active students
  → Estimated timeline: 18–24 months at current growth
```

---

## Part 2: Table Partitioning (First Step — Before Sharding)

```sql
-- Step 1: Partition exam_answers by month (range partitioning)
-- This is MUCH simpler than sharding and handles 10x the scale

-- Create partitioned table (replace existing):
CREATE TABLE exam_answers_partitioned (
  id              UUID NOT NULL,
  exam_session_id UUID NOT NULL,
  question_id     UUID NOT NULL,
  user_id         UUID NOT NULL,
  answer          JSONB,
  is_correct      BOOLEAN,
  score           DECIMAL(5,2),
  answered_at     TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (answered_at);

-- Create monthly partitions (auto-create via cron):
CREATE TABLE exam_answers_2026_01
  PARTITION OF exam_answers_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE exam_answers_2026_02
  PARTITION OF exam_answers_partitioned
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Benefits:
-- Old partitions (> 6 months) can be moved to cold storage
-- Queries filtering by date only scan relevant partitions
-- VACUUM runs per-partition (smaller, faster)
```

---

## Part 3: Data Lifecycle (Archive Strategy)

```typescript
// Monthly cleanup job (Upstash Workflow, runs 1st of each month):
async function monthlyDataLifecycle() {
  const cutoffDate = subMonths(new Date(), 6)

  // STEP 1: Export old partition to GCS (cold storage)
  await exportPartitionToGCS(
    `exam_answers_${formatMonth(cutoffDate)}`,
    `gs://platform-archive/exam-answers/${formatMonth(cutoffDate)}.parquet`
  )

  // STEP 2: Verify export integrity (row count match)
  const dbCount = await getPartitionRowCount(cutoffDate)
  const gcsCount = await getGCSRowCount(`.../${formatMonth(cutoffDate)}.parquet`)
  if (dbCount !== gcsCount) throw new Error('Archive integrity check failed')

  // STEP 3: Detach partition from main table (data still in Neon, just detached)
  await sql`ALTER TABLE exam_answers_partitioned DETACH PARTITION exam_answers_${formatMonth(cutoffDate)}`

  // STEP 4: Drop detached partition after 30 days (safety window)
  // Scheduled for 30 days later via Upstash Workflow delay
}
```

---

## Part 4: Materialized Views for Analytics

```sql
-- Refresh nightly — replaces expensive real-time aggregation queries

CREATE MATERIALIZED VIEW mv_daily_exam_stats AS
SELECT
  DATE_TRUNC('day', completed_at) AS day,
  domain_id,
  COUNT(*) AS exams_completed,
  AVG(total_score) AS avg_score,
  COUNT(CASE WHEN total_score >= 60 THEN 1 END) AS passed_count
FROM exam_sessions
WHERE status = 'completed'
  AND completed_at >= NOW() - INTERVAL '90 days'
GROUP BY 1, 2;

CREATE UNIQUE INDEX ON mv_daily_exam_stats(day, domain_id);

-- Refresh:
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_exam_stats;
-- Schedule: daily at 2 AM UTC (Upstash Workflow or Vercel Cron)
```

---

## Part 5: Neon Branching for Schema Changes

```bash
# Safe schema changes using Neon branches:
# 1. Create branch from main
neon branches create --name "schema-add-partition-2026-07"

# 2. Test migration on branch
DATABASE_URL=$(neon branches get-connection-string schema-add-partition-2026-07)
pnpm --filter @platform/db-exam run migrate

# 3. Verify: run queries, check performance
# 4. Merge to main
# 5. Run migration on production
```

---

## Part 6: Verification

```
□ Table partitioning set up for exam_answers (monthly)
□ New partition created automatically each month (Upstash Workflow)
□ Old partitions exported to GCS with integrity check
□ Materialized views refreshed nightly
□ Query performance: p95 < 50ms on partitioned tables
□ Admin analytics uses materialized view (not live table scan)
□ Archive exports verified: row counts match before detach
□ Neon storage under 8GB per database (free tier safe)
```

---

*Phase: 11-DATA-SHARDING | Status: Ready*

---
---

# Phase 14: Roadmap UI Blueprint
## docs/blueprints/PHASE-14-ROADMAP-UI.md

> Route: admin.realtutorialhub.com/roadmap
> Purpose: Live dashboard showing architecture phase completion

---

## Part 1: What It Shows

```
A visual dashboard that turns all the architecture .md files into
a live, queryable status board.

Admin sees:
  ┌────────────────────────────────────────────────────────┐
  │  Platform Roadmap                                      │
  │  Phase 1: ████████████████░░  91% (40/44 tasks)       │
  │  Phase 2: ████░░░░░░░░░░░░░░  13% (7/53 tasks)        │
  │  Phase 3: ░░░░░░░░░░░░░░░░░░   0%                     │
  │  Tutorial T1-T10: varies                               │
  │  SkillHubCore:    0%                                   │
  │  SkillUp:         0%                                   │
  └────────────────────────────────────────────────────────┘
```

---

## Part 2: DB Schema

```sql
-- In People DB (admin-accessible):
CREATE TABLE roadmap_phases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_code  TEXT NOT NULL UNIQUE,  -- 'PHASE-1', 'PHASE-T1', etc.
  name        TEXT NOT NULL,
  description TEXT,
  total_tasks INTEGER DEFAULT 0,
  sort_order  INTEGER
);

CREATE TABLE roadmap_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id    UUID NOT NULL REFERENCES roadmap_phases(id),
  task_number INTEGER NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'not_started' CHECK (
    status IN ('not_started','in_progress','done','skipped','blocked')
  ),
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes       TEXT,
  UNIQUE(phase_id, task_number)
);

CREATE TABLE roadmap_dependencies (
  dependent_task_id UUID NOT NULL REFERENCES roadmap_tasks(id),
  depends_on_task_id UUID NOT NULL REFERENCES roadmap_tasks(id),
  PRIMARY KEY (dependent_task_id, depends_on_task_id)
);
```

---

## Part 3: Admin UI Features

```
Features:
  1. Phase overview: progress bars per phase
  2. Task list per phase: filterable by status
  3. Task detail: mark as done, add notes, record who completed it
  4. Dependency view: which tasks are blocked waiting on others
  5. Timeline estimate: given velocity, when will Phase 3 complete?
  6. Export: CSV of all tasks with statuses (for stakeholder reporting)

Route structure:
  /admin/roadmap              → phase overview grid
  /admin/roadmap/[phaseCode]  → task list for phase
  /admin/roadmap/[phaseCode]/[taskNumber] → task detail
```

---

## Part 4: Seed Data

```typescript
// Seed all phases and tasks from architecture docs
// Run once during initial setup

const PHASES = [
  { code: 'PHASE-1', name: 'Critical Foundation', totalTasks: 44 },
  { code: 'PHASE-2', name: 'Architectural Foundation', totalTasks: 53 },
  { code: 'PHASE-3', name: 'Scale Preparation', totalTasks: 36 },
  { code: 'PHASE-4', name: 'Enterprise FAANG-Grade', totalTasks: 31 },
  { code: 'PHASE-T1', name: 'Tutorial Foundation', totalTasks: 20 },
  { code: 'PHASE-T3', name: 'Assignment Engine', totalTasks: 15 },
  { code: 'PHASE-T4', name: 'Project Engine', totalTasks: 12 },
  { code: 'PHASE-T5', name: 'Remediation Engine', totalTasks: 10 },
  { code: 'PHASE-T6', name: 'AI Tutor', totalTasks: 10 },
  { code: 'PHASE-T7', name: 'Gamification', totalTasks: 12 },
  { code: 'SKILLHUBCORE', name: 'SkillHubCore Platform', totalTasks: 18 },
  { code: 'SKILLUP', name: 'SkillUp IT Academy', totalTasks: 25 },
  { code: 'GAP-G1', name: 'Accessibility (WCAG)', totalTasks: 8 },
  { code: 'GAP-G3', name: 'Disaster Recovery', totalTasks: 7 },
  { code: 'GAP-G4', name: 'Rate Limiting', totalTasks: 8 },
]
```

---

## Part 5: Verification

```
□ All phases visible on roadmap overview page
□ Task status can be updated by admin
□ Completed tasks show who completed them and when
□ Progress bar accurate (completed/total)
□ Blocked tasks show which dependency is missing
□ Export to CSV works with all columns
□ Timeline estimate shown per phase based on completion velocity
```

---

*Phase: 14-ROADMAP-UI | Status: Ready*

---
---

# Phase 15: Biometric Passkey Guard
## docs/blueprints/PHASE-15-BIOMETRIC-GUARD.md

> Applies to: Super admin access + faculty exam creation
> Standard: WebAuthn / FIDO2 / Passkeys

---

## Part 1: What It Protects

```
Even if admin password is stolen:
  → Cannot access admin panel without biometric/device verification
  → Cannot create/delete exam questions without passkey
  → Cannot modify student scores without passkey
  → Cannot process refunds without passkey

Protected actions:
  - Login to admin.realtutorialhub.com
  - Publish/delete tutorial content
  - Override exam scores
  - Process payment refunds
  - Grant/revoke admin roles
  - Access audit logs
```

---

## Part 2: WebAuthn Setup

```typescript
// packages/auth/src/passkey.ts
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'

const RP_NAME = 'RealTutorialHub Admin'
const RP_ID = 'admin.realtutorialhub.com'
const ORIGIN = 'https://admin.realtutorialhub.com'

// Step 1: Generate registration options (sent to browser)
export async function startPasskeyRegistration(userId: string) {
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: userId,
    userName: adminUser.email,
    userDisplayName: adminUser.name,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',  // device-native (Face ID, Touch ID, Windows Hello)
      requireResidentKey: true,
      userVerification: 'required',
    },
  })

  // Store challenge in Redis (expires in 5 minutes)
  await redis.setex(`passkey:challenge:${userId}`, 300, options.challenge)
  return options
}

// Step 2: Verify registration
export async function finishPasskeyRegistration(userId: string, response: RegistrationResponse) {
  const challenge = await redis.get(`passkey:challenge:${userId}`)
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  })

  if (verification.verified) {
    // Save credential to DB
    await db.insert(adminPasskeys).values({
      userId,
      credentialId: verification.registrationInfo!.credentialID,
      publicKey: verification.registrationInfo!.credentialPublicKey,
      counter: verification.registrationInfo!.counter,
      deviceType: verification.registrationInfo!.credentialDeviceType,
    })
  }
}

// Step 3: Authentication (login with passkey)
export async function authenticateWithPasskey(userId: string, response: AuthenticationResponse) {
  const passkey = await db.query.adminPasskeys.findFirst({
    where: eq(adminPasskeys.userId, userId)
  })
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: storedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: {
      credentialPublicKey: passkey.publicKey,
      credentialID: passkey.credentialId,
      counter: passkey.counter,
    },
  })
  return verification.verified
}
```

---

## Part 3: DB Schema

```sql
CREATE TABLE admin_passkeys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  credential_id   TEXT NOT NULL UNIQUE,
  public_key      BYTEA NOT NULL,
  counter         BIGINT DEFAULT 0,
  device_type     TEXT,  -- 'platform' (Face ID, Touch ID) or 'cross-platform' (YubiKey)
  transports      TEXT[],
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_used_at    TIMESTAMPTZ
);
```

---

## Part 4: Admin Login Flow

```
1. Admin enters email + password (first factor)
2. If credentials valid AND has passkey registered:
   → "Verify with your device" prompt appears
   → Browser triggers Face ID / Touch ID / Windows Hello
   → On success: full admin access granted
   → On failure: access denied (even with correct password)

3. If no passkey registered yet:
   → Force registration flow before first admin action
   → "You must set up a passkey to continue"

4. Sensitive action (score override, refund, role grant):
   → Step-up authentication: passkey verification required even
     if already logged in (session-based re-verification)
```

---

## Part 5: Verification

```
□ Admin cannot access admin panel with password alone (passkey required)
□ Face ID / Touch ID works on macOS + iOS devices
□ Windows Hello works on Windows 11
□ Android fingerprint works on Chrome Mobile
□ Passkey registration forced on first login
□ Score override requires passkey re-verification (step-up auth)
□ Refund processing requires passkey re-verification
□ Passkey counter increments on each use (replay attack prevention)
□ Lost device: admin can revoke passkey via backup admin account
□ Audit log: every passkey authentication recorded
```

---

*Phase: 15-BIOMETRIC-GUARD | Status: Ready*
