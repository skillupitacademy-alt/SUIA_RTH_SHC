import { NextRequest } from 'next/server';

import { csvResponse, requireAdminOrForbidden } from '@/lib/admin-bff';
import { listAdminAuditLog, serializeAdminAuditCsv } from '@/lib/skillup-admin-data';

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const url = new URL(request.url);
  const rows = serializeAdminAuditCsv(
    await listAdminAuditLog({
      student: url.searchParams.get('student') ?? '',
      action: url.searchParams.get('action') ?? '',
      from: url.searchParams.get('from') ?? '',
      to: url.searchParams.get('to') ?? '',
    })
  );

  return csvResponse('skillup-audit-log.csv', rows);
}
