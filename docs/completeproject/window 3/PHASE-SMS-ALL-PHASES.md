# PHASE-SMS-CORE: Student Management System Core
## docs/blueprints/PHASE-SMS-CORE.md

> Platform: SkillUp IT Academy
> Sprint: SkillUp Sprint 2 (after SkillHubCore SSO complete)

---

## Purpose

Manage the full student lifecycle within SkillUp IT Academy —
from first enquiry through admission, fee payment, batch allocation,
active learning, and eventual placement or certification.

---

## Part 1: Student Lifecycle States

```
ENQUIRY_RECEIVED → ENQUIRY_QUALIFIED → COUNSELLING_DONE
→ ADMISSION_IN_PROGRESS → DOCUMENTS_VERIFIED
→ PAYMENT_PENDING → ENROLLED → BATCH_ALLOCATED
→ LEARNING_IN_PROGRESS → ASSESSMENT_COMPLETE
→ CERTIFIED → PLACEMENT_IN_PROGRESS → PLACED → ALUMNI

Side states:
  PAYMENT_OVERDUE, ON_LEAVE, DROPPED, DEFERRED, BLACKLISTED
```

---

## Part 2: Student DB Schema

```sql
-- ── STUDENTS ──────────────────────────────────────────────────────────────
CREATE TABLE students (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE,  -- references People DB users.id
  enrollment_number   TEXT UNIQUE,           -- auto-generated on enrollment
  admission_type      TEXT NOT NULL CHECK (admission_type IN ('digital','training','hybrid')),
  lifecycle_status    TEXT NOT NULL DEFAULT 'enquiry_received',
  domain_id           UUID,                  -- primary domain of study
  batch_id            UUID,                  -- current active batch
  counsellor_id       UUID,                  -- assigned counsellor (faculty/staff)
  referral_source     TEXT,                  -- 'google', 'instagram', 'referral', 'walk-in'
  referral_by         UUID,                  -- if referred by existing student
  guardian_name       TEXT,
  guardian_phone      TEXT,
  guardian_email      TEXT,
  emergency_contact   JSONB,
  special_needs       TEXT,
  medical_notes       TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_batch ON students(batch_id);
CREATE INDEX idx_students_status ON students(lifecycle_status);

-- ── ENROLLMENTS ────────────────────────────────────────────────────────────
CREATE TABLE enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id),
  course_id       UUID NOT NULL,
  batch_id        UUID,
  status          TEXT DEFAULT 'active' CHECK (
    status IN ('active','completed','dropped','deferred')
  ),
  enrolled_at     TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  dropped_at      TIMESTAMPTZ,
  drop_reason     TEXT
);

-- ── STUDENT DOCUMENTS ─────────────────────────────────────────────────────
CREATE TABLE student_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id),
  doc_type        TEXT NOT NULL CHECK (doc_type IN (
    'id_proof','address_proof','qualification','photo','signature','other'
  )),
  file_url        TEXT NOT NULL,
  file_name       TEXT,
  verified        BOOLEAN DEFAULT false,
  verified_by     UUID,
  verified_at     TIMESTAMPTZ,
  uploaded_at     TIMESTAMPTZ DEFAULT now()
);

-- ── ATTENDANCE RECORDS ────────────────────────────────────────────────────
CREATE TABLE attendance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id),
  session_id      UUID NOT NULL REFERENCES batch_sessions(id),
  batch_id        UUID NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('present','absent','late','excused')),
  marked_by       UUID NOT NULL,  -- faculty user_id
  marked_at       TIMESTAMPTZ DEFAULT now(),
  notes           TEXT,
  UNIQUE(student_id, session_id)
);

CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_session ON attendance_records(session_id);

-- ── STUDENT NOTES (CRM notes by counsellors/admins) ──────────────────────
CREATE TABLE student_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id),
  author_id   UUID NOT NULL,
  note_type   TEXT CHECK (note_type IN ('general','academic','behavioral','financial')),
  content     TEXT NOT NULL,
  is_private  BOOLEAN DEFAULT false,  -- private notes visible only to admins
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## Part 3: StudentService

```typescript
class StudentService {
  // Create student record after admission
  async createStudent(userId: string, admissionData: AdmissionData): Promise<Student>

