import { NextRequest } from 'next/server';
import { z } from 'zod';

import { adminBatches } from '@/lib/admin-demo-data';
import { jsonData, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';

const createBatchSchema = z.object({
  name: z.string().min(2),
  facultyName: z.string().min(2),
  program: z.string().min(2),
  capacity: z.coerce.number().int().positive(),
  startDate: z.string().min(4),
  sessionTopic: z.string().min(2),
});

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;
  return jsonData(adminBatches, 200);
}

export async function POST(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const parsed = await parseJsonOrFormBody(request, createBatchSchema);
  if (!parsed.ok) return parsed.response;

  return jsonData(
    {
      id: `batch-${crypto.randomUUID()}`,
      studentCount: 0,
      nextSessionAt: new Date().toISOString(),
      ...parsed.data,
    },
    201
  );
}
