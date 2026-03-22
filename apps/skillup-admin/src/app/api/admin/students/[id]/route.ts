import { NextRequest } from 'next/server';

import { findAdminStudent } from '@/lib/admin-demo-data';
import { jsonData, jsonError, requireAdminOrForbidden } from '@/lib/admin-bff';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await context.params;
  const student = findAdminStudent(id);
  if (student === undefined) {
    return jsonError('Student not found', 404);
  }

  return jsonData(student, 200);
}