  // Get full student profile with progress from all engines
  async getStudentProfile(studentId: string): Promise<StudentFullProfile>
  // Aggregates from: Students table + Tutorial DB progress + Exam DB results

  // Update lifecycle status (with audit trail)
  async updateLifecycleStatus(
    studentId: string,
    newStatus: LifecycleStatus,
    changedBy: string,
    reason?: string
  ): Promise<void>

  // Assign to batch
  async assignToBatch(studentId: string, batchId: string): Promise<void>

  // Get all students in a batch
  async getStudentsByBatch(batchId: string): Promise<Student[]>

  // Mark attendance (called by faculty)
  async markAttendance(
    sessionId: string,
    attendanceData: AttendanceEntry[],
    markedBy: string
  ): Promise<void>

  // Get attendance summary
  async getAttendanceSummary(
    studentId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<AttendanceSummary>

  // Get students with low attendance (< 75%)
  async getLowAttendanceStudents(batchId: string): Promise<StudentAttendanceSummary[]>
}
```

---

## Part 4: Admin Dashboard Data

```
Student Management Admin Panels:

/admin/students
  → Table: all students, filterable by status, batch, domain
  → Quick actions: change status, assign batch, add note

/admin/students/:id
  → Full profile: personal info, documents, fee status
  → Progress: tutorial completion % + exam scores (cross-service API calls)
  → Attendance: calendar heatmap view
  → Notes timeline: all counsellor notes chronologically
  → Payment history: installments, dues, receipts

/admin/students/:id/attendance
  → Per-session attendance log
  → Monthly summary: X/Y sessions attended (Z%)
  → Late arrivals, excused absences

/admin/batches/:batchId/attendance
  → Bulk attendance view for entire batch
  → Export to CSV for admin records
```

---

## Part 5: Events Published

```
student.created            → SkillHubCore (creates platform access)
                           → notification-service (welcome email + WhatsApp)
student.enrolled           → tutorial-service (initialize progress records)
                           → payment-service (create payment plan)
student.batch_assigned     → notification-service (batch schedule email)
attendance.marked          → notification-service (absent = alert parent/guardian)
student.status_changed     → notification-service (status-specific email)
student.low_attendance     → notification-service (warning email to student + guardian)
```

---

## Part 6: Verification

```
□ Student created after admission confirmed
□ Enrollment number auto-generated (format: SKU-YYYY-NNNN)
□ Lifecycle status transitions audited (who changed it, when, why)
□ Batch assignment updates student.batch_id
□ Attendance marked for all students in session simultaneously
□ Low attendance flag triggers notification to student + guardian
□ Cross-service: student profile shows tutorial progress
□ Admin can filter students by lifecycle_status
□ Documents stored in Vercel Blob / GCS (not DB)
```

---

*Phase: SMS-CORE | Status: Ready*


# PHASE-SMS-CRM: Enquiry & Admission CRM
## docs/blueprints/PHASE-SMS-CRM.md

> Platform: SkillUp IT Academy + enquiry.skillupitacademy.com
> Sprint: SkillUp Sprint 1 (first module to build)

---

## Purpose

Capture enquiries from multiple channels, qualify leads through a pipeline,
schedule counselling sessions, and convert them to admissions. Includes
automated follow-up via WhatsApp, Email, and SMS.

---

## Part 1: Enquiry Pipeline Stages

```
STAGE 1: NEW           → lead just captured (form/WhatsApp/walk-in/referral)
STAGE 2: CONTACTED     → first call/message sent
STAGE 3: INTERESTED    → confirmed interest, shared brochure
STAGE 4: DEMO_SCHEDULED → booked for free demo class
STAGE 5: DEMO_DONE     → attended demo
STAGE 6: QUALIFIED     → confirmed readiness to enroll
STAGE 7: NEGOTIATING   → discussing fees, batch timing
STAGE 8: CONVERTED     → admission form submitted → becomes Admission record
STAGE 9: LOST          → not interested / chose competitor
STAGE 10: JUNK         → spam / wrong number
```

---

## Part 2: CRM DB Schema

```sql
-- ── ENQUIRIES ─────────────────────────────────────────────────────────────
CREATE TABLE enquiries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT NOT NULL,
  whatsapp          TEXT,
  city              TEXT,
  qualification     TEXT,
  course_interest   TEXT,          -- which domain/subject interested in
  source            TEXT NOT NULL CHECK (source IN (
    'website_form','whatsapp','instagram','google_ad',
    'referral','walk_in','cold_call','email_campaign','other'
  )),
  stage             TEXT NOT NULL DEFAULT 'new',
  assigned_to       UUID,          -- counsellor user_id
  priority          TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  next_followup_at  TIMESTAMPTZ,
  lost_reason       TEXT,
  notes             TEXT,
  utm_source        TEXT,          -- marketing attribution
  utm_medium        TEXT,
  utm_campaign      TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_enquiries_stage ON enquiries(stage);
CREATE INDEX idx_enquiries_assigned ON enquiries(assigned_to);
CREATE INDEX idx_enquiries_followup ON enquiries(next_followup_at);

-- ── ENQUIRY FOLLOW-UPS ─────────────────────────────────────────────────────
CREATE TABLE enquiry_follow_ups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id      UUID NOT NULL REFERENCES enquiries(id),
  follow_up_type  TEXT NOT NULL CHECK (follow_up_type IN ('call','whatsapp','email','sms','visit')),
  status          TEXT NOT NULL CHECK (status IN ('scheduled','completed','no_answer','rescheduled')),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  outcome         TEXT,           -- brief outcome of the follow-up
  next_action     TEXT,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── ADMISSIONS ────────────────────────────────────────────────────────────
CREATE TABLE admissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id        UUID REFERENCES enquiries(id),
  user_id           UUID,          -- created after SkillHubCore registration
  admission_type    TEXT NOT NULL CHECK (admission_type IN ('digital','training','hybrid')),
  course_id         UUID NOT NULL,
  batch_preference  TEXT,          -- morning / evening / weekend
  preferred_start   DATE,
  total_fee         DECIMAL(10,2) NOT NULL,
  discount_amount   DECIMAL(10,2) DEFAULT 0,
  scholarship_id    UUID,
  final_fee         DECIMAL(10,2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','documents_pending','documents_verified',
    'payment_pending','payment_partial','confirmed','cancelled'
  )),
  confirmed_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancel_reason     TEXT,
  created_by        UUID NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ── DEMO SESSIONS ─────────────────────────────────────────────────────────
