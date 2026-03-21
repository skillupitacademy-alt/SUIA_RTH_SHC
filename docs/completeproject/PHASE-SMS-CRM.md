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
