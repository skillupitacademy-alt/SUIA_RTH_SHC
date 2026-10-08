import { NextRequest } from 'next/server';
import { z } from 'zod';

import { listAdminPayments } from '@/lib/skillup-admin-data';
import { jsonData, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';
import { paymentInstallments, db } from '@quiz/db-people';
import { eq } from 'drizzle-orm';

const paymentSchema = z.object({
  userId: z.string().uuid(),
  studentName: z.string().min(2),
  installmentId: z.string().min(1),
  amount: z.coerce.number().nonnegative(),
  dueDate: z.string().min(4),
  paymentRef: z.string().min(2),
});

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;
  return jsonData(await listAdminPayments(), 200);
}

export async function POST(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const parsed = await parseJsonOrFormBody(request, paymentSchema);
  if (!parsed.ok) return parsed.response;

  const existing = await db
    .select({
      id: paymentInstallments.id,
      label: paymentInstallments.label,
      status: paymentInstallments.status,
      paymentRef: paymentInstallments.paymentRef,
    })
    .from(paymentInstallments)
    .where(eq(paymentInstallments.label, parsed.data.installmentId))
    .limit(1);

  if (existing[0] !== undefined && existing[0].status === 'paid' && existing[0].paymentRef === parsed.data.paymentRef) {
    return jsonData(
      {
        ...existing[0],
        studentName: parsed.data.studentName,
        amount: parsed.data.amount,
        dueDate: parsed.data.dueDate,
        idempotent: true,
      },
      200
    );
  }

  const updated = existing[0]
    ? await db
        .update(paymentInstallments)
        .set({
          status: 'paid',
          paymentRef: parsed.data.paymentRef,
        })
        .where(eq(paymentInstallments.id, existing[0].id))
        .returning({
          id: paymentInstallments.id,
          label: paymentInstallments.label,
          status: paymentInstallments.status,
          paymentRef: paymentInstallments.paymentRef,
        })
    : await db
        .insert(paymentInstallments)
        .values({
          studentUserId: parsed.data.userId,
          label: parsed.data.installmentId,
          dueDate: parsed.data.dueDate,
          amount: Math.trunc(parsed.data.amount),
          status: 'paid',
          paymentRef: parsed.data.paymentRef,
        })
        .returning({
          id: paymentInstallments.id,
          label: paymentInstallments.label,
          status: paymentInstallments.status,
          paymentRef: paymentInstallments.paymentRef,
        });

  return jsonData(
    {
      ...updated[0],
      studentName: parsed.data.studentName,
      amount: parsed.data.amount,
      dueDate: parsed.data.dueDate,
      idempotent: false,
    },
    200
  );
}