CREATE TABLE demo_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id      UUID NOT NULL REFERENCES enquiries(id),
  faculty_id      UUID,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER DEFAULT 60,
  mode            TEXT CHECK (mode IN ('online','offline')),
  meet_link       TEXT,
  status          TEXT DEFAULT 'scheduled' CHECK (
    status IN ('scheduled','completed','cancelled','no_show')
  ),
  feedback        TEXT,
  outcome         TEXT,   -- 'converted','needs_followup','not_interested'
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## Part 3: CRMService

```typescript
class CRMService {
  // Capture new enquiry (from web form, WhatsApp webhook, etc.)
  async captureEnquiry(data: EnquiryInput): Promise<Enquiry>

  // Advance stage in pipeline
  async advanceStage(
    enquiryId: string,
    newStage: EnquiryStage,
    updatedBy: string,
    notes?: string
  ): Promise<Enquiry>

  // Schedule follow-up (creates follow_up record + Upstash Workflow trigger)
  async scheduleFollowUp(
    enquiryId: string,
    followUpData: FollowUpInput,
    createdBy: string
  ): Promise<FollowUp>

  // Convert enquiry to admission
  async convertToAdmission(
    enquiryId: string,
    admissionData: AdmissionInput,
    createdBy: string
  ): Promise<Admission>
  // → Marks enquiry.stage = 'converted'
  // → Creates admission record
  // → Triggers: register user in SkillHubCore
  // → Triggers: create student record in students table
  // → Triggers: create payment plan in payment-service

  // Get pipeline metrics (for admin dashboard)
  async getPipelineMetrics(dateRange: DateRange): Promise<PipelineMetrics>
  // Returns: counts per stage, conversion rate, avg time per stage

  // Get overdue follow-ups (scheduled but not completed)
  async getOverdueFollowUps(assignedTo?: string): Promise<FollowUp[]>
}
```

---

## Part 4: Automated Follow-Up Workflows (Upstash Workflow)

