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
