import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { jsonData, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';
import { getAdminPaymentDetail } from '@/lib/skillup-admin-data';
import { db, paymentInstallments } from '@quiz/db-people';

const paymentSchema = z.object({
  installmentId: z.string().min(1),
  amount: z.coerce.number().nonnegative(),
  dueDate: z.string().min(4),
  paymentRef: z.string().min(2),
  status: z.enum(['paid', 'due', 'overdue']),
});

type RouteContext = {
  params: Promise<unknown>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = (await params) as { id: string };
  const detail = await getAdminPaymentDetail(id);
  if (detail === undefined) {
    return jsonData({ error: 'Not found' }, 404);
  }

  return jsonData(detail, 200);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = (await params) as { id: string };
  const parsed = await parseJsonOrFormBody(request, paymentSchema);
  if (!parsed.ok) return parsed.response;

  const [updated] = await db
    .update(paymentInstallments)
    .set({
      label: parsed.data.installmentId,
      amount: Math.trunc(parsed.data.amount),
      dueDate: parsed.data.dueDate,
      paymentRef: parsed.data.paymentRef,
      status: parsed.data.status,
    })
    .where(eq(paymentInstallments.id, id))
    .returning({ id: paymentInstallments.id });

  if (updated === undefined) {
    return jsonData({ error: 'Not found' }, 404);
  }

  const detail = await getAdminPaymentDetail(id);
  return jsonData({ updated: true, detail }, 200);
}
