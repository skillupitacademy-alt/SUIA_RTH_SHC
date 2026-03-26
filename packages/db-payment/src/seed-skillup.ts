import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { and, eq } from 'drizzle-orm';
import { neon, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

import { db, paymentInstallments, paymentPlans } from './index';

neonConfig.webSocketConstructor = WebSocket;

const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

const authDatabaseUrl = process.env.DATABASE_URL;
if (!authDatabaseUrl) {
  throw new Error('DATABASE_URL is required to seed payment data');
}

const authSql = neon(authDatabaseUrl);

async function getStudentUserId() {
  const rows = (await authSql`
    SELECT id
    FROM users
    WHERE email = ${'student@skillupitacademy.com'}
    LIMIT 1
  `) as Array<{ id: string }>;

  const row = rows[0];
  if (!row) {
    throw new Error('student@skillupitacademy.com was not found in the auth database');
  }
  return row.id;
}

async function upsertPaymentPlan(userId: string) {
  const existing = await db.select({ id: paymentPlans.id }).from(paymentPlans).where(eq(paymentPlans.userId, userId)).limit(1);
  const payload = {
    userId,
    status: 'active' as const,
    planType: 'installment' as const,
    totalAmount: 30000,
  };

  if (existing.length > 0) {
    await db.update(paymentPlans).set(payload).where(eq(paymentPlans.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await db.insert(paymentPlans).values(payload).returning({ id: paymentPlans.id });
  return row.id;
}

async function upsertInstallment(planId: string, installmentNumber: number, dueDate: string, amount: number, status: 'paid' | 'due', paymentRef: string) {
  const existing = await db
    .select({ id: paymentInstallments.id })
    .from(paymentInstallments)
    .where(and(eq(paymentInstallments.planId, planId), eq(paymentInstallments.installmentNumber, installmentNumber)))
    .limit(1);

  const payload = {
    planId,
    installmentNumber,
    dueDate,
    amount,
    status,
    paymentRef,
  };

  if (existing.length > 0) {
    await db.update(paymentInstallments).set(payload).where(eq(paymentInstallments.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await db.insert(paymentInstallments).values(payload).returning({ id: paymentInstallments.id });
  return row.id;
}

export async function seedSkillupPaymentData() {
  const studentUserId = await getStudentUserId();
  const planId = await upsertPaymentPlan(studentUserId);
  const paidInstallmentId = await upsertInstallment(planId, 1, '2026-01-15', 15000, 'paid', 'PAY-2001');
  const pendingInstallmentId = await upsertInstallment(planId, 2, '2026-02-15', 15000, 'due', 'PAY-2002');

  console.log(
    JSON.stringify(
      {
        ok: true,
        studentUserId,
        planId,
        installments: [paidInstallmentId, pendingInstallmentId],
      },
      null,
      2
    )
  );
}

if (process.argv[1] !== undefined && process.argv[1].endsWith('seed-skillup.ts')) {
  void seedSkillupPaymentData();
}
