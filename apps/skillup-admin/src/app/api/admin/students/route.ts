import { NextRequest } from 'next/server';
import { z } from 'zod';

import { adminStudents, skillupDomainId } from '@/lib/admin-demo-data';
import { jsonData, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';

const createStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  batchId: z.string().min(1),
  batchName: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;
  return jsonData(adminStudents, 200);
}

export async function POST(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const parsed = await parseJsonOrFormBody(request, createStudentSchema);
  if (!parsed.ok) return parsed.response;

  return jsonData(
    {
      id: `student-${crypto.randomUUID()}`,
      userId: crypto.randomUUID(),
      domainId: skillupDomainId,
      enrolledAt: new Date().toISOString(),
      ...parsed.data,
    },
    201
  );
}