```typescript
// Workflow 1: New enquiry follow-up sequence
// Triggers on: enquiry.created event
async function newEnquiryWorkflow(enquiryId: string) {
  // Day 0 (immediate): WhatsApp welcome message
  await sendWhatsApp(enquiry.whatsapp, 'welcome_template', { name: enquiry.name })

  // Day 1 (24h later): Follow-up call reminder to counsellor
  await workflow.sleep('24 hours')
  await sendNotification(counsellor, 'call_reminder', { enquiryId })

  // Day 3: If still in 'new' stage → auto WhatsApp with brochure
  await workflow.sleep('48 hours')
  const current = await getEnquiry(enquiryId)
  if (current.stage === 'new') {
    await sendWhatsApp(enquiry.whatsapp, 'brochure_template', { pdfUrl })
  }

  // Day 7: If not contacted → escalate to manager
  await workflow.sleep('96 hours')
  const final = await getEnquiry(enquiryId)
  if (final.stage === 'new' || final.stage === 'contacted') {
    await escalateToManager(enquiryId, 'no_progress_7_days')
  }
}

// Workflow 2: Demo session reminder
async function demoReminderWorkflow(demoSessionId: string) {
  const demo = await getDemoSession(demoSessionId)

  // 24h before: Email + WhatsApp reminder
  const timeUntilDemo = demo.scheduledAt.getTime() - Date.now()
  await workflow.sleep(Math.max(0, timeUntilDemo - 86400000))
  await sendDemoReminder(demo, '24h')

  // 1h before: WhatsApp with meeting link
  await workflow.sleep(82800000) // 23 more hours
  await sendDemoReminder(demo, '1h')
}
```

---

## Part 5: WhatsApp Integration

```typescript
// Using Meta Business API via notification-service
// Templates must be pre-approved by Meta

const WHATSAPP_TEMPLATES = {
  welcome_template: {
    name: 'skillup_welcome',
    language: 'en',
    components: [
      { type: 'body', parameters: [{ type: 'text', text: '{{1}}' }] }
      // "Hello {{name}}, thanks for enquiring about SkillUp IT Academy!"
    ]
  },
  brochure_template: {
    name: 'skillup_brochure',
    language: 'en',
    components: [
      { type: 'header', parameters: [{ type: 'document', link: '{{pdf_url}}' }] }
    ]
  },
  fee_reminder_template: {
    name: 'skillup_fee_reminder',
    language: 'en',
    // "Hi {{name}}, your installment of ₹{{amount}} is due on {{date}}"
  }
}
```

---

## Part 6: CRM App Structure

```
apps/crm-app/src/app/
├── (crm)/
│   ├── dashboard/
│   │   └── page.tsx        → Pipeline funnel chart, today's follow-ups
│   ├── enquiries/
│   │   ├── page.tsx        → Kanban board view (stages as columns)
│   │   ├── [id]/page.tsx   → Full enquiry detail + follow-up history
│   │   └── new/page.tsx    → New enquiry capture form
│   ├── follow-ups/
│   │   └── page.tsx        → My scheduled follow-ups (calendar view)
│   ├── admissions/
│   │   ├── page.tsx        → All admissions + status filter
│   │   └── [id]/page.tsx   → Admission detail + document status
│   └── reports/
│       └── page.tsx        → Conversion rates, source attribution, revenue forecast
```

---

## Part 7: Verification

```
□ Web form submission creates enquiry record
□ Counsellor assigned immediately (round-robin or manual)
□ WhatsApp welcome message sent within 30 seconds of enquiry
□ Stage change logged with timestamp and user
□ Follow-up workflow starts on enquiry creation
□ Demo session reminder sent 24h and 1h before
□ Conversion creates: admission, student, SkillHubCore user, payment plan
□ Pipeline metrics show correct counts per stage
□ Overdue follow-ups appear in counsellor dashboard
□ UTM parameters captured for marketing attribution
```

---

*Phase: SMS-CRM | Status: Ready*

# PHASE-SMS-PAYMENT: Payment Engine
## docs/blueprints/PHASE-SMS-PAYMENT.md

> Priority: HIGH — financial data, legal obligation
> Gateway: Razorpay (India) + Stripe (International) + Manual offline

