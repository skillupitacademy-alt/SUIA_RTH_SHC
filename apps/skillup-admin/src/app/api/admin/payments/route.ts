import { NextRequest } from 'next/server';
import { z } from 'zod';

import { PlatformEventTypes, publishEvent } from '@quiz/events';

import { adminPayments, recordPaymentReceipt } from '@/lib/admin-demo-data';
import { jsonData, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';

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
  return jsonData(adminPayments, 200);
}

export async function POST(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const parsed = await parseJsonOrFormBody(request, paymentSchema);
  if (!parsed.ok) return parsed.response;

  const record = recordPaymentReceipt({
    paymentRef: parsed.data.paymentRef,
    studentName: parsed.data.studentName,
    installmentId: parsed.data.installmentId,
    amount: parsed.data.amount,
    dueDate: parsed.data.dueDate,
    paidAt: new Date().toISOString(),
  });

  try {
    await publishEvent(PlatformEventTypes.PAYMENT_RECEIVED, {
      userId: parsed.data.userId,
      installmentId: parsed.data.installmentId,
      amount: parsed.data.amount,
      paidAt: record.paidAt ?? new Date().toISOString(),
    }, {
      destinationUrl: process.env.SKILLUP_EVENT_URL ?? 'https://placeholder.invalid/events/payment-received',
    });
  } catch {
    // Demo mode should remain usable without QStash secrets.
  }

  return jsonData(
    {
      ...record.record,
      idempotent: record.idempotent,
    },
    200
  );
}
