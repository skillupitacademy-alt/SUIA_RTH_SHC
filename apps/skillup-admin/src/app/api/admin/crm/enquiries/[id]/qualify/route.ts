import { NextRequest } from 'next/server';

import { findAdminEnquiry } from '@/lib/admin-demo-data';
import { jsonData, jsonError, requireAdminOrForbidden } from '@/lib/admin-bff';

async function qualify(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await context.params;
  const enquiry = findAdminEnquiry(id);
  if (enquiry === undefined) {
    return jsonError('Enquiry not found', 404);
  }

  return jsonData(
    {
      ...enquiry,
      status: 'qualified' as const,
      qualifiedAt: new Date().toISOString(),
      audit: 'AdmissionSaga: enquiry qualified',
    },
    200
  );
}

export { qualify as PATCH, qualify as POST };