---

## Part 1: Payment Plan Types

```
Plan A: One-Time (full fee upfront)
  → Single transaction, immediate enrollment confirmation

Plan B: Monthly Installments (fixed EMI)
  → Split across N months (admin configurable: 2, 3, 6, 12)
  → Due date: same day each month as admission date

Plan C: Custom Schedule (admin-defined dates + amounts)
  → Each installment has own amount + due date
  → Used for special cases: scholarships, negotiated plans

Plan D: Free (scholarship / full waiver)
  → Fee = 0, enrollment confirmed immediately
  → Requires admin approval + reason

Plan E: RealTutorialHub subscription (recurring)
  → Monthly or annual, auto-debit via Razorpay/Stripe subscriptions
```

---

## Part 2: Payment DB Schema

```sql
-- ── PAYMENT PLANS ─────────────────────────────────────────────────────────
CREATE TABLE payment_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL,
  admission_id      UUID,
  plan_type         TEXT NOT NULL CHECK (plan_type IN (
    'one_time','monthly','custom','free','subscription'
  )),
  total_amount      DECIMAL(10,2) NOT NULL,
  discount_amount   DECIMAL(10,2) DEFAULT 0,
  scholarship_id    UUID,
  final_amount      DECIMAL(10,2) NOT NULL,
  currency          VARCHAR(3) DEFAULT 'INR',
  status            TEXT DEFAULT 'active' CHECK (
    status IN ('active','completed','cancelled','defaulted')
  ),
  created_by        UUID,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ── PAYMENT INSTALLMENTS ───────────────────────────────────────────────────
CREATE TABLE payment_installments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES payment_plans(id),
  student_id      UUID NOT NULL,
  installment_no  INTEGER NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  due_date        DATE NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (
    status IN ('pending','paid','overdue','waived','failed')
  ),
  paid_at         TIMESTAMPTZ,
  payment_txn_id  UUID,
  late_fee        DECIMAL(10,2) DEFAULT 0,
  reminder_count  INTEGER DEFAULT 0,
  last_reminded   TIMESTAMPTZ,
  UNIQUE(plan_id, installment_no)
);

CREATE INDEX idx_installments_due ON payment_installments(due_date, status);
CREATE INDEX idx_installments_student ON payment_installments(student_id);

-- ── PAYMENT TRANSACTIONS (immutable ledger) ────────────────────────────────
CREATE TABLE payment_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL,
  installment_id    UUID REFERENCES payment_installments(id),
  plan_id           UUID REFERENCES payment_plans(id),
  amount            DECIMAL(10,2) NOT NULL,
  currency          VARCHAR(3) DEFAULT 'INR',
  gateway           TEXT NOT NULL CHECK (gateway IN ('razorpay','stripe','manual')),
  gateway_order_id  TEXT,
  gateway_payment_id TEXT,
  gateway_signature TEXT,
  status            TEXT NOT NULL CHECK (
    status IN ('pending','success','failed','refunded')
  ),
  failure_reason    TEXT,
  receipt_url       TEXT,
  processed_by      UUID,  -- admin user if manual entry
  processed_at      TIMESTAMPTZ DEFAULT now(),
  metadata          JSONB  -- raw gateway response
);

-- CRITICAL: payment_transactions is append-only (no UPDATE, no DELETE)
-- Only INSERT allowed — financial audit trail must never be modified

CREATE INDEX idx_transactions_student ON payment_transactions(student_id);
CREATE INDEX idx_transactions_gateway ON payment_transactions(gateway_payment_id);

-- ── SCHOLARSHIPS ──────────────────────────────────────────────────────────
CREATE TABLE scholarships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value  DECIMAL(10,2) NOT NULL,
  max_uses        INTEGER,
  current_uses    INTEGER DEFAULT 0,
  valid_from      DATE,
  valid_until     DATE,
  criteria        JSONB,  -- eligibility rules
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── WEBHOOK LOGS (idempotent processing) ──────────────────────────────────
CREATE TABLE gateway_webhook_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway         TEXT NOT NULL,
  event_id        TEXT NOT NULL UNIQUE,  -- gateway's event ID (idempotency)
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  processed       BOOLEAN DEFAULT false,
  processed_at    TIMESTAMPTZ,
  error           TEXT,
  received_at     TIMESTAMPTZ DEFAULT now()
);
```

