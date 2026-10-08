import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { relayFacultyUpstreamResponse } from '@/lib/faculty-api';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const bodySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  resolvedAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid help request id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const response = await relayFacultyUpstreamResponse(
    req.headers,
    `/api/tutorial/faculty/help-requests/${params.data.id}`,
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed.data),
    }
  );
  if (response === null) {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 503 });
  }
  return response;
}
