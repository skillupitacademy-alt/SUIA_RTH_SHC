import { NextRequest } from 'next/server';
import { z } from 'zod';

import { adminEnquiries } from '@/lib/admin-demo-data';
import { jsonData, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';

const createEnquirySchema = z.object({
  studentName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  program: z.string().min(2),
  counsellor: z.string().min(2),
});

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;
  return jsonData(adminEnquiries, 200);
}

export async function POST(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const parsed = await parseJsonOrFormBody(request, createEnquirySchema);
  if (!parsed.ok) return parsed.response;

  return jsonData(
    {
      id: `enquiry-${crypto.randomUUID()}`,
      userId: crypto.randomUUID(),
      status: 'new' as const,
      createdAt: new Date().toISOString(),
      ...parsed.data,
    },
    201
  );
}