---

## Part 3: Payment Gateway Abstraction

```typescript
// services/payment-service/src/modules/gateways/gateway.interface.ts

interface IPaymentGateway {
  createOrder(params: CreateOrderParams): Promise<GatewayOrder>
  verifyPayment(params: VerifyParams): Promise<VerifyResult>
  processRefund(params: RefundParams): Promise<RefundResult>
  getPaymentStatus(gatewayOrderId: string): Promise<PaymentStatus>
  createSubscription?(params: SubscriptionParams): Promise<Subscription>
  cancelSubscription?(subscriptionId: string): Promise<void>
}

// Currency routing (automatic based on student country + currency):
function selectGateway(currency: string, country: string): IPaymentGateway {
  if (currency === 'INR' || country === 'IN') return razorpayGateway
  if (['USD','EUR','GBP','AED','SGD'].includes(currency)) return stripeGateway
  return manualGateway  // admin offline entry for edge cases
}
```

---

## Part 4: Payment Follow-Up Workflow (Upstash Workflow)

```typescript
// Triggers every day at 9:00 AM UTC via Upstash Workflow

async function dailyPaymentFollowUp() {
  // Find all overdue installments
  const overdueInstallments = await db.query.paymentInstallments.findMany({
    where: and(
      eq(paymentInstallments.status, 'pending'),
      lte(paymentInstallments.dueDate, new Date())
    )
  })

  for (const installment of overdueInstallments) {
    const daysOverdue = daysBetween(installment.dueDate, new Date())

    if (daysOverdue === 1) {
      // Day 1 overdue: WhatsApp reminder
      await sendWhatsApp(student, 'payment_overdue_day1', { amount, dueDate })
    }

    if (daysOverdue === 3) {
      // Day 3: Email + SMS + WhatsApp
      await sendAllChannels(student, 'payment_overdue_day3', { amount, daysOverdue })
    }

    if (daysOverdue === 7) {
      // Day 7: Escalate to admin + send formal notice
      await notifyAdmin('payment_critical_overdue', { studentId, amount, daysOverdue })
      await sendFormalNotice(student, { amount, deadline: addDays(new Date(), 7) })
    }

    if (daysOverdue === 14) {
      // Day 14: Auto-suspend access
      await suspendStudentAccess(installment.studentId, 'payment_overdue_14_days')
      await updateInstallmentStatus(installment.id, 'overdue')
    }
  }
}
```

---

## Part 5: Razorpay Webhook Handler

```typescript
// POST /api/webhooks/razorpay
async function handleRazorpayWebhook(req: Request) {
  const signature = req.headers.get('x-razorpay-signature')
  const body = await req.text()

  // 1. Verify webhook signature
  if (!verifyRazorpaySignature(body, signature, process.env.RAZORPAY_WEBHOOK_SECRET!)) {
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(body)

  // 2. Idempotency check (prevent double processing)
  const existing = await db.query.gatewayWebhookLogs.findFirst({
    where: eq(gatewayWebhookLogs.eventId, event.id)
  })
  if (existing?.processed) return new Response('Already processed', { status: 200 })

  // 3. Log webhook (before processing — even if processing fails)
  await db.insert(gatewayWebhookLogs).values({
    gateway: 'razorpay', eventId: event.id,
    eventType: event.event, payload: event
  })

  // 4. Process based on event type
  switch (event.event) {
    case 'payment.captured':
      await markInstallmentPaid(event.payload.payment.entity)
      await publishEvent('payment.received', { ...paymentData })
      break
    case 'payment.failed':
      await handlePaymentFailure(event.payload)
      break
    case 'subscription.charged':
      await handleSubscriptionCharged(event.payload)
      break
  }

  // 5. Mark as processed
  await db.update(gatewayWebhookLogs)
    .set({ processed: true, processedAt: new Date() })
    .where(eq(gatewayWebhookLogs.eventId, event.id))

  return new Response('OK', { status: 200 })
}
```

---

## Part 6: Payment Admin Panel

