import { NextRequest } from 'next/server';

import { csvResponse, requireAdminOrForbidden } from '@/lib/admin-bff';
import { listAdminPayments } from '@/lib/skillup-admin-data';

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const adminPayments = await listAdminPayments();

  const rows = [
    'id,studentName,installmentId,amount,dueDate,overdueDays,status,paymentRef',
    ...adminPayments.map((payment) =>
      [
        payment.id,
        payment.studentName,
        payment.installmentId,
        payment.amount,
        payment.dueDate,
        String(payment.overdueDays),
        payment.status,
        payment.paymentRef,
      ].join(',')
    ),
  ];

  return csvResponse('skillup-payments.csv', rows);
}