```
/admin/payments
  → All installments filterable: overdue, due this week, paid this month
  → Total collected vs expected (revenue dashboard)
  → Export: CSV of all transactions

/admin/payments/manual-entry
  → Form: student search, amount, payment mode (cash/cheque/bank transfer)
  → Creates payment_transaction with gateway = 'manual'
  → Requires: receipt number, processed_by (admin user)

/admin/payments/:studentId
  → Student's full payment history
  → Create payment plan
  → Add discount / apply scholarship
  → Mark installment as waived (with reason)
  → Download receipt PDF
```

---

## Part 7: Verification

```
□ Razorpay order created and payment flow works end-to-end
□ Stripe payment works for international currency
□ Manual offline entry creates transaction with admin's user ID
□ Webhook idempotency: same Razorpay event processed only once
□ payment_transactions is append-only (no updates possible)
□ Overdue workflow fires daily at 9:00 AM
□ Student access suspended after 14 days overdue
□ Scholarship discount applied correctly to final_amount
□ Receipt PDF generated and emailed on payment.received
□ Admin can filter all overdue installments
□ Currency routing: INR → Razorpay, USD → Stripe (automatic)
```

---

*Phase: SMS-PAYMENT | Status: Ready*

# PHASE-SMS-BATCH: Batch Management & Attendance
## docs/blueprints/PHASE-SMS-BATCH.md

> Platform: SkillUp IT Academy
> Subdomain: schedule.skillupitacademy.com + attendance.skillupitacademy.com

---

## Part 1: Batch Structure

```
Batch = A cohort of students studying the same course with the same faculty
        on a fixed schedule (days + times + mode)

Example:
  Batch: "Full Stack Web Dev — Batch 12 — Morning"
  Course: Full Stack Web Development (Domain)
  Faculty: John Doe
  Schedule: Mon/Wed/Fri, 10:00 AM – 12:00 PM
  Mode: Online (Google Meet) OR Offline (Classroom A)
  Start Date: 2026-04-01
  End Date: 2026-09-30
  Capacity: 30 students
  Enrolled: 24 students
```

---

## Part 2: Batch DB Schema

```sql
-- ── COURSES ───────────────────────────────────────────────────────────────
CREATE TABLE courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id       UUID NOT NULL,     -- references hierarchy
  name            TEXT NOT NULL,
  description     TEXT,
  duration_weeks  INTEGER,
  fee_inr         DECIMAL(10,2),
  fee_usd         DECIMAL(10,2),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── BATCHES ───────────────────────────────────────────────────────────────
CREATE TABLE batches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         UUID NOT NULL REFERENCES courses(id),
  name              TEXT NOT NULL,
  batch_code        TEXT UNIQUE,      -- e.g., "FSWD-B12-AM"
  faculty_id        UUID,             -- primary faculty
  mode              TEXT NOT NULL CHECK (mode IN ('online','offline','hybrid')),
  schedule_days     TEXT[],           -- ['monday','wednesday','friday']
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  timezone          TEXT DEFAULT 'Asia/Kolkata',
  start_date        DATE NOT NULL,
  end_date          DATE,
  capacity          INTEGER DEFAULT 30,
  enrolled_count    INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'upcoming' CHECK (
    status IN ('upcoming','active','completed','cancelled')
  ),
  meet_link         TEXT,             -- Google Meet / Zoom link for online
  room              TEXT,             -- classroom name for offline
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_faculty ON batches(faculty_id);

-- ── BATCH ENROLLMENTS ─────────────────────────────────────────────────────
CREATE TABLE batch_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES batches(id),
  student_id    UUID NOT NULL REFERENCES students(id),
  enrolled_at   TIMESTAMPTZ DEFAULT now(),
  status        TEXT DEFAULT 'active' CHECK (
    status IN ('active','completed','dropped','transferred')
  ),
  transferred_to UUID,  -- if transferred to another batch
  UNIQUE(batch_id, student_id)
);

-- ── BATCH SESSIONS (individual class sessions) ────────────────────────────
CREATE TABLE batch_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID NOT NULL REFERENCES batches(id),
  faculty_id      UUID NOT NULL,
  session_date    DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  topic_covered   TEXT,              -- what was taught in this session
  subtopic_ids    UUID[],            -- which subtopics were covered
  mode            TEXT CHECK (mode IN ('online','offline','hybrid')),
  recording_url   TEXT,
  notes           TEXT,
  status          TEXT DEFAULT 'scheduled' CHECK (
    status IN ('scheduled','in_progress','completed','cancelled')
  ),
  cancelled_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_batch ON batch_sessions(batch_id);
CREATE INDEX idx_sessions_date ON batch_sessions(session_date);

-- ── FACULTY BATCH ASSIGNMENTS ─────────────────────────────────────────────
CREATE TABLE faculty_batch_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id  UUID NOT NULL,
  batch_id    UUID NOT NULL REFERENCES batches(id),
  role        TEXT DEFAULT 'primary' CHECK (role IN ('primary','substitute','assistant')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  ended_at    TIMESTAMPTZ,
  UNIQUE(faculty_id, batch_id, role)
);
```

---

## Part 3: BatchService

```typescript
class BatchService {
  async createBatch(data: CreateBatchInput): Promise<Batch>
  async enrollStudent(batchId: string, studentId: string): Promise<BatchEnrollment>
  async transferStudent(studentId: string, fromBatch: string, toBatch: string): Promise<void>

  // Auto-generate sessions for entire batch duration
  async generateBatchSessions(batchId: string): Promise<BatchSession[]>
  // Uses batch.schedule_days + start/end dates to create all sessions upfront

  // Mark attendance for a session (faculty action)
  async markSessionAttendance(
    sessionId: string,
    attendance: Array<{ studentId: string; status: AttendanceStatus }>,
    markedBy: string
  ): Promise<void>

  // Get attendance percentage for student
  async getStudentAttendance(
    studentId: string,
    batchId: string
  ): Promise<{ percentage: number; present: number; total: number }>

  // Get students with < 75% attendance in a batch
  async getLowAttendance(batchId: string): Promise<LowAttendanceReport[]>

  // Record subtopics covered in session (links to Tutorial Engine)
  async recordSessionContent(
    sessionId: string,
    subtopicIds: string[],
    topicCovered: string
  ): Promise<void>
  // After recording: publishes event so tutorial-service can
  // unlock those subtopics for enrolled students
}
```

---

## Part 4: Attendance Marking UI (Faculty)

```
Route: attend.skillupitacademy.com/{sessionId}
       OR faculty-app /my-batches/{batchId}/sessions/{sessionId}/attendance

Page layout:
  Session header: Date, Time, Batch name, Faculty name
  Student list: all enrolled students (alphabetical)
    Each row: Name | Roll No | P / A / L / E toggle buttons
  Bulk actions: "Mark All Present" button
  Submit: saves attendance + triggers parent notifications for absents
  Timer: shows session start/end countdown

Faculty can edit attendance for up to 24 hours after session ends.
After 24 hours: locked (only admin can override with reason).
```

---

## Part 5: Events Published

```
batch.session_completed     → tutorial-service: unlock subtopics covered
                            → notification-service: session summary to students
attendance.session_marked   → notification-service: alert absent students + parents
batch.student_low_attendance → notification-service: warning to student + guardian
batch.student_enrolled      → notification-service: welcome to batch email + schedule
batch.session_cancelled     → notification-service: cancellation alert to all students
```

---

## Part 6: Schedule Subdomain

```
schedule.skillupitacademy.com

Student view:
  - My timetable (weekly calendar view)
  - Upcoming sessions (next 7 days)
  - Recording links (past sessions)
  - Holiday / cancelled session markers

Faculty view:
  - All my batches timetable
  - Today's sessions
  - Session history with attendance summary

Admin view:
  - All batch schedules
  - Clash detection (faculty double-booked)
  - Room booking management (offline batches)
```

---

## Part 7: Verification

```
□ Batch creation auto-generates all sessions for duration
□ Student enrolled in batch receives timetable email
□ Faculty can mark attendance session-by-session
□ Attendance locked after 24 hours (admin override available)
□ < 75% attendance triggers warning notification
□ < 60% attendance triggers admin escalation
□ Subtopics recorded in session unlock in tutorial-service
□ Cancelled session notifies all enrolled students immediately
□ Recording URL saved to session record after class
□ Batch capacity enforcement: cannot exceed enrolled_count = capacity
```

---

*Phase: SMS-BATCH | Status: Ready*
